// MAT query service (P6). Read-only queries over MAT record YAML with
// evidence-preserving responses: every value carries its raw evidence_type,
// a mapped evidence_class, and provenance. ML/ranking outputs built on top
// must use PREDICTED and never rewrite a record's own class.
// Run: node scripts/mat-query-service.mjs --symbol H --property ionization.first
//      node scripts/mat-query-service.mjs --search iron --json
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";

export const SERVICE_VERSION = "1.0.0";
const root = join(import.meta.dirname, "..");

// Raw evidence_type -> required evidence class. PREDICTED is reserved for
// service-computed outputs; DISPUTED requires an explicit dispute flag.
const CLASS_MAP = {
  MEASURED: ["MEASURED", "REPLICATED", "EARLY-EXPERIMENTAL"],
  CALCULATED: ["THEORETICAL", "COMPUTATIONAL", "DERIVED", "EVALUATED", "ESTABLISHED"],
  HYPOTHESIZED: ["HYPOTHESIS", "UNVERIFIED"],
  TRADITIONAL: ["HISTORICAL"],
};

export function evidenceClass(evidenceType) {
  for (const [cls, members] of Object.entries(CLASS_MAP)) {
    if (members.includes(evidenceType)) return cls;
  }
  return "UNKNOWN";
}

let indexCache = null;
function recordIndex() {
  if (indexCache) return indexCache;
  const out = [];
  const recordsDir = join(root, "records");
  for (const dir of readdirSync(recordsDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const structured = join(recordsDir, dir.name, "data", "structured");
    if (!existsSync(structured)) continue;
    for (const file of readdirSync(structured)) {
      if (!file.endsWith(".yaml")) continue;
      const rel = `records/${dir.name}/data/structured/${file}`;
      try {
        const doc = YAML.parse(readFileSync(join(root, rel), "utf8"));
        // Two header layouts exist: flat (mat_id/record_name/symbol) and
        // registry-style (record_id/identity.canonical_name/identity.symbol).
        const mat_id = doc.mat_id || doc.record_id || "";
        if (doc && typeof mat_id === "string" && mat_id) {
          out.push({
            mat_id,
            record_name: doc.record_name || doc.identity?.canonical_name || "",
            symbol: doc.symbol || doc.identity?.symbol || "",
            path: rel,
          });
        }
      } catch {
        // Corrupt YAML is a validation issue, not a query issue; skip here.
      }
    }
  }
  indexCache = out;
  return out;
}

export function findRecord({ symbol, mat_id } = {}) {
  const wantSym = (symbol || "").toLowerCase();
  const wantId = (mat_id || "").toUpperCase();
  if (!wantSym && !wantId) throw new Error("findRecord needs symbol or mat_id");
  const hits = recordIndex().filter(
    (r) =>
      (wantSym && r.symbol.toLowerCase() === wantSym) ||
      (wantId && (r.mat_id.toUpperCase() === wantId || r.mat_id.toUpperCase().startsWith(wantId))),
  );
  if (hits.length === 0) return null;
  // Prefer the main record file (<dirname>.yaml) over manifests/evaluations.
  const hit =
    hits.find((h) => {
      const file = h.path.split("/").pop();
      const dir = h.path.split("/")[1];
      return file === `${dir}.yaml`;
    }) || hits[0];
  const doc = YAML.parse(readFileSync(join(root, hit.path), "utf8"));
  return { ...hit, doc };
}

export function search(text) {
  const q = (text || "").toLowerCase();
  if (!q) return [];
  return recordIndex()
    .filter(
      (r) =>
        r.record_name.toLowerCase().includes(q) ||
        r.symbol.toLowerCase() === q ||
        r.mat_id.toLowerCase().includes(q),
    )
    .map(({ mat_id, record_name, symbol, path }) => ({ mat_id, record_name, symbol, path }));
}

function resolvePath(doc, path) {
  const parts = path.split(".").filter(Boolean);
  let node = doc;
  for (const part of parts) {
    if (node == null || typeof node !== "object" || !(part in node)) return { found: false };
    node = node[part];
  }
  return { found: true, node };
}

export function readProperty(doc, path) {
  const resolved = resolvePath(doc, path);
  if (!resolved.found || resolved.node == null) {
    return { property: path, found: false, evidence_class: "UNKNOWN" };
  }
  const node = resolved.node;
  if (typeof node !== "object") {
    return { property: path, found: true, kind: "scalar", value: node, evidence_class: "UNKNOWN" };
  }
  const isMeasurement =
    "value" in node || "minimum" in node || "maximum" in node || "evidence_type" in node;
  if (!isMeasurement) {
    return {
      property: path,
      found: true,
      kind: "group",
      children: Object.keys(node),
      evidence_class: "UNKNOWN",
    };
  }
  const evidence_type = node.evidence_type || null;
  return {
    property: path,
    found: true,
    kind: "measurement",
    value: node.value ?? null,
    minimum: node.minimum ?? null,
    maximum: node.maximum ?? null,
    unit: node.unit ?? null,
    uncertainty: node.uncertainty ?? null,
    confidence: node.confidence ?? null,
    evidence_type,
    evidence_class: evidence_type ? evidenceClass(evidence_type) : "UNKNOWN",
    source_id: node.source_id ?? null,
    source_alias: node.source_alias ?? null,
    source_locator: node.source_locator ?? null,
    method: node.method ?? null,
  };
}

export function query({ symbol, mat_id, properties = [] } = {}) {
  const record = findRecord({ symbol, mat_id });
  if (!record) {
    return {
      found: false,
      query: { symbol: symbol || null, mat_id: mat_id || null },
      provenance: { service: `mat-query-service/${SERVICE_VERSION}`, generated_at: new Date().toISOString() },
    };
  }
  return {
    found: true,
    mat_id: record.mat_id,
    record_name: record.record_name,
    symbol: record.symbol,
    results: properties.map((p) => readProperty(record.doc, p)),
    provenance: {
      service: `mat-query-service/${SERVICE_VERSION}`,
      record_path: record.path,
      generated_at: new Date().toISOString(),
    },
  };
}

export function startServer({ port = 8472, host = "127.0.0.1" } = {}) {
  // Read-only loopback HTTP surface for the Aetherius MAT provider (P10).
  // Binds loopback only; no writes, no query execution beyond record reads.
  return import("node:http").then(({ createServer }) => {
    const server = createServer((req, res) => {
      const send = (status, obj) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(obj));
      };
      try {
        if (req.method !== "GET") return send(405, { error: "read-only service" });
        const url = new URL(req.url || "/", "http://localhost");
        if (url.pathname === "/health") {
          return send(200, { ok: true, service: `mat-query-service/${SERVICE_VERSION}` });
        }
        if (url.pathname === "/query") {
          const properties = url.searchParams.getAll("property");
          return send(
            200,
            query({
              symbol: url.searchParams.get("symbol"),
              mat_id: url.searchParams.get("mat_id"),
              properties,
            }),
          );
        }
        if (url.pathname === "/search") {
          return send(200, { results: search(url.searchParams.get("q") || "") });
        }
        return send(404, { error: "unknown endpoint" });
      } catch (error) {
        return send(500, { error: String((error && error.message) || error) });
      }
    });
    return new Promise((resolve, reject) => {
      server.on("error", reject);
      server.listen(port, host, () => resolve(server));
    });
  });
}

function printUsage() {
  console.log(`mat-query-service/${SERVICE_VERSION}
Usage:
  node scripts/mat-query-service.mjs --symbol H --property ionization.first [--property atomic_weight]
  node scripts/mat-query-service.mjs --mat-id MAT:0026 --property density
  node scripts/mat-query-service.mjs --search iron [--json]
  node scripts/mat-query-service.mjs --serve [--port 8472]
Options: --json (default pretty), --pretty`);
}

const isMain = process.argv[1] && process.argv[1].endsWith("mat-query-service.mjs");
if (isMain) {
  const argv = process.argv.slice(2);
  const getAll = (flag) => argv.filter((a, i) => argv[i - 1] === flag);
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
  };
  const asJson = !argv.includes("--pretty");
  const out = (obj) => console.log(asJson ? JSON.stringify(obj) : JSON.stringify(obj, null, 2));
  if (argv.includes("--help") || argv.includes("-h")) {
    printUsage();
  } else if (get("--search")) {
    out({ results: search(get("--search")) });
  } else if (get("--symbol") || get("--mat-id")) {
    const properties = getAll("--property");
    out(query({ symbol: get("--symbol"), mat_id: get("--mat-id"), properties }));
  } else if (argv.includes("--serve")) {
    const portIndex = argv.indexOf("--port");
    const port = portIndex >= 0 ? Number(argv[portIndex + 1]) || 8472 : 8472;
    startServer({ port }).then((server) => {
      const address = server.address();
      console.log(`mat-query-service listening on 127.0.0.1:${address.port}`);
    });
  } else {
    printUsage();
    process.exitCode = 2;
  }
}

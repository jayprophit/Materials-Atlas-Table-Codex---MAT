// Validates visual/table/graph manifests against schemas and the filesystem.
// GENERATED/COMPLETE files must exist; unregistered files are reported.
// Run: npm run validate:assets
import { loadYaml, walkFiles, validateSchema, issue, warn, summary, root } from "./lib.mjs";
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

let failed = 0;
// Per-record filename sets so nested paths (images/scientific/…) resolve.
const treeCache = new Map();
function treeFiles(dir) {
  if (!treeCache.has(dir)) {
    const s = new Set();
    for (const f of walkFiles(dir, () => true)) s.add(f.split("/").pop());
    treeCache.set(dir, s);
  }
  return treeCache.get(dir);
}
const sched = [
  { re: /visual-manifest/i, schema: "data/schema/1.0.0/mat-visual-manifest.schema.json", kind: "visual" },
  { re: /table-manifest/i, schema: "data/schema/1.0.0/mat-table-manifest.schema.json", kind: "table" },
  { re: /graph-manifest/i, schema: "data/schema/1.0.0/mat-graph-manifest.schema.json", kind: "graph" },
];
const DONE = /^(EXISTS|GENERATED|COMPLETE|CORE-COMPLETE|ARCHITECTURE-COMPLETE)$/;
const PENDING = /(REQUIRED|PENDING|NOT-GENERATED|NOT-YET|EXTRACTION)/;

for (const { re, schema, kind } of sched) {
  for (const f of walkFiles("records", (x) => re.test(x) && x.endsWith(".yaml"))) {
    const rec = "MAT:" + (f.match(/records\/(\d{4})-/) || [])[1];
    const dir = f.split("/").slice(0, 2).join("/");
    let doc;
    try { doc = loadYaml(f); }
    catch (e) { issue(f, rec, null, `YAML parse error: ${e.message.split("\n")[0]}`, "valid YAML"); failed++; continue; }
    for (const e of validateSchema(schema, doc))
      { issue(f, rec, "manifest", `schema: ${e}`, `conform to ${schema.split("/").pop()}`); failed++; }
    const entries = [];
    if (kind === "visual" && doc.visuals) {
      for (const [slot, s] of Object.entries(doc.visuals)) {
        const files = [...(s.assets || []).map((a) => a.filename).filter(Boolean),
          s.filename, s.file, ...(s.files || [])].filter(Boolean);
        const desc = s.description || s.alt_text || s.alt || "";
        for (const name of files) entries.push({ slot, name, status: s.status || "", sub: s.path || "", desc });
        if (files.length && !desc && DONE.test(s.status || ""))
          warn(f, rec, slot, `Visual slot "${slot}" has no description/alt-text`, "add description or alt_text field for accessibility");
      }
    }
    if (kind === "table") for (const t of doc.tables || []) {
      const fname = t.file || t.filename;
      if (fname) entries.push({ slot: t.id || t.table_id || t.name || "", name: fname, status: t.status || "", sub: "tables/" });
    }
    if (kind === "graph") for (const g of doc.graphs || []) {
      if (!g.filename) continue; // planning entry: nothing on disk to verify
      entries.push({ slot: g.graph_id || g.id || "", name: g.filename, status: g.status || "", sub: "graphs/" });
      if (g.data_filename) entries.push({ slot: g.graph_id || g.id || "", name: "data/" + g.data_filename, status: g.status || "", sub: "graphs/" });
    }
    for (const en of entries) {
      if (!en.name) continue;
      const found = treeFiles(dir).has(en.name.split("/").pop());
      if(found && /\.png$/i.test(en.name) && DONE.test(en.status)){
        const path=walkFiles(dir).find(p=>p.endsWith('/'+en.name.split('/').pop()));
        const bytes=readFileSync(join(root,path));
        if(bytes.length<33||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.toString('ascii',12,16)!=='IHDR'||bytes.readUInt32BE(16)===0||bytes.readUInt32BE(20)===0){
          issue(f,rec,en.slot,'Generated PNG has no valid PNG signature/dimensions','valid on-disk PNG plus separate visual/content review');failed++;
        }
      }
      if (DONE.test(en.status) && !found)
        { issue(f, rec, en.slot || en.name, `${en.name} marked ${en.status} but file is missing`, "status must agree with the filesystem"); failed++; }
      if (!DONE.test(en.status) && !PENDING.test(en.status) && found)
        warn(f, rec, en.slot || en.name, `${en.name} exists on disk but slot status is ${en.status || "unset"}`, "flip to GENERATED/COMPLETE when the file lands");
    }
  }
}
process.exitCode = summary("validate:assets") || failed ? 1 : 0;

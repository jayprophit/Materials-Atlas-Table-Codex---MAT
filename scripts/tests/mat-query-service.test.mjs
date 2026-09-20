// Query-service tests against real MAT records. Run: npm test
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evidenceClass,
  findRecord,
  search,
  readProperty,
  query,
} from "../mat-query-service.mjs";

describe("mat-query-service", () => {
  it("finds hydrogen by symbol with real header fields", () => {
    const record = findRecord({ symbol: "H" });
    assert.ok(record);
    assert.equal(record.mat_id, "MAT:0001");
    assert.equal(record.record_name, "Hydrogen");
    assert.ok(record.path.includes("records/0001-Hydrogen-H/"));
  });

  it("finds iron by mat_id", () => {
    const record = findRecord({ mat_id: "MAT:0026" });
    assert.ok(record);
    assert.equal(record.symbol, "Fe");
  });

  it("returns null for unknown records", () => {
    assert.equal(findRecord({ symbol: "Xx" }), null);
  });

  it("reads hydrogen first ionisation with evidence preserved", () => {
    const record = findRecord({ symbol: "H" });
    const result = readProperty(record.doc, "ionization.first");
    assert.equal(result.found, true);
    assert.equal(result.kind, "measurement");
    assert.equal(result.value, 13.598434599702);
    assert.equal(result.unit, "eV");
    assert.equal(result.uncertainty, 0.000000000012);
    assert.equal(result.evidence_type, "THEORETICAL");
    assert.equal(result.evidence_class, "CALCULATED");
    assert.ok(result.source_id);
  });

  it("reads hydrogen atomic weight interval", () => {
    const record = findRecord({ symbol: "H" });
    const result = readProperty(record.doc, "atomic_weight");
    assert.equal(result.found, true);
    assert.equal(result.minimum, 1.00784);
    assert.equal(result.maximum, 1.00811);
  });

  it("marks missing properties UNKNOWN, never invented", () => {
    const record = findRecord({ symbol: "H" });
    const result = readProperty(record.doc, "no.such.property");
    assert.equal(result.found, false);
    assert.equal(result.evidence_class, "UNKNOWN");
  });

  it("maps evidence vocabulary to required classes", () => {
    assert.equal(evidenceClass("MEASURED"), "MEASURED");
    assert.equal(evidenceClass("REPLICATED"), "MEASURED");
    assert.equal(evidenceClass("THEORETICAL"), "CALCULATED");
    assert.equal(evidenceClass("COMPUTATIONAL"), "CALCULATED");
    assert.equal(evidenceClass("HYPOTHESIS"), "HYPOTHESIZED");
    assert.equal(evidenceClass("HISTORICAL"), "TRADITIONAL");
    assert.equal(evidenceClass("SOMETHING-ELSE"), "UNKNOWN");
  });

  it("query returns provenance with every response", () => {
    const response = query({ symbol: "H", properties: ["ionization.first"] });
    assert.equal(response.found, true);
    assert.equal(response.mat_id, "MAT:0001");
    assert.equal(response.results.length, 1);
    assert.ok(response.provenance.record_path);
    assert.ok(response.provenance.generated_at);
    assert.match(response.provenance.service, /^mat-query-service\//);
  });

  it("query for unknown records reports found:false with provenance", () => {
    const response = query({ symbol: "Xx", properties: ["density"] });
    assert.equal(response.found, false);
    assert.ok(response.provenance.generated_at);
  });

  it("search finds records by name fragment", () => {
    const hits = search("iron");
    assert.ok(hits.some((h) => h.mat_id === "MAT:0026"));
  });
});

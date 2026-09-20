// Serve-mode tests: loopback HTTP surface for the Aetherius MAT provider.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../mat-query-service.mjs";

describe("mat-query-service serve", () => {
  let server = null;
  let base = "";
  before(async () => {
    server = await startServer({ port: 0 });
    const address = server.address();
    base = `http://127.0.0.1:${address.port}`;
  });
  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("serves health", async () => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
  });

  it("serves real record queries with evidence", async () => {
    const response = await fetch(
      `${base}/query?symbol=H&property=ionization.first`,
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.found, true);
    assert.equal(body.results[0].value, 13.598434599702);
    assert.equal(body.results[0].evidence_class, "CALCULATED");
  });

  it("serves search", async () => {
    const response = await fetch(`${base}/search?q=iron`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.results.some((r) => r.mat_id === "MAT:0026"));
  });

  it("rejects writes and unknown endpoints", async () => {
    const post = await fetch(`${base}/query?symbol=H`, { method: "POST" });
    assert.equal(post.status, 405);
    const missing = await fetch(`${base}/nope`);
    assert.equal(missing.status, 404);
  });
});

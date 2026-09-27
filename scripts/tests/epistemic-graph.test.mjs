import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ClaimRegistry} from '../claims.mjs';
import {
  AUTHORABLE_RELATIONS,
  EpistemicGraph,
  RELATION_TYPES,
  validateRelation,
} from '../epistemic-graph.mjs';

function claim(over = {}) {
  return {
    assertion: 'Alloy X retains strength above 600C',
    domain: 'materials',
    subject: 'Alloy X',
    epistemic_status: 'HYPOTHESIS',
    sources: [{ref: 'lab-notebook-42', kind: 'primary'}],
    provenance: 'fixture',
    ...over,
  };
}

function registryWith(...assertions) {
  const registry = new ClaimRegistry();
  const ids = [];
  for (const assertion of assertions) {
    const {outcome} = registry.register(claim({assertion}), () => '2026-09-27T00:00:00.000Z');
    assert.equal(outcome.status, 'registered');
    ids.push(outcome.record.claim_id);
  }
  return {registry, ids};
}

function graphFor(registry) {
  return new EpistemicGraph(id => registry.lookup(id));
}

function relation(from, rel, to, over = {}) {
  return {
    fromClaimRef: from,
    relation: rel,
    toClaimRef: to,
    evidenceRefs: ['tensile-run-7'],
    provenance: 'fixture',
    ...over,
  };
}

test('declares the closed relation vocabulary, with supersession derived-only', () => {
  assert.deepEqual([...RELATION_TYPES], ['SUPPORTS', 'CONTRADICTS', 'DERIVED_FROM', 'SUPERSEDES']);
  assert.deepEqual([...AUTHORABLE_RELATIONS], ['SUPPORTS', 'CONTRADICTS', 'DERIVED_FROM']);
});

test('records a support relation between canonical claim ids', () => {
  const {registry, ids} = registryWith('Alloy X retains strength', 'Furnace Y reaches 700C');
  const graph = graphFor(registry);
  const {outcome} = graph.addRelation(relation(ids[1], 'SUPPORTS', ids[0]));
  assert.equal(outcome.status, 'added');
  assert.equal(outcome.edge.fromClaimRef, ids[1]);
  assert.equal(outcome.edge.toClaimRef, ids[0]);
  assert.equal(outcome.edge.derived, false);
});

test('stores references, never claim text', () => {
  const {registry, ids} = registryWith('Alloy X retains strength', 'Furnace Y reaches 700C');
  const graph = graphFor(registry);
  const {outcome} = graph.addRelation(relation(ids[1], 'SUPPORTS', ids[0]));
  assert.ok(!JSON.stringify(outcome.edge).includes('retains strength'));
});

test('adding an edge never edits the canonical claim', () => {
  const {registry, ids} = registryWith('Alloy X retains strength', 'Furnace Y reaches 700C');
  const before = JSON.stringify(registry.lookup(ids[0]));
  const graph = graphFor(registry);
  graph.addRelation(relation(ids[1], 'SUPPORTS', ids[0]));
  assert.equal(JSON.stringify(registry.lookup(ids[0])), before);
});

test('identical re-adds are idempotent; new evidence merges without colliding', () => {
  const {registry, ids} = registryWith('Claim one here', 'Claim two here');
  const graph = graphFor(registry);
  const first = graph.addRelation(relation(ids[0], 'SUPPORTS', ids[1]));
  assert.equal(first.outcome.status, 'added');
  const same = graph.addRelation(relation(ids[0], 'SUPPORTS', ids[1]));
  assert.equal(same.outcome.status, 'identical');
  const merged = graph.addRelation(relation(ids[0], 'SUPPORTS', ids[1], {evidenceRefs: ['tensile-run-8']}));
  assert.equal(merged.outcome.status, 'merged-evidence');
  assert.deepEqual(merged.outcome.edge.evidenceRefs, ['tensile-run-7', 'tensile-run-8']);
  assert.equal(graph.snapshot().length, 1);
});

test('rejects authored SUPERSEDES: supersession belongs to the registry', () => {
  const {registry, ids} = registryWith('Claim one here', 'Claim two here');
  const graph = graphFor(registry);
  const {outcome} = graph.addRelation(relation(ids[0], 'SUPERSEDES', ids[1]));
  assert.equal(outcome.status, 'rejected');
  assert.match(outcome.reason, /supersedes-derived-only/);
});

test('projects SUPERSEDES edges from canonical claim truth', () => {
  const registry = new ClaimRegistry();
  const first = registry.register(claim({assertion: 'Old reading stands'}), () => '2026-09-27T00:00:00.000Z');
  const second = registry.register(
    claim({assertion: 'Revised reading stands', supersedes: first.outcome.record.claim_id}),
    () => '2026-09-27T00:00:00.000Z',
  );
  const graph = graphFor(registry);
  const projected = graph.projectSupersession(registry.snapshot());
  assert.equal(projected.length, 1);
  assert.equal(projected[0].fromClaimRef, second.outcome.record.claim_id);
  assert.equal(projected[0].toClaimRef, first.outcome.record.claim_id);
  assert.equal(projected[0].relation, 'SUPERSEDES');
  assert.equal(projected[0].derived, true);
});

test('rejects unknown claim refs instead of fabricating placeholder nodes', () => {
  const {registry, ids} = registryWith('Claim one here');
  const graph = graphFor(registry);
  const {outcome} = graph.addRelation(relation(ids[0], 'SUPPORTS', 'CLM-nope-00000000'));
  assert.equal(outcome.status, 'rejected');
  assert.match(outcome.reason, /unknown-to-claim/);
  assert.deepEqual(validateRelation(relation('CLM-nope-00000000', 'SUPPORTS', ids[0]), id => registry.lookup(id)), ['unknown-from-claim']);
});

test('rejects self-edges for every relation', () => {
  const {registry, ids} = registryWith('Claim one here');
  const graph = graphFor(registry);
  for (const rel of ['SUPPORTS', 'CONTRADICTS', 'DERIVED_FROM']) {
    const {outcome} = graph.addRelation(relation(ids[0], rel, ids[0]));
    assert.equal(outcome.status, 'rejected');
    assert.match(outcome.reason, /self-edge-invalid/);
  }
});

test('rejects unknown relations, unknown fields, and missing provenance', () => {
  const {registry, ids} = registryWith('Claim one here', 'Claim two here');
  assert.deepEqual(
    validateRelation(relation(ids[0], 'CAUSES', ids[1]), () => ({})),
    ['relation-invalid'],
  );
  const graph = graphFor(registry);
  assert.match(graph.addRelation({...relation(ids[0], 'SUPPORTS', ids[1]), weight: 0.9}).outcome.reason, /unknown-field:weight/);
  assert.match(graph.addRelation(relation(ids[0], 'SUPPORTS', ids[1], {provenance: ''})).outcome.reason, /provenance-required/);
  assert.match(graph.addRelation(relation(ids[0], 'SUPPORTS', ids[1], {observed_date: 'not-a-date'})).outcome.reason, /date-invalid/);
});

test('direction matters: A SUPPORTS B never implies B SUPPORTS A', () => {
  const {registry, ids} = registryWith('Claim one here', 'Claim two here');
  const graph = graphFor(registry);
  graph.addRelation(relation(ids[0], 'SUPPORTS', ids[1]));
  assert.deepEqual(graph.neighbours(ids[0], {direction: 'out'}).map(n => n.claimRef), [ids[1]]);
  assert.deepEqual(graph.neighbours(ids[1], {direction: 'out'}), []);
  assert.deepEqual(graph.neighbours(ids[1], {direction: 'in'}).map(n => n.claimRef), [ids[0]]);
});

test('supportsFor and contradictionsFor read the recorded directions', () => {
  const {registry, ids} = registryWith('Base claim stated', 'Helper claim stated', 'Rival claim stated');
  const graph = graphFor(registry);
  graph.addRelation(relation(ids[1], 'SUPPORTS', ids[0]));
  graph.addRelation(relation(ids[2], 'CONTRADICTS', ids[0]));
  assert.deepEqual(graph.supportsFor(ids[0]), [ids[1]]);
  assert.deepEqual(graph.contradictionsFor(ids[0]), [ids[2]]);
  // Contradictions coexist: neither side is deleted or promoted.
  assert.ok(graph.lookupClaim(ids[1]));
  assert.ok(graph.lookupClaim(ids[2]));
});

test('traversal is cycle-safe, bounded, and deterministic', () => {
  const {registry, ids} = registryWith('Alpha stated', 'Beta stated', 'Gamma stated');
  const graph = graphFor(registry);
  graph.addRelation(relation(ids[0], 'SUPPORTS', ids[1]));
  graph.addRelation(relation(ids[1], 'SUPPORTS', ids[2]));
  graph.addRelation(relation(ids[2], 'SUPPORTS', ids[0]));
  const reached = graph.traverse(ids[0]);
  assert.deepEqual(reached.map(r => r.claimRef).sort(), [ids[1], ids[2]].sort());
  assert.ok(reached.every(r => r.depth >= 1));
  const shallow = graph.traverse(ids[0], {maxDepth: 1});
  assert.deepEqual(shallow.map(r => r.claimRef), [ids[1]]);
});

test('traversal never follows contradictions unless explicitly asked', () => {
  const {registry, ids} = registryWith('Alpha stated', 'Beta stated');
  const graph = graphFor(registry);
  graph.addRelation(relation(ids[0], 'CONTRADICTS', ids[1]));
  assert.deepEqual(graph.traverse(ids[0]), []);
  assert.deepEqual(graph.traverse(ids[0], {relations: ['CONTRADICTS']}).map(r => r.claimRef), [ids[1]]);
});

test('snapshot and queries are deterministic from scrambled insertion', () => {
  const {registry, ids} = registryWith('Alpha stated', 'Beta stated', 'Gamma stated');
  const build = (order) => {
    const graph = graphFor(registry);
    for (const [from, rel, to] of order) graph.addRelation(relation(from, rel, to));
    return JSON.stringify({snapshot: graph.snapshot(), traverse: graph.traverse(ids[0])});
  };
  const edges = [
    [ids[2], 'SUPPORTS', ids[0]],
    [ids[0], 'DERIVED_FROM', ids[1]],
    [ids[1], 'CONTRADICTS', ids[2]],
  ];
  assert.equal(build(edges), build([...edges].reverse()));
});

test('constructor requires a claim lookup; bad query options fail loudly', () => {
  assert.throws(() => new EpistemicGraph(), /claim lookup function/);
  const {registry, ids} = registryWith('Alpha stated');
  const graph = graphFor(registry);
  assert.throws(() => graph.neighbours(ids[0], {direction: 'sideways'}), /direction must be/);
  assert.throws(() => graph.neighbours(ids[0], {relations: ['CAUSES']}), /unknown relation/);
  assert.throws(() => graph.traverse(ids[0], {maxDepth: 0}), /maxDepth must be/);
});

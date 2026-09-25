import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ClaimRegistry, EPISTEMIC_STATUSES, claimIdFor, validateClaim} from '../claims.mjs';

function input(over = {}) {
  return {
    assertion: 'Alloy X retains strength above 600C',
    domain: 'materials',
    subject: 'Alloy X',
    epistemic_status: 'HYPOTHESIS',
    sources: [{ref: 'lab-notebook-42', kind: 'primary'}],
    evidence: [{ref: 'tensile-run-7', stance: 'supporting'}],
    testability: 'repeat tensile run',
    valid_from: '2026-01-01',
    provenance: 'fixture',
    tags: ['high-temp'],
    ...over,
  };
}

test('registers a valid claim with a deterministic id', () => {
  const registry = new ClaimRegistry();
  const {outcome} = registry.register(input(), () => '2026-09-25T00:00:00.000Z');
  assert.equal(outcome.status, 'registered');
  assert.match(outcome.record.claim_id, /^CLM-alloy-x-retains-strength-above-600c-[0-9a-f]{8}$/);
  assert.equal(outcome.record.claim_id, claimIdFor(input().assertion, input().domain));
  assert.equal(outcome.record.version, '1.0.0');
});

test('all canonical epistemic states validate', () => {
  assert.deepEqual(EPISTEMIC_STATUSES, ['ESTABLISHED', 'EMERGING', 'HYPOTHESIS', 'SPECULATIVE', 'FICTIONAL_INSPIRATION', 'UNVERIFIED', 'DISPUTED', 'SUPERSEDED']);
  for (const status of EPISTEMIC_STATUSES) {
    assert.deepEqual(validateClaim(input({epistemic_status: status})), []);
  }
  assert.deepEqual(validateClaim(input({epistemic_status: 'TRUE'})), ['status-invalid']);
});

test('unverified and disputed claims stay unpromoted', () => {
  const registry = new ClaimRegistry();
  const u = registry.register(input({epistemic_status: 'UNVERIFIED'}));
  const d = registry.register(input({epistemic_status: 'DISPUTED', assertion: 'Alloy X fails above 600C'}));
  assert.equal(u.outcome.record.epistemic_status, 'UNVERIFIED');
  assert.equal(d.outcome.record.epistemic_status, 'DISPUTED');
  const rows = registry.query({});
  assert(rows.some(r => r.epistemic_status === 'UNVERIFIED'));
  assert(rows.some(r => r.epistemic_status === 'DISPUTED'));
});

test('research and speculative claims keep attribution without promotion', () => {
  const registry = new ClaimRegistry();
  const {outcome} = registry.register(input({
    epistemic_status: 'FICTIONAL_INSPIRATION',
    assertion: 'Resonance drive concept',
    sources: [{ref: 'novel-ch-3', kind: 'fiction'}],
  }));
  assert.equal(outcome.record.epistemic_status, 'FICTIONAL_INSPIRATION');
  assert.equal(outcome.record.sources[0].ref, 'novel-ch-3');
});

test('evidence attachment never auto-verifies', () => {
  const registry = new ClaimRegistry();
  const {outcome} = registry.register(input({epistemic_status: 'HYPOTHESIS'}));
  assert.equal(outcome.record.epistemic_status, 'HYPOTHESIS');
});

test('contradictions stored side by side', () => {
  const registry = new ClaimRegistry();
  registry.register(input({assertion: 'Alloy X retains strength'}));
  registry.register(input({assertion: 'Alloy X loses strength', epistemic_status: 'DISPUTED'}));
  assert.equal(registry.snapshot().length, 2);
});

test('supersession retains the old record', () => {
  const registry = new ClaimRegistry();
  const first = registry.register(input({assertion: 'Old conductivity value'}));
  const second = registry.register(input({
    assertion: 'Revised conductivity value',
    epistemic_status: 'EMERGING',
    supersedes: first.outcome.record.claim_id,
  }));
  assert.equal(second.outcome.record.supersedes, first.outcome.record.claim_id);
  assert.notEqual(second.outcome.record.claim_id, first.outcome.record.claim_id);
  assert.equal(registry.snapshot().length, 2);
});

test('temporal validation', () => {
  assert.deepEqual(validateClaim(input({valid_from: '2026-06-01', valid_to: '2026-01-01'})), ['temporal-range-invalid']);
  const registry = new ClaimRegistry();
  registry.register(input({valid_from: '2026-01-01', valid_to: '2026-12-31'}));
  assert.equal(registry.query({valid_on: '2026-06-01'}).length, 1);
  assert.equal(registry.query({valid_on: '2027-01-01'}).length, 0);
  assert.throws(() => registry.query({valid_on: 'someday'}), /ISO date/);
});

test('malformed claims rejected', () => {
  assert.deepEqual(validateClaim(input({assertion: '  '})), ['assertion-required']);
  assert.deepEqual(validateClaim(input({domain: ''})), ['domain-required']);
  assert.deepEqual(validateClaim(input({sources: []})), ['sources-required']);
  assert.deepEqual(validateClaim(input({sources: [{kind: 'x'}]})), ['sources-required']);
  assert.deepEqual(validateClaim(input({evidence: [{ref: 'e', stance: 'maybe'}]})), ['evidence-invalid']);
  assert.deepEqual(validateClaim(input({provenance: ''})), ['provenance-required']);
  assert.deepEqual(validateClaim(input({tags: ['ok', '  ' ]})), ['tags-invalid']);
  const registry = new ClaimRegistry();
  const bad = registry.register(input({assertion: ''}));
  assert.equal(bad.outcome.status, 'rejected');
  assert.equal(bad.records.length, 0);
});

test('idempotent identical registration, conflicting overwrite rejected', () => {
  const registry = new ClaimRegistry();
  registry.register(input());
  const again = registry.register(input());
  assert.equal(again.outcome.status, 'identical');
  assert.equal(again.records.length, 1);
  const clash = registry.register(input({epistemic_status: 'ESTABLISHED'}));
  assert.equal(clash.outcome.status, 'conflict');
  assert.match(clash.outcome.reason, /immutable/);
});

test('exact structured queries with deterministic order', () => {
  const registry = new ClaimRegistry();
  registry.register(input({domain: 'b', assertion: 'Second claim'}));
  registry.register(input({domain: 'a', assertion: 'First claim', tags: ['t']}));
  assert.deepEqual(registry.query({domain: 'a'}).map(r => r.domain), ['a']);
  assert.deepEqual(registry.query({status: 'HYPOTHESIS'}).length, 2);
  assert.deepEqual(registry.query({source_ref: 'lab-notebook-42'}).length, 2);
  assert.deepEqual(registry.query({evidence_ref: 'tensile-run-7'}).length, 2);
  assert.deepEqual(registry.query({tag: 't'}).length, 1);
  assert.deepEqual(registry.query({limit: 1}).length, 1);
  assert.throws(() => registry.query({limit: 0}), /positive integer/);
  const listed = registry.snapshot().map(r => r.claim_id);
  assert.deepEqual(listed, [...listed].sort());
  assert(registry.lookup('CLM:nope-00000000') === null);
});

test('returned objects are immutable clones', () => {
  const registry = new ClaimRegistry();
  const {outcome} = registry.register(input());
  outcome.record.assertion = 'MUTATED';
  assert.notEqual(registry.lookup(outcome.record.claim_id).assertion, 'MUTATED');
});

test('no semantic search surface exists', () => {
  const registry = new ClaimRegistry();
  assert.equal(typeof registry.search, 'undefined');
  assert.equal(typeof registry.embed, 'undefined');
  assert.equal(typeof registry.rank, 'undefined');
});

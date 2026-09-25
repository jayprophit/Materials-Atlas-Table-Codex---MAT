// Claim registry (REQ-mat-claim-registry, P26, owner mat).
//
// Queryable claim records with explicit epistemic status. A claim
// RECORDED is never a claim VERIFIED: storing an assertion, attaching
// evidence, or retrieving a record endorses nothing. Sources keep
// attribution; external claims are never rewritten as MAT facts;
// contradictions are stored, never auto-resolved (graph relations
// belong to the epistemic graph, not this registry).
//
// Style follows MAT scripts conventions (node:test consumers, plain
// objects, JSON-clone immutability).
import {createHash} from 'node:crypto';

export const EPISTEMIC_STATUSES = Object.freeze([
  'ESTABLISHED',
  'EMERGING',
  'HYPOTHESIS',
  'SPECULATIVE',
  'FICTIONAL_INSPIRATION',
  'UNVERIFIED',
  'DISPUTED',
  'SUPERSEDED',
]);

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

export function claimIdFor(assertion, domain) {
  const slug = String(assertion).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'claim';
  const hash = createHash('sha256').update(`${String(domain).trim()}\n${String(assertion).trim()}`, 'utf8').digest('hex').slice(0, 8);
  return `CLM-${slug}-${hash}`;
}

export function validateClaim(claim) {
  const problems = [];
  if (!claim || typeof claim !== 'object') return ['claim-shape'];
  if (!nonEmpty(claim.assertion)) problems.push('assertion-required');
  if (!nonEmpty(claim.domain)) problems.push('domain-required');
  if (!EPISTEMIC_STATUSES.includes(claim.epistemic_status)) problems.push('status-invalid');
  if (!Array.isArray(claim.sources) || claim.sources.length === 0 ||
      claim.sources.some(s => !s || !nonEmpty(s.ref))) problems.push('sources-required');
  if (claim.evidence !== undefined) {
    if (!Array.isArray(claim.evidence) ||
        claim.evidence.some(e => !e || !nonEmpty(e.ref) || !['supporting', 'counter'].includes(e.stance))) {
      problems.push('evidence-invalid');
    }
  }
  if (!nonEmpty(claim.provenance)) problems.push('provenance-required');
  for (const field of ['valid_from', 'valid_to', 'observed_date', 'published_date']) {
    if (claim[field] !== undefined && !isIsoDate(claim[field])) problems.push('date-invalid');
  }
  if (claim.valid_from !== undefined && claim.valid_to !== undefined && claim.valid_to < claim.valid_from) {
    problems.push('temporal-range-invalid');
  }
  if (claim.supersedes !== undefined && !nonEmpty(claim.supersedes)) problems.push('supersedes-invalid');
  if (claim.tags !== undefined && (!Array.isArray(claim.tags) || claim.tags.some(t => !nonEmpty(t)))) {
    problems.push('tags-invalid');
  }
  return [...new Set(problems)].sort();
}

function freeze(record) {
  return JSON.parse(JSON.stringify(record));
}

export class ClaimRegistry {
  constructor() {
    this.records = new Map();
  }

  register(input, now = () => new Date().toISOString()) {
    const problems = validateClaim(input);
    if (problems.length > 0) {
      return {records: this.snapshot(), outcome: {status: 'rejected', reason: `invalid claim: ${problems.join(',')}`}};
    }
    const claim_id = claimIdFor(input.assertion, input.domain);
    const record = freeze({
      claim_id,
      version: '1.0.0',
      assertion: input.assertion.trim(),
      domain: input.domain.trim(),
      subject: input.subject?.trim() || '',
      epistemic_status: input.epistemic_status,
      sources: input.sources.map(s => ({ref: s.ref.trim(), kind: s.kind?.trim() || 'unknown'})),
      evidence: (input.evidence ?? []).map(e => ({ref: e.ref.trim(), stance: e.stance})),
      testability: input.testability?.trim() || '',
      valid_from: input.valid_from,
      valid_to: input.valid_to,
      observed_date: input.observed_date,
      published_date: input.published_date,
      supersedes: input.supersedes?.trim() || '',
      tags: [...(input.tags ?? [])],
      provenance: input.provenance.trim(),
      created_at: now(),
    });
    const existing = this.records.get(claim_id);
    if (existing) {
      const {created_at: _a, ...restExisting} = existing;
      const {created_at: _b, ...restRecord} = record;
      if (JSON.stringify(restExisting) === JSON.stringify(restRecord)) {
        return {records: this.snapshot(), outcome: {status: 'identical', record: freeze(existing)}};
      }
      return {records: this.snapshot(), outcome: {status: 'conflict', claim_id, reason: 'claim id collision with different content; records are immutable'}};
    }
    this.records.set(claim_id, freeze(record));
    return {records: this.snapshot(), outcome: {status: 'registered', record: freeze(record)}};
  }

  snapshot() {
    return [...this.records.values()].map(freeze).sort((a, b) => (a.claim_id < b.claim_id ? -1 : 1));
  }

  lookup(claim_id) {
    const found = this.records.get(claim_id);
    return found ? freeze(found) : null;
  }

  // Exact structured queries only: no embeddings, no semantic ranking.
  // Disputed/unverified/superseded rows are returned unless filtered;
  // RETRIEVED != ENDORSED (callers see epistemic_status on every row).
  query(filters = {}) {
    const {status, domain, source_ref, evidence_ref, tag, valid_on, limit} = filters;
    let rows = this.snapshot();
    if (status !== undefined) rows = rows.filter(r => r.epistemic_status === status);
    if (domain !== undefined) rows = rows.filter(r => r.domain === domain);
    if (source_ref !== undefined) rows = rows.filter(r => r.sources.some(s => s.ref === source_ref));
    if (evidence_ref !== undefined) rows = rows.filter(r => (r.evidence ?? []).some(e => e.ref === evidence_ref));
    if (tag !== undefined) rows = rows.filter(r => (r.tags ?? []).includes(tag));
    if (valid_on !== undefined) {
      if (!isIsoDate(valid_on)) throw new Error('valid_on must be an ISO date');
      rows = rows.filter(r =>
        (r.valid_from === undefined || valid_on >= r.valid_from) &&
        (r.valid_to === undefined || valid_on <= r.valid_to));
    }
    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 1) throw new Error('limit must be a positive integer');
      rows = rows.slice(0, limit);
    }
    return rows;
  }
}

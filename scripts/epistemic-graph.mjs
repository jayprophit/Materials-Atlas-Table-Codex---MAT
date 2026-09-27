// Epistemic graph over MAT claim epistemic states (REQ-epistemic-graph,
// P26, owner mat).
//
// Graph TRAVERSAL over claim relationships. The Claim Registry
// (scripts/claims.mjs) owns claim records, epistemic statuses, and
// supersession truth; this module owns NOTHING of those. It stores typed
// edges between canonical claim IDs and answers deterministic graph queries:
//
//   CLAIM REGISTRY != EPISTEMIC GRAPH
//   GRAPH EDGE != SECOND SUPERSESSION OWNER
//
// Edges reference canonical claim IDs. Claim text is never copied into an
// edge, and adding an edge never edits a claim (ADD RELATIONSHIP != EDIT
// CLAIM; SUPERSEDED != DELETED):
//
//   CLAIM TEXT != CLAIM IDENTITY
//
// Relation vocabulary is closed and small. SUPPORTS, CONTRADICTS and
// DERIVED_FROM are explicitly authored with evidence and provenance.
// SUPERSEDES is never authored here: it is DERIVED from the registry's own
// supersedes fields, so the registry stays the single supersession owner:
//
//   GRAPH EDGE != SECOND SUPERSESSION OWNER
//
// What this is NOT (all recorded, all tested):
// - not a truth engine: RECORDED != VERIFIED, CONTRADICTION != RESOLVED,
//   RETRIEVED != ENDORSED, SUPPORT EDGE != CLAIM VERIFIED;
// - not a memory system, vector store, RAG pipeline, or context compiler;
// - not the materials knowledge graph (elements/isotopes/compounds — a
//   different domain, owned by records/*.yaml + validate-relationships.mjs,
//   untouched here);
// - not Aetherius EvidenceGraph (execution/programme evidence — another repo,
//   untouched here).
// - no truth/certainty/epistemic scores; no automatic contradiction
//   resolution (not by count, reputation, recency, or model preference); no
//   automatic status promotion (GRAPH STRUCTURE != STATUS PROMOTION POLICY);
// - no LLM arbitration; no similarity-inferred edges (SEMANTIC SIMILARITY !=
//   EPISTEMIC RELATIONSHIP); model-derived relations keep their provenance
//   and are never promoted.
//
// Style follows MAT scripts conventions (node:test consumers, plain objects,
// JSON-clone immutability, outcome objects rather than throws for domain
// validation).

export const RELATION_TYPES = Object.freeze([
  'SUPPORTS',
  'CONTRADICTS',
  'DERIVED_FROM',
  'SUPERSEDES',
]);

// Relations an author may record. SUPERSEDES is absent on purpose: it is
// derived from canonical claim truth, never authored.
export const AUTHORABLE_RELATIONS = Object.freeze([
  'SUPPORTS',
  'CONTRADICTS',
  'DERIVED_FROM',
]);

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

function freeze(record) {
  return JSON.parse(JSON.stringify(record));
}

function edgeKey(fromClaimRef, relation, toClaimRef) {
  return `${fromClaimRef}\n${relation}\n${toClaimRef}`;
}

function sortRefs(refs) {
  return [...new Set(refs)].sort();
}

export function validateRelation(input, lookupClaim) {
  const problems = [];
  if (!input || typeof input !== 'object') return ['relation-shape'];
  if (!nonEmpty(input.fromClaimRef)) problems.push('from-required');
  if (!nonEmpty(input.toClaimRef)) problems.push('to-required');
  if (!RELATION_TYPES.includes(input.relation)) problems.push('relation-invalid');
  if (input.relation === 'SUPERSEDES') {
    problems.push('supersedes-derived-only');
  }
  if (input.fromClaimRef && input.toClaimRef && input.fromClaimRef === input.toClaimRef) {
    problems.push('self-edge-invalid');
  }
  if (input.evidenceRefs !== undefined) {
    if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.some(e => !nonEmpty(e))) {
      problems.push('evidence-invalid');
    }
  }
  if (!nonEmpty(input.provenance)) problems.push('provenance-required');
  if (input.observed_date !== undefined && !isIsoDate(input.observed_date)) problems.push('date-invalid');
  for (const field of Object.keys(input)) {
    if (!['fromClaimRef', 'relation', 'toClaimRef', 'evidenceRefs', 'provenance', 'observed_date'].includes(field)) {
      problems.push(`unknown-field:${field}`);
    }
  }
  // Unknown claim refs are rejected, never fabricated into placeholder nodes.
  if (typeof lookupClaim === 'function') {
    if (nonEmpty(input.fromClaimRef) && !lookupClaim(input.fromClaimRef)) {
      problems.push('unknown-from-claim');
    }
    if (nonEmpty(input.toClaimRef) && !lookupClaim(input.toClaimRef)) {
      problems.push('unknown-to-claim');
    }
  }
  return [...new Set(problems)].sort();
}

export class EpistemicGraph {
  /**
   * @param {(claimId: string) => object|null} lookupClaim resolves canonical
   * claim IDs (e.g. registry.lookup.bind(registry)). The graph never stores
   * claims and never invents them.
   */
  constructor(lookupClaim) {
    if (typeof lookupClaim !== 'function') {
      throw new Error('EpistemicGraph requires a claim lookup function');
    }
    this.lookupClaim = lookupClaim;
    this.edges = new Map();
  }

  snapshot() {
    return [...this.edges.values()].map(freeze).sort((a, b) => (
      a.fromClaimRef === b.fromClaimRef
        ? (a.relation === b.relation
          ? (a.toClaimRef < b.toClaimRef ? -1 : 1)
          : (a.relation < b.relation ? -1 : 1))
        : (a.fromClaimRef < b.fromClaimRef ? -1 : 1)
    ));
  }

  /**
   * Record one explicit relation. Edge identity is the
   * (from, relation, to) triple; evidence is a set that unions monotonically,
   * so distinct evidence for the same relation accumulates instead of
   * colliding: identical re-adds are idempotent, new evidence merges.
   */
  addRelation(input) {
    const problems = validateRelation(input, this.lookupClaim);
    if (problems.length > 0) {
      return {relations: this.snapshot(), outcome: {status: 'rejected', reason: `invalid relation: ${problems.join(',')}`}};
    }
    const key = edgeKey(input.fromClaimRef, input.relation, input.toClaimRef);
    const evidenceRefs = sortRefs(input.evidenceRefs ?? []);
    const existing = this.edges.get(key);
    if (existing) {
      const merged = sortRefs([...existing.evidenceRefs, ...evidenceRefs]);
      if (JSON.stringify(merged) === JSON.stringify(existing.evidenceRefs) &&
          existing.provenance === input.provenance.trim() &&
          (existing.observed_date ?? null) === (input.observed_date ?? null)) {
        return {relations: this.snapshot(), outcome: {status: 'identical', edge: freeze(existing)}};
      }
      const updated = freeze({
        ...existing,
        evidenceRefs: merged,
        provenance: [existing.provenance, input.provenance.trim()].filter((p, i, all) => all.indexOf(p) === i).join(' + '),
        observed_date: existing.observed_date ?? input.observed_date,
      });
      this.edges.set(key, updated);
      return {relations: this.snapshot(), outcome: {status: 'merged-evidence', edge: freeze(updated)}};
    }
    const edge = freeze({
      fromClaimRef: input.fromClaimRef,
      relation: input.relation,
      toClaimRef: input.toClaimRef,
      evidenceRefs,
      provenance: input.provenance.trim(),
      ...(input.observed_date === undefined ? {} : {observed_date: input.observed_date}),
      derived: false,
    });
    this.edges.set(key, freeze(edge));
    return {relations: this.snapshot(), outcome: {status: 'added', edge: freeze(edge)}};
  }

  /**
   * Project SUPERSEDES edges from canonical claim supersession truth. The
   * registry stays the only supersession owner; these edges are marked
   * derived and are never authored through addRelation.
   */
  projectSupersession(claims) {
    const projected = [];
    for (const claim of claims ?? []) {
      const target = typeof claim?.supersedes === 'string' ? claim.supersedes.trim() : '';
      if (!target) continue;
      if (!this.lookupClaim(claim.claim_id) || !this.lookupClaim(target)) continue;
      if (claim.claim_id === target) continue;
      projected.push(freeze({
        fromClaimRef: claim.claim_id,
        relation: 'SUPERSEDES',
        toClaimRef: target,
        evidenceRefs: [],
        provenance: `derived from canonical claim supersession (${claim.claim_id})`,
        derived: true,
      }));
    }
    return projected.sort((a, b) => (a.fromClaimRef < b.fromClaimRef ? -1 : 1));
  }

  /**
   * Deterministic neighbour query. Direction matters: A SUPPORTS B never
   * implies B SUPPORTS A. Cycle-safe by construction (single-hop lookup).
   */
  neighbours(claimRef, options = {}) {
    const {relations, direction = 'both'} = options;
    if (!['out', 'in', 'both'].includes(direction)) throw new Error('direction must be out, in, or both');
    const wanted = relations === undefined ? [...RELATION_TYPES] : [...relations];
    for (const relation of wanted) {
      if (!RELATION_TYPES.includes(relation)) throw new Error(`unknown relation ${relation}`);
    }
    const out = [];
    for (const edge of this.edges.values()) {
      if (!wanted.includes(edge.relation)) continue;
      if ((direction === 'out' || direction === 'both') && edge.fromClaimRef === claimRef) {
        out.push({claimRef: edge.toClaimRef, relation: edge.relation, direction: 'out'});
      }
      if ((direction === 'in' || direction === 'both') && edge.toClaimRef === claimRef) {
        out.push({claimRef: edge.fromClaimRef, relation: edge.relation, direction: 'in'});
      }
    }
    return out.sort((a, b) => (
      a.claimRef === b.claimRef
        ? (a.relation === b.relation
          ? (a.direction < b.direction ? -1 : 1)
          : (a.relation < b.relation ? -1 : 1))
        : (a.claimRef < b.claimRef ? -1 : 1)
    ));
  }

  supportsFor(claimRef) {
    return this.neighbours(claimRef, {relations: ['SUPPORTS'], direction: 'in'})
      .map(n => n.claimRef);
  }

  contradictionsFor(claimRef) {
    return this.neighbours(claimRef, {relations: ['CONTRADICTS'], direction: 'both'})
      .map(n => n.claimRef);
  }

  /**
   * Bounded transitive traversal over the given relations. Cycle-safe via a
   * visited set; deterministic via canonical neighbour order; never follows
   * CONTRADICTS unless explicitly asked (contradiction is not a path).
   */
  traverse(claimRef, options = {}) {
    const {relations = ['SUPPORTS', 'DERIVED_FROM', 'SUPERSEDES'], direction = 'out', maxDepth = 10} = options;
    if (!Number.isInteger(maxDepth) || maxDepth < 1) throw new Error('maxDepth must be a positive integer');
    const visited = new Set([claimRef]);
    const reached = [];
    let frontier = [claimRef];
    for (let depth = 0; depth < maxDepth && frontier.length > 0; depth += 1) {
      const next = [];
      for (const current of frontier) {
        for (const neighbour of this.neighbours(current, {relations, direction})) {
          if (visited.has(neighbour.claimRef)) continue;
          visited.add(neighbour.claimRef);
          reached.push({claimRef: neighbour.claimRef, depth: depth + 1, via: neighbour.relation});
          next.push(neighbour.claimRef);
        }
      }
      frontier = next.sort();
    }
    return reached;
  }
}

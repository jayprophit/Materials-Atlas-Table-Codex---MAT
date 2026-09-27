# 11 — Epistemic Graph

Epistemic relationships over MAT claim epistemic states
(REQ-epistemic-graph, P26, owner mat).

## What it is

`scripts/epistemic-graph.mjs` stores typed edges between canonical claim IDs
from the Claim Registry (`scripts/claims.mjs`) and answers deterministic
graph queries: neighbours (directional), `supportsFor`, `contradictionsFor`,
and bounded transitive `traverse`. Tests:
`scripts/tests/epistemic-graph.test.mjs` (16 tests, `node --test`).

## What it is not

- Not a second claim store. Edges reference canonical claim IDs; claim text
  is never copied, and adding an edge never edits a claim.
- Not a truth engine. RECORDED != VERIFIED; CONTRADICTION != RESOLVED;
  RETRIEVED != ENDORSED. No truth/certainty scores, no automatic
  contradiction resolution, no automatic status promotion.
- Not a memory system, vector store, RAG pipeline, or context compiler.
- Not the materials knowledge graph (`records/*.yaml` element/isotope
  relationships — a different domain, untouched).
- Not Aetherius EvidenceGraph (execution/programme evidence — another
  repository, untouched).

## Relations

- `SUPPORTS`, `CONTRADICTS`, `DERIVED_FROM` — explicitly authored with
  evidence refs and provenance. Directional; never inferred from similarity.
- `SUPERSEDES` — derived only, projected from the registry's canonical
  `supersedes` fields via `projectSupersession()`. Never authored
  (`supersedes-derived-only` rejection); the registry stays the single
  supersession owner.

## Edge identity

Identity is the (from, relation, to) triple; evidence is a set that unions
monotonically. Identical re-adds are idempotent; new evidence merges. Unknown
claim refs are rejected (never fabricated into placeholder nodes); self-edges
are rejected for every relation.

## Traversal

`traverse()` is cycle-safe (visited set), bounded (`maxDepth`, default 10),
and deterministic (canonical neighbour order, sorted frontiers). It never
follows `CONTRADICTS` unless explicitly asked — contradiction is not a path.

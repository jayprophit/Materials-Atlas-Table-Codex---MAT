# 10 — Claim Registry

Queryable claim records with explicit epistemic status
(`scripts/claims.mjs`, `scripts/tests/claims.test.mjs`).

## Rule

CLAIM RECORDED != CLAIM VERIFIED. Storing an assertion, attaching
evidence, or retrieving a record endorses nothing. Sources keep
attribution; external claims are never rewritten as MAT facts;
contradictions are stored side by side, never auto-resolved
(relations belong to the epistemic graph, not this registry).

## Record

`CLM-<slug>-<hash8>` deterministic ids; version `1.0.0`;
assertion (required); domain (required); subject;
`epistemic_status` (ESTABLISHED, EMERGING, HYPOTHESIS, SPECULATIVE,
FICTIONAL_INSPIRATION, UNVERIFIED, DISPUTED, SUPERSEDED); sources[]
(ref required, kind); evidence[] (`supporting`/`counter` — attachment
never auto-verifies); testability; valid_from/valid_to,
observed/published dates; supersedes (old record retained);
tags; provenance (required).

## Behaviour

Identical re-registration is idempotent; same id with different
content conflicts (records immutable; clones on every return).
Supersession keeps both records. Temporal queries filter by
`valid_on`. Exact structured queries only (id, status, domain,
source/evidence ref, tag, version interval, limit) in deterministic
order — no embeddings, no semantic ranking, no vector store.
Disputed/unverified/superseded rows are returned unless filtered:
RETRIEVED != ENDORSED.

## Boundaries

Not the epistemic graph (relations live there), not memory
(autobiographical/project/scratch untouched), not the context
compiler (stored claims are not context-approved), not regulated
validation (regulated-evidence gate untouched), not invention
disclosure (separate system).

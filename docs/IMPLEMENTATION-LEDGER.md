# Implementation Ledger — MAT tooling state

Tooling-only ledger. Scientific content is tracked by its own records;
this file tracks project-management/build artifacts only.

## 2026-09-14 — audit baseline (read-only inspection)

- `AGENTS.md`: created (was missing).
- `.mat-local/`: present (intake/, logs, proofs). Local-only.
- `docs/`: asset drops present; no prior ledger (this file seeds it).
- `records/`, `archive/`, `book/`, `data/`: present, untouched.
- `dist/`, `output/`, `node_modules/`: build artifacts, disposable.
- `.github/`: CI present.

## 2026-09-19 — MAT Query Service tooling addition

- `scripts/mat-query-service.mjs`: created (tooling-only CLI and programmatic query interface for element lookups, comparisons, and NIST/NUBASE evaluations with provenance tags).
- `records/`, `archive/`, `book/`, `data/`: untouched (strictly READ-ONLY per `AGENTS.md`).

## Open tooling items

- None assigned. Propose changes via scripts + records entries first.


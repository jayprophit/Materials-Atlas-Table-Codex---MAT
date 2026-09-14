# AGENTS.md — Materials Atlas Table Codex (MAT)

Coding-agent project memory index. Scientific records under `book/`,
`data/`, `records/`, `archive/` are READ-ONLY for audits — never modify
scientific content as part of tooling work.

## Where things live

- `book/` — publication source of truth.
- `data/` — datasets (see `docs/` for format notes where present).
- `records/` — run records and logs.
- `archive/` — frozen historical material, do not mutate.
- `assets/`, `templates/`, `studio/` — build inputs.
- `scripts/` — build/verification tooling.
- `docs/` — design notes; `docs/IMPLEMENTATION-LEDGER.md` tracks
  implementation state (tooling-only, no science edits).
- `.mat-local/` — private local state: intake manifests, build logs,
  proof artifacts. Never commit secrets here; directory is local-only.
- `.github/` — CI workflows.

## Conventions

- Add tooling under `scripts/`; record runs under `records/`.
- Intake drops go to `.mat-local/intake/` with a manifest entry.
- Verify builds with logs under `.mat-local/` before claiming success.
- Ask before deleting anything outside `dist/`, `output/`, `node_modules/`.

# Qwen ↔ Muse Comparison (no silent corrections)

Qwen (via agent_bridge_v05, plan/READ_ONLY, hhao/qwen2.5-coder-tools:3b) executed actions but returned NO prose factual summary — only `finish` messages. Muse independently verified everything below in MAT_copy. Disagreements mean Qwen-omitted vs Muse-established, recorded explicitly.

| # | QWEN CLAIM (action evidence) | EVIDENCE | MUSE VERIFICATION | VERDICT |
|---|---|---|---|---|
| 1 | Listed project root (Task-A step 1) | approvals: list . ; memory/session.json step 1 | Root verified: book/records/data/docs/scripts/studio/templates/assets/dist/output/downloadfiles + README/CHANGELOG/package.json | AGREE (action) |
| 2 | Read main README (step 2) | approvals: read README.md | `README.md` 293 lines, entry points confirmed (book/index.html, records/NNNN, registries, npm toolchain) | AGREE |
| 3 | Listed book/records/data (steps 3-5) | approvals: 3× list | `book/` 32 entries, `records/` 120 entries (0000–0118), `data/` registries present | AGREE |
| 4 | Searched Hydrogen/Helium/Lithium (steps 6-8) | approvals: 3× search | `records/0001-Hydrogen-H`, `0002-Helium-He`, `0003-Lithium-Li` all present, full 15-entry shape | AGREE (locations confirmed; Qwen stated no paths) |
| 5 | Read package.json (step 9) | approvals: read | `mat-codex@1.0.0`, ESM, validate/build/test scripts, ajv+yaml | AGREE |
| 6 | Searched Be/B/periodic/nav/collapse (Task-B) | approvals + memory steps | `0004-Beryllium-Be`, `0005-Boron-B` present; periodic UI `book.js:635+`; nav `#sidebar/#toc-toggle`; collapse `book.js:75,150,154` | AGREE (actions) / PARTIAL (Qwen gave no file:line; Muse supplies it) |
| 7 | Searched book search|index; listed studio/scripts/templates | approvals + memory steps | search `search.mjs`+`search-index.json`+`build/search-index.mjs`; `studio/` React/Vite; `scripts/` 40 tools; `templates/` present | AGREE (actions) |
| 8 | Searched citations/contributors/memory/cache/AI; listed docs/assets (Task-C) | approvals + history.jsonl detail (citation matches CHANGELOG:15; contributor matches README:14) | citations Cite+export+sources.yaml IMPLEMENTED; contributors docs IMPLEMENTED/data PARTIAL; memory = reader-IndexedDB only; cache = SW offline only; AI MISSING | PARTIAL — Qwen collected keyword hits but did NOT distinguish reader-memory vs agent-memory, offline-cache vs data-cache, nor "generated-model"=meshes vs AI. Muse distinction is new, not a contradiction of a Qwen statement. |
| 9 | Checkpoint: Qwen made NO numeric claim | finish messages only | Muse: 0001–0009 published (CHANGELOG), F 23KB full vs Neon 7.3KB partial | DISAGREE-by-omission recorded: checkpoint established by Muse, not Qwen |
| 10 | Tests/build config: searched scripts test\|spec | approvals: search scripts | 8× `scripts/tests/*.test.mjs` + vitest + playwright + reader browser tests; root+studio package.json | AGREE (action) / PARTIAL (Qwen did not enumerate) |
| 11 | Architecture: no Qwen claim | — | Frontend vanilla-ESM book + React studio; backend NONE; YAML+JSON+registries | Muse-only (recorded) |
| 12 | Zero-write discipline | manifests [] ×3, files_touched = read-only paths, errors [] | MAT_copy `.bridge/` created (allowed workspace); REAL MAT untouched (integrity check) | AGREE |

## What Qwen proved vs what it did not
- PROVED: 30/30 valid read-only actions across 11-path touch set, 15 searches, 0 malformed, 0 loops, 0 writes — genuine runtime execution, not prose.
- DID NOT: name element paths, state checkpoint numbers, cite file:line for UI, or classify IMPLEMENTED/PARTIAL/MISSING. Those classifications are Muse's, independently evidenced above.
- Reviewer: skipped (correct for plan mode); no reviewer hallucinations possible.

## Honest limitations
- Task-A/B per-action result payloads truncated by runtime history retention; Task-C payloads retained. Counts/approvals/action-list survive for all. No Qwen finding is quoted beyond what the runtime recorded.

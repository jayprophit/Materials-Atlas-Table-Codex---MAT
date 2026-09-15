# MAT Bridge Test Report — FIRST REAL MAT INTEGRATION (read-only)

- Supervisor: OpenCode / Muse Spark 1.3 Free
- Runtime: `C:\Users\jpowe\Desktop\OpenCode-Agent-Test\agent_bridge_v05` (v0.5, PUBLIC SDK only)
- Client: `client.py` → `AgentRuntimeClient` over HTTP `/v1` at `http://127.0.0.1:8473`
- Worker model: `hhao/qwen2.5-coder-tools:3b` (local Ollama, 7 models visible)
- Profile: LOW_RESOURCE; Mode: `plan`; Approval: `READ_ONLY`; Reviewer: skipped by plan-mode design
- MAT source (PRECIOUS, read-only): `C:\Users\jpowe\Desktop\Materials-Atlas-Table-Codex---MAT`
- MAT copy (all runtime work): `C:\Users\jpowe\Desktop\OpenCode-Agent-Test\MAT_integration_01\MAT_copy`
- Genesis (read-only reference): `C:\Users\jpowe\Desktop\Genesis`

## 1. OpenCode → v0.5 invocation: SUCCESS
- `GET /health` → HEALTHY (ollama HEALTHY/7 models, workspace_roots HEALTHY, storage HEALTHY)
- `GET /v1/capabilities` → runtime 0.5, protocol 0.4, actions include list/read/search/exists/stat/diff/capabilities/status, modes build/plan/hybrid, approvals include READ_ONLY, preset LOW_RESOURCE, default_model hhao/qwen2.5-coder-tools:3b
- No internal imports (executor/policy/protocol/sandbox/checkpoint/provider). Service launched from existing source as subprocess on port 8473.

## 2. Baseline REAL MAT (before copy)
- Branch: `main`; HEAD: `7be2bdfe2938d01387ddbff143e8ce5b9ee54f6c`
- `git status --porcelain`: clean (empty); tracked 5956, untracked 0
- Root: .git/.github/.mat-local/.qodo/archive/assets/book/data/dist/docs/downloadfiles/output/records/scripts/studio/templates + README/CHANGELOG/package.json/package-lock (+ node_modules, .git excluded from copy)
- Files: 21426; size: 308.75 MB; no `.bridge` in MAT

## 3. Safe copy
- `MAT_copy`: 15700 files, 173.47 MB
- Excluded and recorded: `.git`, `.bridge` (absent), `node_modules`, `__pycache__`, `.venv` (absent), `venv` (absent)
- KEPT per instructions: `dist`, `output`, `downloadfiles`, `assets`, `book`, `records`, `data`, `docs`, `scripts`, `studio`, `templates`
- Verified: `.git`=False, `node_modules`=False, `.bridge`=False, `dist/scripts/studio/templates`=True

## 4. Qwen actions / IDs
- Session `s-a96d0667a3` (mode plan, approval READ_ONLY, all roles hhao/qwen2.5-coder-tools:3b)
- A `t-8896fa3b03` COMPLETED 265.7s: list ., read README, list book/records/data, search Hydrogen/Helium/Lithium, read package.json, status, finish
- B `t-64459c91bc` COMPLETED 327.3s: search Beryllium/Boron/periodic/navigation|menu/collapse|expand, search book for search|index, list studio/scripts/templates, status, finish
- C `t-ca31cf2116` COMPLETED 296.4s: search citation|reference, contributor|author, memory, cache, agent|model|AI|ollama, search scripts for test|spec, list docs/assets, capabilities, status, finish
- Action IDs: pattern `a-s-a96d0667a3-<task>-<step>` (history.jsonl); full action list in `MAT_copy/.bridge/memory/session.json` (33 entries: 30 substantive + 3 finish)

## 5. Valid-action ratio: 1.0 (30/30, finish ops valid)
## 6. Malformed actions: 0 (all tasks: malformed 0, syntax_error_runs 0, corrections 0)
## 7. Runtime errors / loops: 0 errors, 0 loops, 0 executed_fail; manifests empty (zero writes); scorecard SECURITY PASS, RUNTIME_OUTPUT PASS, REVIEW skipped
- Limitation (not hidden): per-action result payloads for tasks A/B were truncated by runtime `keep_recent_results`/history retention; `history.jsonl` retains Task-C detail. Competence counts + approvals + memory action list survive for all tasks. Qwen returned no prose factual summary — only finish messages — so NO model prose is used as evidence.

## 8-16. MAT findings (all Muse-verified in MAT_copy; see DISCOVERY_SUMMARY)
- Book/UI: static vanilla-ESM reader (`book/index.html`, `book.js`, `reader-core.mjs`, `modules/` incl. `atlas/search/reading-memory/storage/scene-data/charts`), `search-index.json`, `offline-index.json`, `periodic.json`, `elements.json`, `scenes/`, `3d.html`, `sw.js` offline, `serve.mjs`
- Element records: dirs `0000` + `0001–0118` ALL present; H=`records/0001-Hydrogen-H`, He=0002, Li=0003, Be=0004, B=0005, each 15 entries (main .md + 4 audit docs + 10 subdirs)
- Checkpoint: `0001–0009` published with galleries/3D/search (CHANGELOG); Hydrogen validated PASS; `0010-Neon` PARTIAL (7.3KB vs 0009 23KB; missing audit/validation/visual-spec; has Optical-Reference instead)
- Menu/nav: sidebar + `#toc-toggle[aria-expanded]` + Expand all/Collapse all/Reset with saved TOC state (`book.js:75,150,154`), jump select — IMPLEMENTED, collapsible
- Periodic table: dialog + 18-col grid + heatmaps + Russell view + muted unpublished cells (`book.js:635+`, `atlas.mjs`, `periodic.json`) — IMPLEMENTED
- Element pages: cards + expandable dossier for unpublished — IMPLEMENTED/PARTIAL
- Search: whole-book search + filters + `search.mjs` + `search-index.json` + atlas filter + `build/search-index.mjs` — IMPLEMENTED
- Links: `scripts/check-links.mjs` validator IMPLEMENTED; internal/external content PARTIAL (spot-verified structure, not exhaustive crawl)
- Citations: Cite button + export (`book.js:1418`) + per-record `sources/` + `data/registries/sources.yaml` + SRC- IDs — IMPLEMENTED
- Contributors: `docs/06-governance/` + `templates/` + lineage system — docs IMPLEMENTED, data PARTIAL
- Visuals/3D: per-record images/graphs/diagrams/models + `gen3d.mjs` + `scenes/` + `visuals-index` + reference-visuals — IMPLEMENTED
- Memory: reader-local IndexedDB only (`reading-memory.mjs`, `storage.mjs`, history≤50) — IMPLEMENTED as reader memory; agent memory MISSING
- Cache: service-worker offline (`cache-version.js`, `sw.js`, cacheMetadata) — IMPLEMENTED as offline cache; data-cache layer MISSING
- AI/agent: MISSING in MAT ("generated-model slots" = 3D meshes, not AI)
- Frontend/backend/data: vanilla-ESM book + React18/Vite6/TS/Tailwind studio; NO backend (Node toolchain + static serve); YAML canonical + JSON derived + registries/schemas

## 17-18. Muse verification / disagreements: see MAT_QWEN_MUSE_COMPARISON.md (no silent corrections; Qwen made no factual prose claims to contradict; Muse填补了 checkpoint/size/menu-persistence/memory-vs-agent distinctions Qwen did not state)

## 19-21. Genesis: see GENESIS_CAPABILITY_QUICK_INVENTORY.md (memory IMPLEMENTED; cache/agent/model/ingest/index PARTIAL; TTS/STT/voice/predictive/autocomplete/vision/browser/IDE-inference NOT_FOUND; browser-readonly grant only; pagination future-doc)

## 22. ChatGPT gap: see CHATGPT_CONVERSATION_INGESTION_NOTE.md (intake abstraction exists, raw conversations NOT in repo, no browsing this run)

## 23. Source integrity: VERIFIED CLEAN (post-run recheck)
- MAT branch `main` unchanged; HEAD `7be2bdfe2938d01387ddbff143e8ce5b9ee54f6c` unchanged; `git status --porcelain` empty (matches baseline); `.bridge` absent (False); zero `MAT_BRIDGE*/MAT_DISCOVERY*/MAT_QWEN*/GENESIS_CAP*/CHATGPT_*` files in MAT.
- Genesis branch `main` (`ff44fb5e5299b9228b55c20a85bb783e7cde64ca`), `git status --porcelain` empty, zero integration files; no writes ever performed there.
- No unexpected mutation: nothing to stop/repair.

## Verdict: PASS (read-only discovery)
All 3 Qwen tasks COMPLETED via public API with 100% valid read-only actions, zero writes, zero loops; Muse independently verified architecture/checkpoint/records/UI/links/memory/tests; source repos unmutated. Partial-credit items (internal/external link exhaustiveness, contributor data completeness) are documented, not blocking.

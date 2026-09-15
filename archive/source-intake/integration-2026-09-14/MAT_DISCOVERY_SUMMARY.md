# MAT Discovery Summary (evidence-based, Muse-verified)

Source of truth: `MAT_copy` (faithful copy of REAL MAT minus `.git/node_modules/__pycache__/.venv/venv/.bridge`).

## Entry points
- `README.md` (293 lines): start at `book/index.html` via `node book/serve.mjs 4173`; records at `records/NNNN-Name-Symbol/`; machine data = record `data/**/*.yaml` + `data/registries/sources.yaml`; methodology `docs/03-methodology/`; schemas `data/schema/1.0.0/`; authoring `docs/06-governance/` + `templates/`; toolchain `npm ci / validate / build:book / test`; status `CHANGELOG.md`; readiness `docs/09-production/`.
- `package.json` (`mat-codex@1.0.0`, ESM): validate* (records/sources/relationships/assets/links/identifiers/booksync/elements), `build:book` (`book/build/book.mjs`), `build:publication`, `sync:elements`, studio Vite build, `test` = `node --test scripts/tests/*.test.mjs`.
- `CHANGELOG.md` Unreleased 10 Sept 2026: 0001–0009 published with galleries/3D/search; Hydrogen PASS; 118 nuclear datasets (5,842 states, NUBASE2020); Neon optics; 5,614 relationship links; tour/keyboard/a11y; Chromium/Firefox/WebKit reader tests.

## Structure
- `book/`: `index.html`, `book.js` (~1700 lines), `reader-core.mjs`, `modules/{atlas,search,reading-memory,storage,scene-data,charts}.mjs`, `search-index.json`, `offline-index.json`, `periodic.json`, `elements.json`, `identities.json`, `manifest.json`, `scenes/`, `data/`, `3d.html`, `gen3d.mjs`, `styles*`, `sw.js`, `cache-version.js`, `serve.mjs`, `build/`, `vendor/`, `reference-visuals/`
- `records/`: `0000-Origin-State` + `0001–0118` (119 dirs + `.gitkeep`); each full record = main `.md` + Migration-Audit + Nuclear-Evaluation + Schema-Validation + Visual-Spec + `calculations/data/diagrams/experiments/graphs/images/models/relationships/sources/tables/`
- `data/`: `registries/{sources.yaml,domains.yaml,relationship-concepts.yaml}`, `schema/1.0.0/`, `quality/benchmark.json`
- `docs/`: `00-front-matter … 09-production` (foundations, data, methodology, visualization, index, governance, migration, back-matter, production)
- `scripts/`: ~40 `.mjs` validators/builders/sync + `tests/` (8 files) + `archive/`
- `studio/` (`mat-studio@0.1.0`): React 18 + Vite 6 + TS + Tailwind 4 + vitest + playwright (`playwright.config.ts`, `playwright.reader.config.ts`, `e2e/`, `reader-e2e/`)
- `templates/`, `assets/`, `dist/` + `output/` + `downloadfiles/` (generated evidence, kept, never executed)

## Elements 1–5 + checkpoint
- `0001-Hydrogen-H/0001-Hydrogen-H.md` (+data/sources), `0002-Helium-He`, `0003-Lithium-Li`, `0004-Beryllium-Be`, `0005-Boron-B` — all present, full 15-entry shape.
- Checkpoint: **0001–0009 published**; file-size probe: `0009-Fluorine-F.md` 23,029 B full set vs `0010-Neon-Ne.md` 7,350 B PARTIAL (no audit/validation/visual-spec; has `Optical-Reference.md` instead). Dirs for 0011–0118 exist (structure) but not published content.

## UI / navigation / periodic / search
- Nav/menu: `#sidebar`, `#toc-toggle[aria-expanded=true]` (starts expanded), `.atlas-controls` Expand all / Collapse all / Reset saved TOC state (`book.js:75,150,154`), `#jump` select, mobile bar — IMPLEMENTED, collapsible, state-persisted.
- Periodic table: `#periodic-dialog` + `#periodic-grid` (18-col CSS `styles.css:357`), heatmap select, Russell view, f-block styling, muted `aria-disabled` unpublished cells, 119-entry atlas filter — IMPLEMENTED (`book.js:635–930`, `modules/atlas.mjs`, `periodic.json`).
- Element pages: `#element-cards` + dossier dialog for unpublished — IMPLEMENTED (published) / PLACEHOLDER-dossier (unpublished).
- Search: `#search` whole-book + `#adv-toggle` filters + `#atlas-filter` + `modules/search.mjs` + `search-index.json` + `offline-index.json` + `build/search-index.mjs` — IMPLEMENTED.

## Links / citations / contributors
- Internal links: `scripts/check-links.mjs` validator — IMPLEMENTED (validator); content exhaustiveness PARTIAL.
- External links: "External resources: encyclopedia, papers, video, chapter citations" (`book.js:285`) — PARTIAL.
- Citations: `#cite-btn` + `citation export` (`book.js:1418`) + per-record `sources/` + `data/registries/sources.yaml` + `SRC-H-*`/`SRC-000164` normalization — IMPLEMENTED.
- Contributors: `docs/06-governance/` + `templates/` + lineage system (CHANGELOG) — DOCUMENTED/IMPLEMENTED docs, PARTIAL data.

## Visuals / memory / cache / AI / tests
- Visuals: per-record `images/graphs/diagrams/models` + `book/scenes/` + `gen3d.mjs` + `3d.html` + `visuals-index.json` + `reference-visuals/` + `generate-schematics.mjs` (H/He excitation series) — IMPLEMENTED.
- Memory: `modules/reading-memory.mjs` (positions/history≤50/search-history≤20/bookmarks/notes) over `modules/storage.mjs` IndexedDB (`MATReaderDB`: preferences/readingPositions/history/bookmarks/notes/highlights/favorites/searchHistory/translations/cacheMetadata/uiState) — IMPLEMENTED as **reader-local** memory. Agent/project memory: MISSING.
- Cache: `sw.js` + `cache-version.js` + `cacheMetadata` store + offline manifest — IMPLEMENTED as **offline PWA** cache. Server/data cache layer: MISSING.
- AI/agent integration: MISSING (no ollama/agent/model code; "generated-model" = 3D meshes).
- Tests: `scripts/tests/` ×8 (`catalog/decay-metrics/identifier-references/intake-nuclear/mat/reader/relationship-review/scene-data`) via `node --test`; studio `vitest run src` + `playwright test` + reader browser configs — IMPLEMENTED.
- Build/package: root `package.json` (ajv/yaml) + `studio/package.json` (react/vite/ts/tailwind/vitest/playwright) — IMPLEMENTED.

## Architecture
- Frontend: static vanilla-ESM book (no framework) + React/Vite studio. Backend: NONE. Storage: YAML canonical + JSON derived + registries + JSON-Schema contracts. Hosting: static (`serve.mjs`, `dist/`, `sw.js` offline).
- Three authorities (README): prose (Markdown) / data (YAML+registries) / derived (book JSON/scenes/dist — rebuild, never hand-edit).

## Status labels
IMPLEMENTED: structure, README, records skeleton, 0001–0009 content, nav/menu collapse, periodic UI, element pages (published), search, citations, visuals/3D, reader memory, offline cache, tests, toolchain.
PARTIAL: 0010+ records, unpublished dossiers, internal/external link content, contributor data.
PLACEHOLDER: muted periodic cells / dossier for unpublished elements.
DOCUMENTED_ONLY: release readiness checklist, some governance flows.
MISSING: backend, agent/AI integration, server cache, 0010+ full publication.

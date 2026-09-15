# Genesis Capability Quick Inventory (READ-ONLY, no integration)

Source: `C:\Users\jpowe\Desktop\Genesis` (own repo, branch `main`, C++-first digital-organism scaffold). Nothing copied or modified. ChatGPT conversations are NOT in this folder (see ingestion note).

## Method
Top-level read + README + `src/`/`tools/` listings + targeted greps for implementation (not prose). "Implemented" requires code/test/bench evidence, not docs alone.

## Results

| Capability | Verdict | Evidence paths |
|---|---|---|
| memory | IMPLEMENTED | `src/memory/graph.cpp`, `src/memory/origin.cpp`, `src/memory/persistence.cpp`; `genesis_memory_bench` (README:22); origin-labelled inherited memory (README:12); Stage 5 associative graph + decay/reinforcement tests (FOUNDATION_GAP_REPORT) |
| cache | PARTIAL | dead-end cache 10 records + technology-mining addendum cache (FOUNDATION_GAP_REPORT:85); CMake `cacheVariables` (CMakePresets.json:15); NO general app/data cache layer found |
| agent routing | PARTIAL | `src/agents/platform.cpp`, `src/agents/persistence.cpp`; `schemas/agent-definition.schema.json`; `templates/agents/daily-research.agent.json` (`modelRoute`, `browser.readonly` grant); `AdapterRegistry` declared→observed→qualified (AGENT_AUTOMATION_PLATFORM:18,37) — but "no provider linked" |
| model management | PARTIAL | evidence-qualified model-kind entries + lifecycle/expiry gate (AGENT_AUTOMATION_PLATFORM:18); modelRoute strings; NO operational provider |
| local/offline operation | PARTIAL (design) | local-first order, offline tokens (`assets/design/tokens.json`, GENESIS_DESIGN_SYSTEM:131,201); deferred quarantined sidecar `adapter_backend.py` (audit map, not live) |
| local inference | DOCUMENTED_ONLY / NOT_FOUND | explicitly "no model inference … claimed" (AGENT_AUTOMATION_PLATFORM:97); generic modality ABI only |
| task automation | DOCUMENTED_ONLY | scaffold policy model (workflows/triggers/approvals); "No UI, hosted service, scheduled execution … claimed" (same doc:97) |
| IDE automation | NOT_FOUND | no executor/adapter found |
| document ingestion | PARTIAL | `tools/validate_*_ingest.ps1` (genesis3/4, chatgpt-project, registry, repository-content); `docs/specifications/*_INGEST.md`; `registry/canonical_sections.tsv` (1,451 sections); `provenance/SOURCE_MANIFEST.tsv`; cloud intake "bounded abstraction with truncation and attachment gaps" (README:48) |
| file indexing/search | PARTIAL | canonical 1,451-section lossless index; `tools/inventory_*.ps1`; no full-text search engine |
| text-to-speech | NOT_FOUND | no TTS code; audio catalogue research-only (GENESIS3_INGEST:60); "no concrete … model or device is claimed" (STAGE_5:198-203) |
| speech-to-text | NOT_FOUND | same as TTS |
| voice control | NOT_FOUND | affect/face/voice expression is requirements-only (GENESIS3_INGEST:62) |
| predictive text | NOT_FOUND | no implementation found |
| autocomplete | NOT_FOUND | no implementation found |
| vision / image understanding | NOT_FOUND | generic perception ABI only, no camera/model claimed |
| visual learning | NOT_FOUND | same |
| computer vision | NOT_FOUND | same |
| browser automation / control | NOT_FOUND | only `browser.readonly` tool *grant* in agent template — no executor/adapter; docs confirm no browser automation claimed |
| pagination | DOCUMENTED_ONLY | future-API "pagination for logs" (AGENT_AUTOMATION_PLATFORM:53) — not an implemented scroller |
| infinite scrolling | NOT_FOUND | no implementation |
| web extraction | NOT_FOUND | readonly grant only, no extractor |
| model routing (traffic) | PARTIAL | evidence-gated route qualification + validity intervals + demotion on failed probe (AGENT_AUTOMATION_PLATFORM:37,73) — routing *policy*, no live traffic |
| multi-agent concepts | PARTIAL (design) | specialist-agent contracts planned (Stage 8), agent schemas/templates present, no live orchestration |

## Potentially useful to MAT (later, not now — no wholesale integrate)
- Origin-labelled memory + provenance/evidence ladder → patterns for MAT provenance/validation hardening (MAT already has reader memory; this is about evidence discipline, not code copy).
- Adapter evidence states (declared→observed→qualified) + approval binding (run ID/plan digest/tool set/expiry) → model for any future MAT agent/tool integration.
- Ingest validators + canonical-section indexing → reusable *approach* for the future ChatGPT-conversation ingestion (separate task).
- Benchmark-as-evidence discipline (measurement ≠ capability claim) → matches MAT's honest-backlog style.

## Missing / not implemented (do not assume)
TTS, STT, voice control, predictive text, autocomplete, vision, visual learning, browser automation/control, infinite scroll, web extraction, IDE automation, operational local inference, live model/agent execution. The repo is explicit that these are NOT claimed.

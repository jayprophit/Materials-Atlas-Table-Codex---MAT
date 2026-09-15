# ChatGPT Conversation Ingestion Note (future design only — NOT performed)

## Fact
The local `C:\Users\jpowe\Desktop\Genesis` folder does NOT contain the ChatGPT Genesis Project conversations as raw data. What exists is a dated bounded abstraction: `docs/specifications/CHATGPT_GENESIS_PROJECT_INTAKE_2026_09_06.md` (9,438 bytes) plus related intake docs (`CONVERSATION_INTAKE_2026_09_05.md`, `GENESIS3_INGEST.md`, `GENESIS4_INGEST.md`). Per Genesis README: "Cloud conversation intake is a dated, bounded abstraction with explicit truncation and attachment gaps; it is not a lossless export or implementation evidence."
Do NOT claim the conversations were analysed in this run. No browser automation was performed.

## Future ingestion design (when explicitly authorized)
1. Structured/exported data first: ChatGPT export (if offered), API where available; record export date/scope/gaps like the existing intake docs do.
2. User-provided exports: accept uploaded `.zip/.json` under `MAT_integration_XX/`, never into MAT/Genesis; validate hashes, record provenance.
3. Browser automation (only if authorized): local operator-driven session; read-only DOM extraction; never credential-harvesting; isolate profile/workdir/credentials per run (mirrors Genesis agent-grant discipline).
4. Pagination/infinite-scroll: versioned extractor with Last-Event/continuation recovery, bounded windows, polling fallback (same pattern as bridge SSE), dedupe by message ID + content digest.
5. DOM extraction: selectors pinned per snapshot + raw-HTML archiving; model text treated as DATA, never authority (bridge trust-boundary rule).
6. Visual/screenshot fallback: only where DOM is virtualized; OCR text marked low-confidence, never silently merged with DOM text.
7. Deduplication: exact-ID match → content-digest match → near-dup review queue (cf. Genesis dedup maps for continuations).
8. Local indexing: append-only JSONL + canonical-section-style TSV (section/message IDs, timestamps, topics, entities), checksummed snapshots, corruption tests.
9. Timeline reconstruction: sort by server timestamps (not scrape order); mark truncation/attachment gaps explicitly.
10. Topic/entity extraction: deterministic keyword/registry pass first; any model-assisted labelling stored as separate annotation layer with confidence, never overwriting source text (MAT null-states discipline: unknown ≠ missing).

## Non-goals for that stage
No MAT/Genesis source writes; no credential storage; no silent merging of speculation with evidence; no progress claims from file counts.

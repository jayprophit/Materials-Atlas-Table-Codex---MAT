# MAT documentation gap analysis — 3 October 2026

This audit compares the current MAT repository with useful documentation forms. It extends the [existing unified gap report](Unified-Gaps-and-Recommendations.md) and [MAT-TODO ledger](../../data/quality/MAT-TODO.json). The [machine-readable review](../../data/research/mat-documentation-review.json) retains owners, priorities and acceptance limits. No independent requirement tracker or source registry is created.

## Comparison and recommendations

| Documentation form | Current MAT evidence | Missing capability and recommendation | Primary guidance |
|---|---|---|---|
| Reference book / atlas | [Reader core](../../book/reader-core.mjs), [manifest](../../book/manifest.json), [exporter](../../studio/src/exports.tsx), [production standard](../09-production/00-Ebook-Production-Standard.md) | Keep one canonical dataset. Verify stable edition metadata, navigation, equations, citations, print, EPUB and accessibility independently. | [EPUB 3.3](https://www.w3.org/TR/epub-33/), [EPUB Accessibility 1.1](https://www.w3.org/TR/epub-a11y-11/) |
| Dictionary / glossary | [Glossary](../08-back-matter/00-Glossary.md), [field dictionary](../02-data/02-Field-Dictionary.md), [book reader](../../book/book.js), [publication builder](../../scripts/build-publication-model.mjs) | [One terminology owner](../../data/vocabularies/glossary.json) now generates prose, hover and publication forms: 33 terms, 36 preserved definitions. Source review, reviewed revisions and domain-specific definitions remain pending; see the [migration guide](../02-data/14-Canonical-Terminology.md). | [SKOS labels and concepts](https://www.w3.org/TR/skos-reference/) |
| Thesaurus / vocabulary | [Resources](../../studio/src/components/Resources.tsx), [field dictionary](../02-data/02-Field-Dictionary.md) | The glossary now has preferred labels and explicit spelling aliases. Broader/narrower concepts, reviewed synonyms and related terms remain missing. Add lexical relationships separately from scientific causality. | [SKOS](https://www.w3.org/TR/skos-reference/) |
| Bible / verse-based text / critical edition | [Permanent object identifiers](../02-data/03-Identifier-System.md), [claims](../../scripts/claims.mjs), [reading adapter](../../scripts/mat-reading.mjs) | Heading slugs are not permanent passage IDs. Borrow edition/witness attribution, stable passage references and annotations when needed. Preserve religious/traditional, philosophical, historical and scientific evidence lanes. | [TEI common elements and references](https://www.tei-c.org/release/doc/tei-p5-doc/en/html/CO.html), [TEI text structures](https://www.tei-c.org/release/doc/tei-p5-doc/en/html/DS.html) |
| Codex / encyclopedia | [Universal schema](../02-data/01-Universal-Schema.md), [universal adapter](../../scripts/mat-universal-object.mjs), [epistemic graph](../../scripts/epistemic-graph.mjs), [source registry](../../data/registries/sources.yaml) | Reverse source navigation was missing; broad scientific acceptance remains incomplete. Use common entry fields for identity, applicable state, evidence, uncertainty, contradictions and revision history. | [SKOS concept organization](https://www.w3.org/TR/skos-reference/) |
| Manual / handbook / field guide | [Implementation ledger](../IMPLEMENTATION-LEDGER.md), [process template](../../templates/Process-Template.md), [design-engine architecture](../02-data/10-Materials-Search-and-Design-Engine.md) | Distinguish tutorials, procedures, reference and explanations. State prerequisites, inputs/outputs, procedure versions, limits, verification and troubleshooting using existing process/experiment owners. | [Diátaxis documentation forms](https://diataxis.fr/) |
| Research catalogue / notebook / dataset | [Sources](../../data/registries/sources.yaml), [source traversal](../../scripts/source-references.mjs), [query API](../../scripts/mat-query-service.mjs), [Hydrogen experiments](../../records/0001-Hydrogen-H/experiments/0001-Hydrogen-H-Experiments.yaml) | Source-specific plain reference, BibTeX and RIS exports now use registered metadata. Missing author/year/page/rights fields, ambiguous attribution and legacy edition metadata still require review against original sources. | [TEI source and bibliographic references](https://www.tei-c.org/release/doc/tei-p5-doc/en/html/CO.html) |

The Bible comparison concerns organization of verse-based and critical editions: durable references, editions, witnesses and annotation. It does not require religious text to become a scientific authority. MAT retains explicit epistemic lanes for each claim. The standards inform incremental work; MAT is not claimed conformant to them.

## Concrete additions in this continuation

The [source navigation guide](Source-Navigation.md) and [generated index](../../data/indexes/source-navigation.json) derive from the existing [source registry](../../data/registries/sources.yaml). They connect a registered source to its authored/structured uses, available locators, original external URL/DOI and retained local snapshots. Studio Resources adds a searchable view. A link, hash or recorded use is not scientific verification.

The index separately reports missing metadata, unresolved source mentions, malformed/unsafe links and local destination coverage. Its precise scope and counts are in its generated guide. Frozen archives, source snapshots, generated copies and code/schema examples are excluded from citation-owner scanning to avoid multiplying derived mentions. External reachability is not inferred from a registered URL. Exact occurrence details are retained separately so the main reader index stays compact.

Internal links in exported documents are repaired in the existing exporter. Packaged EPUB chapter links and safe links to a running deployment have separate handling. Full EPUB/accessibility conformance remains a separate acceptance task; see the handoff for actual results and offline limitations.

## Next executable recommendations

1. Keep source-navigation generation in the publication build. Resolve missing source references by inspecting originals; do not invent bibliographic metadata or silently reassign an ID.
2. Review source-backed terminology revisions for Atomic Radius and Oxidation State. The shared glossary now preserves all earlier formulations; add an explicit reviewed revision mechanism before changing them. Keep lexical links separate from scientific/causal relationships.
3. Review bibliography completeness against source documents, retaining unknown author/year/page fields until they are resolved. Source-specific exports are implemented; keep citing MAT distinct from citing a primary paper.
4. Add stable passage/section IDs and edition-aware cross-references where text-level citation is needed. Preserve old anchors through a documented migration.
5. Review manuals for prerequisites, procedure versions, input/output states, applicability, uncertainty and acceptance criteria. Retain failed and inconclusive experiment records.
6. Validate EPUB, print, keyboard/mobile and assistive-technology behavior independently before release. Add rights and accessibility metadata only from evidence.

## Scientific slice retained alongside documentation work

The [SRM 126c owner](../../records/0026-Iron-Fe/data/properties/0026-Iron-Fe-SRM-126c.yaml) introduces partial mass composition and four ordered preparation steps from a [NIST certificate](https://tsapps.nist.gov/srmext/certificates/126c.pdf), with a [retained PDF](../../data/research/sources/nist-srm-126c-2017-06-22.pdf) registered once as SRC-000346. Certified, reference and information values remain separate; the unreported balance, covariance, process temperatures and phase fractions remain unresolved. This is source transcription and software validation, not an independently measured MAT sample.

## Acceptance and reporting

EXISTING: canonical identities, per-chapter sources, claims, reader and export architecture. IMPROVED/IMPLEMENTED: reverse source navigation, link preservation, source-bound material projection, shared terminology and registry citation exports, with actual tests recorded in the handoff. DESIGNED: source-reviewed definition revisions, semantic vocabulary, edition/passage references and further manual coverage. RESEARCH: historical, religious/traditional and emerging sources retain their original lanes. BLOCKED: missing sources or metadata remain explicit dependencies; a plausible guess is not a repair.

The complete validation record and exact next task are in [MAT_CODEX_CONTINUATION_HANDOFF.md](../../MAT_CODEX_CONTINUATION_HANDOFF.md).

## Terminology and citation continuation

IMPLEMENTED: the [canonical terminology owner](../../data/vocabularies/glossary.json) supplies all three glossary forms, with permanent term IDs, exact internal origins, three retained wording variants and explicit pending source review. [Source-specific export](../../studio/src/source-citations.ts) uses recorded metadata for plain references, BibTeX and RIS; unknown and ambiguous fields remain visible. Neither establishes independently verified science or full APA/thesaurus conformance.

IMPROVED: the publication builder separates known unresolved-ID navigation diagnostics from actual unresolved citations. Diagnostics remain in the [source directory](Source-Navigation.md), navigation JSON and generated chapter metadata. Ordinary chapter citation gaps still block their review status.

The next requirement is source-backed terminology review and an explicit revision path, followed by reviewed edition metadata and independent accessibility/EPUB acceptance. The [continuation handoff](../../MAT_CODEX_CONTINUATION_HANDOFF.md) records executed tests and the exact next action.

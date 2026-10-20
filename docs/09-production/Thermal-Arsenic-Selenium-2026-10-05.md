# Arsenic and Selenium thermal source reviews — 5 October 2026

This bounded stage continues **MAT-PROGRAMME-DATA-FIRST / PARTIAL** in the existing [review selector](../../data/research/mat-update-review.json), [MAT-TODO projection](../../data/quality/MAT-TODO.json) and [continuation handoff](../../MAT_CODEX_CONTINUATION_HANDOFF.md). The existing canonical identity, source registry, accession extractor, scoped generator and reader are reused. No second scientific registry is created.

## Implemented source reviews

[Arsenic's review](../../records/0033-Arsenic-As/0033-Arsenic-As-Thermochemistry-Source-Review.md) preserves **SRC-000351**, the valid [NIST elemental Arsenic page](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440382&Mask=FFFF), retrieved 5 October 2026: formula As, CAS 7440-38-2. The retained page contains reaction thermochemistry and ion energetics, but no Shomate heat-capacity table. These other quantities are not accepted as Cp functions by this review.

[Selenium's review](../../records/0034-Selenium-Se/0034-Selenium-Se-Thermochemistry-Source-Review.md) preserves **SRC-000352**, the valid [NIST elemental Selenium page](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7782492&Mask=FFFF), retrieved 5 October 2026: formula Se, CAS 7782-49-2. It contains phase-change/Antoine vapor-pressure, reaction, ion-energetics and clustering data but no Shomate table. Vapor-pressure parameters are not heat capacity. The listed atomic identity does not establish an equilibrium vapor's species composition. No additional scalar value or fit is accessioned from those separate sections in this stage.

Both reviews link **SRC-000341**, the exact retained 29 September 2026 [JANAF PDF index](https://janaf.nist.gov/janaf4pdf.html), with original retrieval date/hash and unlinked Arsenic/Selenium cells. The live 5 October cells agree. A current recheck does not change the old snapshot's date. Together these sources support a bounded **NO-SHOMATE-IN-RETAINED-PAGE / INSUFFICIENT DATA** result; they do not establish that elemental measurements are absent elsewhere. Other species, clusters or compounds require separate identities and molar bases.

Each review has its own structured YAML, chapter and additive parent links. Heat capacity remains null/UNKNOWN; zero counts describe accepted fits, not physical zero values. No thermal CSV, table or SVG is generated. Wider parent thermal/completeness states remain PLANNED and existing melting/boiling/density and nuclear references remain intact.

## Preservation and verification

All 837 files across 20 pre-existing thermal accession/gap packages were hash checked and remain byte-identical, including the existing Scandium/Germanium reviews. The complete thermal chart receipt manifest is unchanged. Prior catalogue scientific fields, coefficient raw strings and source snapshots remain unchanged. Each new parent package keeps 33 of its 35 pre-existing files unchanged, modifying only parent Markdown/master YAML to add the review. Graph/table manifests and existing figures are untouched. The guarded SRM126c refresh retains its four artifact bytes, scientific owner, certificate and source-346 entry; only the registry input hash changes.

Regression coverage checks source IDs, identity/formula, exact review paths, null CSV/SVG and absence of numeric rows for Germanium/Arsenic/Selenium. A temporary gap-only generation test verifies zero fits/rows, no numeric assets, unchanged unselected owners/receipt, an unrelated sentinel and working-directory restoration. This stage does not introduce a locked-schema or permanent-ID migration. Actual test/build/browser evidence is recorded in the [batch receipt](../../data/quality/thermal-arsenic-selenium-batch-2026-10-05.json) and handoff after execution.

Coverage remains 119 canonical confirmed/foundation identities; 246 source-backed elemental charts; 18 thermal fit owners, 76 fits and 7,676 calculated rows. Four source gaps are now explicitly reviewed. All 143 owner-section acceptance tasks and 4,248 confirmed-element domain reviews remain open. Nine Hydrogen panels are reviewed; 2,587 confirmed-element A/B slots remain pending. These source reviews receive no image-panel credit.

## Next executable action

Review Bromine (0035) primary thermal data, source species/formula and molar basis before accession. The current extractor/generator special-cases Cl2, so validate and extend molecular-formula atom counts and gas/species interpretation before accepting any Br2 fit; do not silently label a molecular basis as atomic. Then inspect Krypton (0036). Preserve all four source gaps and Iron fit-review notes. Source/state/table/chart acceptance precedes remaining A/B images; deferred documentation review remains PARTIAL.

Selenium's separate phase-change/Antoine data is a research lead requiring its own property, phase/species, validity, uncertainty and provenance review. The existing generated gap-marker files lack the numeric owners' receipt-based overwrite protection; preserve authored gap work and regenerate only selected, explicitly reviewed owners. Documentation/terminology, source rights, EPUB/accessibility, dynamics, research/inverse design and matter-compiler acceptance remain partial or designed.

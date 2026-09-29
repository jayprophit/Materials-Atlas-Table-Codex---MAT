# Thermal source accession — Scandium to Nickel

The 29 September 2026 continuation adds source-specific thermal data for Titanium, Vanadium, Chromium, Manganese, Iron, Cobalt and Nickel. Scandium has a separately recorded source-availability gap. All parent IDs, chapter sections, existing data and illustration placeholders are preserved. No element is declared fully advanced.

| Element | Published fits in this accession | Source | Interpretation requiring care |
|---|---:|---|---|
| [Scandium](../../records/0021-Scandium-Sc/0021-Scandium-Sc-Thermochemistry-Source-Review.md) | 0 | SRC-000333, SRC-000341 | No Shomate table in the retained elemental WebBook page; no linked Scandium table in the retained JANAF index. Primary measurements elsewhere remain to be reviewed. |
| [Titanium](../../records/0022-Titanium-Ti/0022-Titanium-Ti-Thermochemistry.md) | 5 | SRC-000334 | Two α-solid intervals and an overlapping β-solid fit remain separate. |
| [Vanadium](../../records/0023-Vanadium-V/0023-Vanadium-V-Thermochemistry.md) | 3 | SRC-000335 | Solid, liquid and atomic-gas functions have their own valid ranges and reference states. |
| [Chromium](../../records/0024-Chromium-Cr/0024-Chromium-Cr-Thermochemistry.md) | 4 | SRC-000336 | Two solid intervals; crystal structure is not inferred from coefficient columns. |
| [Manganese](../../records/0025-Manganese-Mn/0025-Manganese-Mn-Thermochemistry.md) | 6 | SRC-000337 | Four solid intervals have no explicit phase-variant labels in the source fit table. They are not automatically assigned α/β/γ/δ labels. |
| [Iron](../../records/0026-Iron-Fe/0026-Iron-Fe-Thermochemistry.md) | 7 | SRC-000338 | Four α–δ intervals and one overlapping γ fit. The calculated local dip in the 700–1042 K fit has an explicit scientific review task. |
| [Cobalt](../../records/0027-Cobalt-Co/0027-Cobalt-Co-Thermochemistry.md) | 5 | SRC-000339 | Three solid intervals retain unspecified structure rather than assigning a magnetic or structural transition. |
| [Nickel](../../records/0028-Nickel-Ni/0028-Nickel-Ni-Thermochemistry.md) | 5 | SRC-000340 | Three solid intervals remain source intervals, not automatically inferred phase boundaries. |

The seven accepted element accessions contain 35 published fits and 280 coefficient values. Each coefficient retains its literal source string, table line, column, phase comment and review date. Sixteen new exact source responses are retained: seven main pages, seven comparison-table pages, the Scandium page and the JANAF index. Nine new source IDs cover these materials. Previously retained Aluminium–Calcium responses and their retrieval dates remain unchanged.

Each fit supplies 101 calculated rows with heat capacity, standard entropy and phase-specific enthalpy increment: 3,535 new rows and 10,605 calculated quantities. Seven canonical CSVs feed seven Markdown tables and seven SVG charts in the corresponding thermal chapter sections. There are 166 new publisher-rounded comparison rows; these check arithmetic and transcription, not independent experimental truth. Across both thermal batches there are 67 fits, 536 coefficients, 6,767 calculated rows and 349 comparison rows over 15 elements.

## Scope and scientific gaps

These are Chase (1998) fits with their source-specified earlier review dates, retrieved in 2026. The gas species is the elemental atomic formula; equilibrium vapour composition, dissociation and ionisation are not calculated. Unreported coefficient uncertainty and covariance remain UNKNOWN. Fit endpoints do not establish melting/boiling points, stability or magnetic transitions. No arbitrary-pressure extrapolation, phase blending or latent-heat calculation is introduced.

Iron's source α–δ parameterisation yields approximately 34.4849 J mol⁻¹ K⁻¹ at 700 K and 29.3336 at 740 K before rising. These are direct calculations from the retained coefficients, rounded for comparison. Their shape is preserved and labelled as fit behaviour requiring comparison with independent calorimetry or another assessed source. It is not described as a new measured anomaly. Task MAT-0026-THERMAL-FIT-SHAPE-REVIEW tracks that work.

Scandium's null value is deliberately separate from the schema for accepted thermal fits. Its parent thermal domain remains PLANNED, with a source-review status of INSUFFICIENT DATA. Task MAT-0021-THERMAL-SOURCE-GAP asks for applicable elemental measurements or a separate assessed source. Absence from these two retained sources is not absence from all literature; a Scandium compound's heat capacity must not be substituted for the metal.

Thermal conductivity, diffusivity, expansion, pressure-dependent data and transition enthalpies remain open, as do the other advanced domains. Quantitative charts do not count as the requested 22 standalone illustrations. Further image generation stays deferred under the user's data-first priority.

## Canonical data and reproducibility

[Accession configuration](../../data/catalog/nist-thermochemistry-accessions.json) binds each element to its own date, source ID, species and expected source content. [The extraction catalogue](../../data/catalog/thermochemistry-evaluation-index.json) records fits and source gaps separately. [The chart manifest](../../data/quality/thermochemistry-chart-manifest.json) binds each SVG and CSV to its input hash. There is one canonical CSV per element, referenced from both the graph and table manifests.

The offline extractor, record synchroniser and plotting command documented in the [preceding batch](Thermochemistry-Data-First-Batch.md) reproduce this extension. Source bytes are never reformatted or replaced. The gap schema is additive; the locked parent-record schema is unchanged. Titanium–Nickel parent revisions are 1.2.0; Scandium's source-review revision is 1.1.2. These version changes do not confer scientific acceptance.

[Completion matrix](../../data/quality/advanced-completion-matrix.json) · [Unified gaps](../../data/quality/unified-gap-analysis.json) · [TODO ledger](../../data/quality/MAT-TODO.json) · [Exact resume checkpoint](../../MAT-ADVANCED-RESUME.md)

Continue at Copper (0029) for the next thermal accession, while keeping Scandium and Iron's identified review tasks open. Return to the still-missing structure, transport, mechanical, materials/process and other domains systematically. The full project remains PARTIAL.

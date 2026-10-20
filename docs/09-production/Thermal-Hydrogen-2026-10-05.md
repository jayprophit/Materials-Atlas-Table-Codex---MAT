# Hydrogen H₂ — curated thermal supplement, 2026-10-05

**Stage status: IMPLEMENTED and targeted tests passed; wider scientific acceptance remains PARTIAL.** The [batch receipt](../../data/quality/thermal-hydrogen-batch-2026-10-05.json) records the actual terminal test, build, browser and copy results. Scientific source/transcription checks remain separate from independent experimental replication.

## Scope and existing owners

This bounded supplement binds three molecular gas fits to **MAT:0001:MOL:H2**, the existing `/molecular_states/H2` child of the [curated Hydrogen master](../../records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml). **MAT:0001 remains Hydrogen**. Atomic H, molecular H₂, ions, isotopes and nuclear-spin children retain their existing identities.

The curated adapter verifies the molecular child, canonical owner path and owner hash before planning writes. It appends a clearly delimited reader supplement and adds compatible graph/table entries without regenerating the hand-authored master or rewriting the existing chapter and manifests. Edited append blocks and conflicting physical numeric slots must block regeneration. Post-generation preservation passed: the master is byte-identical, all authored parent/manifest prefixes are intact, and earlier 35 thermal owners, 71 gaps, 35 chart receipts and 105 data/CSV/SVG hashes are unchanged.

The [existing Hydrogen source ledger](../../records/0001-Hydrogen-H/sources/0001-Hydrogen-H-Sources.yaml) and [central source registry](../../data/registries/sources.yaml) retain distinct responsibilities:

- **SRC-000007:** atomic H thermochemistry and electron affinity.
- **SRC-000010:** molecular H₂ identity and spectroscopy, with its existing retrieval metadata preserved.
- **SRC-000011:** NIST TN 2126-upd1 equilibrium-H₂ phase reference, including the state-qualified boiling point; this stage does not revalidate that compilation.
- **SRC-000012:** [Leachman et al. (2009), DOI 10.1063/1.3160306](https://doi.org/10.1063/1.3160306), distinct para-, normal- and orthohydrogen equations of state. Its publication metadata comes from the existing owner; the full paper is not revalidated in this stage.

The dated thermal source is **SRC-000508**, with `same_work_as: SRC-000010` and an explicit scope note: a separate retrieval of the same WebBook work is **not independent corroboration**. The existing registry holds its exact page/table hashes and the source-work link. No earlier source identity or retrieval date is replaced.

## Exact primary sources and applicable calculations

The recorded SRC-000010 spectroscopy page links directly to the [molecular H₂ gas thermochemistry page](https://webbook.nist.gov/cgi/cbook.cgi?ID=C1333740&Mask=1#Thermo-Gas). Its [publisher table link](https://webbook.nist.gov/cgi/cbook.cgi?ID=C1333740&Mask=1&Type=JANAFG&Table=on#JANAFG) explicitly supplies `JANAFG`; the type and species were not guessed. HTTP retrieval removes only the fragment and preserves the observed query ordering.

| Retained accessioned source | Observed response | SHA-256 |
|---|---:|---|
| [Coefficient page](../../data/catalog/sources/nist-thermochemistry-0001-2026-10-05.html.txt) | 27,273 bytes; HTTP 200 HTML | `42f0d2c069f3abaf36a07c899c9d37455c0c030b3da9e0c7f56f26f258f864bc` |
| [Exact linked publisher table](../../data/catalog/sources/nist-thermochemistry-0001-2026-10-05-table.html.txt) | 40,054 bytes; HTTP 200 HTML | `179496cc60b53cf8bab7297c7c6d53eec4b2c557bffec21d496f778c9cac5fda` |

Canonical source snapshots retain the exact reviewed bytes and observed URLs. Private reviewed bytes and HTTP metadata are retained in `.mat-local/thermal-hydrogen-2026-10-05/source-review/`. An additional response with reordered query parameters was checked and has identical parsed scientific tables; it is not another scientific source.

The three GAS intervals are **298–1000 K, 1000–2500 K and 2500–6000 K**, with coefficients attributed to Chase (1998). Each source comment preserves review in March 1977 and a new parameter fit in October 2001. The basis is **mol H₂**, containing two moles of H atoms per mole of molecules; no conversion to atomic-H properties is applied.

Cp° and S° use **J mol⁻¹ K⁻¹**; H°(T)−H°(298.15 K) uses **kJ mol⁻¹**. The table contains **303 calculated rows**, 101 per fit, with no extrapolation or smoothing across intervals. Its extra computational digits do not establish physical precision.

Spin population, isotope fractions and applied sample pressure remain **UNKNOWN / UNSPECIFIED-IN-RETAINED-FIT**. The page's o-/p-Hydrogen aliases do not specify fit populations. Its separate entropy datum carries a 1 bar reference label, which does not supply an arbitrary-pressure model or measured sample conditions. These fits do not determine cryogenic liquid/solid behaviour, the equilibrium-H₂ boiling point, spin conversion, dissociation or ionisation equilibria. Coefficient uncertainty and covariance are unreported; calculated uncertainty remains UNKNOWN.

## Outputs and verification evidence

The following canonical outputs were generated; final reader-copy evidence is recorded in the batch receipt:

- [Structured coefficients and molecular subject](../../records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H-NIST-Thermochemistry.yaml)
- [Reader supplement and limits](../../records/0001-Hydrogen-H/0001-Hydrogen-H-Thermochemistry.md)
- [Calculated reference table](../../records/0001-Hydrogen-H/tables/0001-Hydrogen-H-TABLE-010-Thermodynamic-Functions.md) and [complete CSV](../../records/0001-Hydrogen-H/tables/0001-Hydrogen-H-TABLE-010-Thermodynamic-Functions.csv)
- [Calculated heat-capacity SVG](../../records/0001-Hydrogen-H/graphs/0001-Hydrogen-H-GRAPH-009-Heat-Capacity.svg)
- [Existing generation receipt](../../data/quality/thermochemistry-chart-manifest.json), [accession instructions](../../data/catalog/nist-thermochemistry-accessions.json) and [thermal catalogue](../../data/catalog/thermochemistry-evaluation-index.json)

**Source consistency PASS:** all 61 publisher rows agree with the retained coefficients within their printed quantity precision; all 303 within-fit samples have positive finite Cp and finite S/H. Independent numerical differentiation gives maximum relative residuals of **4.8301 × 10⁻¹⁰** for dH/dT = Cp, with the kJ-to-J conversion, and **1.9943 × 10⁻⁹** for dS/dT = Cp/T. No publisher discrepancies were found. Raw rows, rounding tolerances and derivative checks are retained privately. These results establish transcription and arithmetic consistency, not independent experimental replication or complete Hydrogen thermophysical validation.

**TESTED:** 20 focused adapter/arithmetic checks, eight Python extraction checks, six native plotting checks and 18 post-generation adapter/projection checks passed. Studio unit tests passed 33/33. The native chart preview was visually inspected with no clipped labels. The batch receipt records the final broader repository tests, audit, reference integrity, TypeScript/build, Chromium browser and publication-copy outcomes; these do not qualify the full scientific system.

## Continuation and remaining work

Continue through the existing [DATA-FIRST scope](Data-Tables-and-Charts-2026-10-04.md), [remaining-element thermal checkpoint](Thermal-Remaining-Elements-2026-10-05.md), [review selector](../../data/research/mat-update-review.json), [MAT work tracker](../../data/quality/MAT-TODO.json) and [continuation handoff](../../MAT_CODEX_CONTINUATION_HANDOFF.md). Do not create a competing selector or restart MAT.

Continue with the guarded curated adapter to the remaining authored records **0002–0012**, starting with Helium, using individually verified species, states and sources. Audit occupied asset IDs and add explicit reviewed unused slot configuration before generation; the current adapter correctly refuses legacy/physical collisions. The **71 documented thermal source gaps** retain their measured-data requirements; a no-fit or no-match review is not scientific completion. Other thermal properties and element-domain reviews remain open.

The requirement for **22 standalone images per confirmed element** remains separate. The existing nine reviewed Hydrogen panels leave thirteen Hydrogen slots pending; the wider image programme remains unfinished. This supplemental SVG earns **zero standalone-panel credit**. Complete source/state/table/chart acceptance before producing the remaining evidence-bound illustrations.

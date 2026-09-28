# Source-bound thermal enrichment — Aluminium to Calcium

Eight canonical element chapters now contain their own thermal supplement, structured coefficients, calculated table, CSV and heat-capacity chart. All outputs use existing element IDs and the locked thermal chapter section. Wider element completion remains PARTIAL; no element is certified fully advanced.

| Element | Published fits | Source | Important distinction |
|---|---:|---|---|
| [Aluminium](../../records/0013-Aluminium-Al/0013-Aluminium-Al-Thermochemistry.md) | 3 | SRC-000325 | Solid ends at 933 K; liquid begins at 933.45 K. The gap is preserved. |
| [Silicon](../../records/0014-Silicon-Si/0014-Silicon-Si-Thermochemistry.md) | 3 | SRC-000326 | Separate solid, liquid and atomic-gas reference states. |
| [Phosphorus](../../records/0015-Phosphorus-P/0015-Phosphorus-P-Thermochemistry.md) | 7 | SRC-000327 | Four source-labelled solid variants overlap in temperature. |
| [Sulfur](../../records/0016-Sulfur-S/0016-Sulfur-S-Thermochemistry.md) | 6 | SRC-000328 | Orthorhombic and monoclinic solids remain distinct; liquid and gas have separate intervals. |
| [Chlorine](../../records/0017-Chlorine-Cl/0017-Chlorine-Cl-Thermochemistry.md) | 3 | SRC-000329 | The molar basis is Cl₂ molecules, not atomic chlorine. |
| [Argon](../../records/0018-Argon-Ar/0018-Argon-Ar-Thermochemistry.md) | 1 | SRC-000330 | The retained fit is gas-only; condensed phases are not supplied by this accession. |
| [Potassium](../../records/0019-Potassium-K/0019-Potassium-K-Thermochemistry.md) | 4 | SRC-000331 | Solid, liquid and two atomic-gas intervals remain separate. |
| [Calcium](../../records/0020-Calcium-Ca/0020-Calcium-Ca-Thermochemistry.md) | 5 | SRC-000332 | α and β solids overlap; β itself has two intervals. |

The 32 fits contain 256 source coefficient strings and values. Each has a source-table line and column, formula basis, phase label, exact temperature range, reference, earlier review date and explicit UNKNOWN coefficient uncertainty/covariance. Sixteen original NIST HTML responses are retained as inert text snapshots with byte counts and SHA-256 hashes. The pages were retrieved on 28 September 2026; the Chase compilation is dated 1998 and does not represent a new measurement.

The equations generate 3,232 state/temperature rows, each with molar heat capacity, standard entropy and a phase-specific enthalpy increment: 9,696 calculated quantities. Independent retrieval of NIST's rounded calculation tables supplies 183 comparison rows. These comparisons and derivative-identity checks verify extraction and arithmetic. They are not independent experimental confirmation. No uncertainty or covariance was invented.

The eight SVG charts are plotted from the same rows as the CSVs. Near-constant fits use a sensible vertical span so residual coefficients do not appear to describe large physical changes. Each panel has its own temperature and heat-capacity scales. Chart limits do not establish phase boundaries or stability. These are quantitative supplements; none is counted as one of the 22 requested standalone illustrations.

## Canonical ownership and reproduction

The retained NIST bytes are the accession evidence. `scripts/extract-nist-thermochemistry.py` produces the generated catalogue extraction; `scripts/sync-thermochemistry.mjs` projects it into the existing element records and registers one table/graph ID for each. Derived catalogue, reader and publication files are reproducible projections, not separately authored copies. Do not edit a generated coefficient copy independently.

Reproduce offline with:

```text
python scripts/extract-nist-thermochemistry.py
node scripts/sync-thermochemistry.mjs
python scripts/plot-thermochemistry.py
node scripts/validate-thermochemistry.mjs
npm run audit:refresh
```

Plotting uses the existing `scripts/requirements-plots.txt` environment. The parser uses the Python standard library. The supplemental schema is `data/schema/1.0.0/thermochemistry-evaluation.schema.json`; the locked parent schema is unchanged. Source registry entries SRC-000325–SRC-000332 identify the exact source and comparison snapshots. The full MAT validation suite includes the new thermochemistry checks.

The eight parent chapters and structured records now agree on revision 1.2.0 and the 28 September update date. Earlier revision entries are preserved and their split table formatting is repaired. BASELINE and PARTIAL scientific status remain unchanged. The shared audit-refresh command regenerates dependent scope hashes in order before validation and publication.

## Remaining work and recommendations

1. Continue source-by-source thermal accession from Scandium onward. Do not copy these values into another element or presume that the same phases/species are available.
2. Return to the missing Aluminium and neighbouring-element domains: crystal structure and lattice conditions, density, transport, mechanical/deformation/defect data, corrosion, alloy process history and application-specific evidence. A heat-capacity fit does not fill these domains.
3. Resolve standard-state pressure, formation/reference enthalpies, latent heats and source-to-source phase-reference discrepancies before constructing a phase diagram or joining enthalpy curves. Review later evaluations against these dated fits.
4. Preserve all original Rife/Russell source data in the historical research collection. Ninth-octave property cells now retain their locations; intended name associations still require review. Symbolic tone codes remain separate from hertz measurements.
5. Resume the 22-image production plan after the data-first review. Existing reviewed assets and placeholders remain in their chapters.

[Advanced completion matrix](../../data/quality/advanced-completion-matrix.json) · [Complete TODO ledger](../../data/quality/MAT-TODO.json) · [Exact resume checkpoint](../../MAT-ADVANCED-RESUME.md)

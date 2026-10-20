# Publisher temperature comparison interpretation

The bounded temperature-evidence guard passed software acceptance on 12 October 2026 at 11:00:17 UTC: 286 core tests, full audit refresh, publication preparation, validation and output-copy checks. Independent review passed 16 targeted tests; all 439 protected scientific files retained their original bytes. Actual terminal receipts and the subsequent metadata projection proof are retained under `.mat-local/temperature-interpretation-2026-10-12/`. Scientific acceptance remains PARTIAL.

## Problem and resulting behavior

A rounded publisher temperature label can disagree with the listed rounded calculation while a source-fit endpoint inside the label's rounding cell agrees. Choosing that endpoint does not uniquely establish the publisher's internal temperature throughout the rounding cell. Source labels, the chosen comparison temperature and a measured temperature must remain distinct.

- The [offline extractor](../../scripts/extract-nist-thermochemistry.py) labels newly produced endpoint overrides `calculation_temperature_evidence: INTERPRETATION`.
- The [shared runtime guard](../../scripts/thermochemistry-publisher-temperature.mjs) preserves the raw printed temperature and numeric cells, original source-fit binding, rounding cell, range limits and uniquely agreeing endpoint among endpoint candidates. It rejects `MEASURED`, `EXACT`, orphan classification fields, altered raw identities and replacement of an already agreeing nominal temperature.
- The [bounded generator](../../scripts/sync-thermochemistry.mjs) validates every selected comparison before planning writes. It derives local review notes and carries them into future generated models and chapters without mutating the catalogue or authored notes. Conflicting note identities fail rather than replacing prose.
- The [validator](../../scripts/validate-thermochemistry.mjs) interprets the four legacy untagged rows while accepting their unchanged stored notes. Explicitly tagged overrides require the derived interpretation note. Omitted optional comparison rows supply no evidence or invented note; malformed supplied rows fail.

## Preservation and scientific scope

Lithium, Beryllium, Boron and Bromine have four retained overrides. Their stored comparison rows, owner models, chapters, numerical tables and charts are unchanged in this tooling cycle. Existing chapters acquire the derived note only after an explicitly reviewed bounded regeneration. No migration or live scientific regeneration was performed here.

The existing thermal catalogue retains 45 elements, 148 fits, 14,948 calculated rows and 71 source gaps. This is partial thermal coverage, not whole-element completion. The separate fourth publisher Gibbs-function column remains inert in this production guard until its mapping is reviewed. Uncertainty and covariance remain UNKNOWN where not supplied.

Sodium's retained-source independent review supplies the motivating qualification: its printed first row remains 1171 K; choosing 1170.525 K is a boundary-compatible comparison interpretation, not a uniquely recovered hidden publisher temperature. That review does not approve source rights, accession or experimental replication. No Sodium value or source identity was admitted by this guard.

## Verification and continuation

The [comparison-evidence tests](../../scripts/tests/thermochemistry-temperature-evidence.test.mjs) cover the four retained rows, synthetic interval non-uniqueness, raw-cell integrity, unsupported evidence labels, note immutability/conflicts and legacy compatibility. [Curated generator tests](../../scripts/tests/thermochemistry-curated.test.mjs) verify future note rendering into model and chapter and rejection before output writes. [Extractor tests](../../scripts/tests/test_extract_nist_thermochemistry.py) verify the new tag using isolated fixtures. Synthetic arithmetic fixtures are code tests, never scientific records.

Use the existing [selector](../../data/research/mat-update-review.json), [TODO](../../data/quality/MAT-TODO.json) and [handoff](../../MAT_CODEX_CONTINUATION_HANDOFF.md). Resolve exact source/version rights and recheck identities, source hashes, row labels and slots before any Sodium accession. Keep the saved page-11 catalogue routes as the bounded metadata continuation. No source IDs, scientific values or standalone-panel credit were added.

Original references remain available through the [NIST/CERN catalogue guide](Scientific-Catalogues-2026-10-07.md), [NIST WebBook citation guide](https://webbook.nist.gov/cgi/cbook.cgi?Contrib=) and [NIST rights policy](https://www.nist.gov/open/copyright-fair-use-and-licensing-statements-srd-data-software-and-technical-series-publications). A citation or software test does not establish redistribution permission or physical replication.

# Helium — curated atomic gas supplement, 2026-10-05

Stage status: IMPLEMENTED; terminal repository/build/browser verification is recorded in the linked batch receipt. The full MAT programme remains PARTIAL.

## Existing owners and reconciliation

MAT:0002 remains Helium. This supplement binds to MAT:0002:ATOM:He, charge zero, at /atomic_states/0 in the [unchanged authored master](../../records/0002-Helium-He/data/structured/0002-Helium-He.yaml). The authored isotope, quantum-fluid, chemistry, plasma and He2 owners are preserved. The [existing graph manifest](../../records/0002-Helium-He/data/structured/0002-Helium-He-Graph-Manifest.yaml) reserves graph9 for the dimer; new thermal graph10 uses an explicitly reviewed allocation. Table10 was free. The previously absent [table manifest](../../records/0002-Helium-He/data/structured/0002-Helium-He-Table-Manifest.yaml) now registers the nine existing tables as EXISTS with NEEDS-REVIEW, carrying only their explicit inline source IDs. Registration does not constitute scientific verification.

## Primary source and evidence

The directly linked [NIST He gas page](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440597&Units=SI&Mask=1) and [publisher calculation table](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440597&Units=SI&Mask=1&Type=JANAFG&Table=on) identify neutral monatomic He, CAS7440-59-7. One Chase (1998) GAS Shomate fit covers 298–6000 K, on mol He basis. Its retained comment reports a March 1982 data review. The exact [main HTML snapshot](../../data/catalog/sources/nist-thermochemistry-0002-2026-10-05.html.txt) and [table snapshot](../../data/catalog/sources/nist-thermochemistry-0002-2026-10-05-table.html.txt) retain their byte/hash identities. SRC-000509 in the [canonical source registry](../../data/registries/sources.yaml) is a dated scope/retrieval revision of SRC-000024, not independent corroboration; the earlier source node is unchanged.

All 59 publisher rows passed printed-precision checks, and all 101 calculated samples were finite with positive heat capacity. Numerical dH/dT and dS/dT checks passed. These are transcription and numerical consistency checks, not independent calorimetry. Coefficient uncertainty/covariance, applied sample pressure and isotope composition remain UNKNOWN. Molecular spin-isomer populations are not applicable to the monatomic species; this does not imply zero isotope nuclear spin. No cryogenic, superfluid, dimer, ion, equilibrium-mixture or arbitrary-pressure EOS properties are inferred.

## Implemented outputs and compatibility

The [thermal chapter](../../records/0002-Helium-He/0002-Helium-He-Thermochemistry.md), [structured fit owner](../../records/0002-Helium-He/data/structured/0002-Helium-He-NIST-Thermochemistry.yaml), [calculated table](../../records/0002-Helium-He/tables/0002-Helium-He-TABLE-010-Thermodynamic-Functions.md), [complete CSV](../../records/0002-Helium-He/tables/0002-Helium-He-TABLE-010-Thermodynamic-Functions.csv) and [native SVG](../../records/0002-Helium-He/graphs/0002-Helium-He-GRAPH-010-Heat-Capacity.svg) share one retained dataset and source context. The parent reader and existing graph manifest receive byte-preserving append blocks; the master remains unchanged. Reviewed slots pass config→index→model→plot→publication checks. Unspecified allocations retain prior table10/graph9 defaults; malformed, forged, occupied or edited targets are rejected before writes. The curated species adapter currently accepts GAS-only fits; condensed states need explicit phase bindings.

The native preview was inspected for complete labels, nearly constant positive Cp, endpoint markers and source/unknown-context footer. This is a supplemental scientific chart with zero A/B illustration credit. No speculative numeric image contents were generated.

## Verification and remaining work

The [batch receipt](../../data/quality/thermal-helium-batch-2026-10-05.json) records actual tests, hashes, migration paths and final status. Baseline arithmetic/selection tests passed 14/14; focused adapter tests passed 27/27 and extractor tests passed 9/9 at the initial checkpoint. Final full-suite/build/browser results are recorded only after terminal evidence. Preservation checks passed for 5,178 prior record files: 5,176 byte-identical and two authored files with byte-identical original prefixes; 36 prior fit owners, 71 source gaps, 36 chart receipts, 108 asset hashes and 400 source nodes remain unchanged. The nine old Helium table files are unchanged.

Global totals: 37 thermal fit owners, 136 fits, 13,736 calculated rows and 71 source gaps; 265 elemental supplemental charts. All 119 canonical identities are represented. Full scientific acceptance remains pending: 143 master tasks and4,248 confirmed-domain reviews are open; no fully advanced element is certified. Nine standalone Hydrogen panels are reviewed and 2,587 confirmed slots remain pending.

The universal object projection still has 191 objects and does not emit the declared Helium atomic child. This is a separately recorded projection gap, even though the chart API exposes its validated subject. Historical missing citations/source metadata, source rights, dictionary/thesaurus/manual/source-navigation follow-up, full publishing/accessibility, transport/dynamics/multiphysics, authored-framework testing and discovery remain pending in the [existing selector](../../data/research/mat-update-review.json) and [MAT TODO](../../data/quality/MAT-TODO.json).

## Next executable requirement

Audit authored Lithium 0003 and its primary thermochemical sources. Its neutral child is MAT:0003:ATOM:Li at /states/0; do not assign solid/liquid fits to that gas atom. Review a gas-only atomic supplement under the current curated contract, or extend explicit phase/state bindings before accepting condensed fits. Both existing manifests have slots 001–009; GRAPH:009 is the authored theoretical-capacity graph, and GRAPH:010/TABLE:010 are free. Preserve its master, BCC phase, existing thermal references and authored bytes. Then continue 0004–0012 individually. The separate universal ATOM-child projection gap, 71 bounded thermal source gaps, transport/dynamics/domain acceptance and remaining standalone A/B images remain pending. Source/state/table/chart acceptance precedes illustrations; documentation programme remains PARTIAL.


## 6 October review-note integration correction

The existing gap validator caught two scope notes without the required task identifiers. Both now use the established note_id/status/evidence_status contract, and shared schema/generator/audit guards reject malformed or duplicate notes before writing outputs. Focused tests passed 29/29. Fit coefficients, the complete CSV and native SVG remained byte-identical; only review metadata and reader note labels changed. The failed check and corrected final results remain in the batch receipt.

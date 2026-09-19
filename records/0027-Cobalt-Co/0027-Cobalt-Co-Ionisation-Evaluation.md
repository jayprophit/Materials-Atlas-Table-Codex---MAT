# Cobalt — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 27 charge-state rows and 27 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Cobalt record](0027-Cobalt-Co.md)
- [Structured values and provenance](data/structured/0027-Cobalt-Co-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Co I | 0 | 3p6.3d7.4s2 | 4F&lt;9/2&gt; | 7.88101 | 0.00012 | EVALUATED-UNBRACKETED | 353 |
| Co II | 1 | 3d8 | 3F&lt;4&gt; | 17.0844 | 0.0012 | EVALUATED-UNBRACKETED | 354 |
| Co III | 2 | 3d7 | 4F&lt;9/2&gt; | [33.50] | 0.06 | SEMIEMPIRICAL | 355 |
| Co IV | 3 | 3d6 | 5D&lt;4&gt; | [51.27] | 0.10 | SEMIEMPIRICAL | 356 |
| Co V | 4 | 3d5 | 6S&lt;5/2&gt; | [79.50] | 0.20 | SEMIEMPIRICAL | 357 |
| Co VI | 5 | 3d4 | 5D0 | [102.00] | 0.20 | SEMIEMPIRICAL | 358 |
| Co VII | 6 | 3d3 | 4F&lt;3/2&gt; | [128.9] | 0.5 | SEMIEMPIRICAL | 359 |
| Co VIII | 7 | 3p6.3d2 | 3F&lt;2&gt; | [157.8] | 0.6 | SEMIEMPIRICAL | 360 |
| Co IX | 8 | 3p6.3d | 2D&lt;3/2&gt; | 186.14 | 0.25 | EVALUATED-UNBRACKETED | 361 |
| Co X | 9 | 3s2.3p6 | 1S0 | [275.4] | 0.4 | SEMIEMPIRICAL | 362 |
| Co XI | 10 | 3s2.3p5 | 2P*&lt;3/2&gt; | [305.32] | 0.23 | SEMIEMPIRICAL | 363 |
| Co XII | 11 | 3s2.3p4 | 3P&lt;2&gt; | [336.1] | 0.4 | SEMIEMPIRICAL | 364 |
| Co XIII | 12 | 3s2.3p3 | 4S*&lt;3/2&gt; | [378.5] | 0.7 | SEMIEMPIRICAL | 365 |
| Co XIV | 13 | 3s2.3p2 | 3P0 | [410.0] | 1.0 | SEMIEMPIRICAL | 366 |
| Co XV | 14 | 3s2.3p | 2P*&lt;1/2&gt; | [441.1] | 1.4 | SEMIEMPIRICAL | 367 |
| Co XVI | 15 | 2p6.3s2 | 1S0 | [511.96] | 0.06 | SEMIEMPIRICAL | 368 |
| Co XVII | 16 | 2p6.3s | 2S&lt;1/2&gt; | [546.588] | 0.015 | SEMIEMPIRICAL | 369 |
| Co XVIII | 17 | 2s2.2p6 | 1S0 | 1397.2 | 0.5 | EVALUATED-UNBRACKETED | 370 |
| Co XIX | 18 | 2s2.2p5 | 2P*&lt;3/2&gt; | 1504.5 | 1.2 | EVALUATED-UNBRACKETED | 371 |
| Co XX | 19 | 2s2.2p4 | 3P&lt;2&gt; | [1606] | 4 | SEMIEMPIRICAL | 372 |
| Co XXI | 20 | 2s2.2p3 | 4S*&lt;3/2&gt; | [1724] | 3 | SEMIEMPIRICAL | 373 |
| Co XXII | 21 | 2s2.2p2 | 3P0 | [1844.0] | 1.1 | SEMIEMPIRICAL | 374 |
| Co XXIII | 22 | 2s2.2p | 2P*&lt;1/2&gt; | [1960.8] | 0.8 | SEMIEMPIRICAL | 375 |
| Co XXIV | 23 | 1s2.2s2 | 1S0 | [2119.4] | 1.9 | SEMIEMPIRICAL | 376 |
| Co XXV | 24 | 1s2.2s | 2S&lt;1/2&gt; | (2218.876) | 0.007 | THEORETICAL | 377 |
| Co XXVI | 25 | 1s2 | 1S0 | (9544.1817) | 0.0010 | THEORETICAL | 378 |
| Co XXVII | 26 | 1s | 2S&lt;1/2&gt; | (10012.1297) | 0.0004 | THEORETICAL | 379 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0027-Cobalt-Co-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

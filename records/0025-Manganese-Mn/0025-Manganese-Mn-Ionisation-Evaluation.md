# Manganese — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 25 charge-state rows and 25 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Manganese record](0025-Manganese-Mn.md)
- [Structured values and provenance](data/structured/0025-Manganese-Mn-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Mn I | 0 | 3d5.4s2 | 6S&lt;5/2&gt; | 7.4340380 | 0.0000012 | EVALUATED-UNBRACKETED | 302 |
| Mn II | 1 | 3d5.(6S).4s | 7S&lt;3&gt; | 15.63999 | 0.00007 | EVALUATED-UNBRACKETED | 303 |
| Mn III | 2 | 3d5 | 6S&lt;5/2&gt; | 33.668 | 0.012 | EVALUATED-UNBRACKETED | 304 |
| Mn IV | 3 | 3d4 | 5D0 | [51.21] | 0.12 | SEMIEMPIRICAL | 305 |
| Mn V | 4 | 3d3 | 4F&lt;3/2&gt; | [72.41] | 0.10 | SEMIEMPIRICAL | 306 |
| Mn VI | 5 | 3p6.3d2 | 3F&lt;2&gt; | 95.604 | 0.025 | EVALUATED-UNBRACKETED | 307 |
| Mn VII | 6 | 3p6.3d | 2D&lt;3/2&gt; | 119.203 | 0.012 | EVALUATED-UNBRACKETED | 308 |
| Mn VIII | 7 | 3s2.3p6 | 1S0 | [195.5] | 0.3 | SEMIEMPIRICAL | 309 |
| Mn IX | 8 | 3s2.3p5 | 2P*&lt;3/2&gt; | [221.89] | 0.17 | SEMIEMPIRICAL | 310 |
| Mn X | 9 | 3s2.3p4 | 3P&lt;2&gt; | [248.6] | 0.3 | SEMIEMPIRICAL | 311 |
| Mn XI | 10 | 3s2.3p3 | 4S*&lt;3/2&gt; | [286.1] | 0.5 | SEMIEMPIRICAL | 312 |
| Mn XII | 11 | 3s2.3p2 | 3P0 | [314.4] | 0.6 | SEMIEMPIRICAL | 313 |
| Mn XIII | 12 | 3s2.3p | 2P*&lt;1/2&gt; | [343.6] | 0.7 | SEMIEMPIRICAL | 314 |
| Mn XIV | 13 | 2p6.3s2 | 1S0 | [402.95] | 0.25 | SEMIEMPIRICAL | 315 |
| Mn XV | 14 | 2p6.3s | 2S&lt;1/2&gt; | [435.172] | 0.007 | SEMIEMPIRICAL | 316 |
| Mn XVI | 15 | 2s2.2p6 | 1S0 | [1133.7] | 0.6 | SEMIEMPIRICAL | 317 |
| Mn XVII | 16 | 2s2.2p5 | 2P*&lt;3/2&gt; | [1224.1] | 1.5 | SEMIEMPIRICAL | 318 |
| Mn XVIII | 17 | 2s2.2p4 | 3P&lt;2&gt; | [1320.3] | 2.5 | SEMIEMPIRICAL | 319 |
| Mn XIX | 18 | 2s2.2p3 | 4S*&lt;3/2&gt; | [1430.9] | 2.2 | SEMIEMPIRICAL | 320 |
| Mn XX | 19 | 2s2.2p2 | 3P0 | [1537.2] | 0.8 | SEMIEMPIRICAL | 321 |
| Mn XXI | 20 | 2s2.2p | 2P*&lt;1/2&gt; | [1643.2] | 0.7 | SEMIEMPIRICAL | 322 |
| Mn XXII | 21 | 1s2.2s2 | 1S0 | [1788.7] | 0.6 | SEMIEMPIRICAL | 323 |
| Mn XXIII | 22 | 1s2.2s | 2S&lt;1/2&gt; | (1879.873) | 0.007 | THEORETICAL | 324 |
| Mn XXIV | 23 | 1s2 | 1S0 | (8140.7864) | 0.0014 | THEORETICAL | 325 |
| Mn XXV | 24 | 1s | 2S&lt;1/2&gt; | (8571.95438) | 0.00022 | THEORETICAL | 326 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0025-Manganese-Mn-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

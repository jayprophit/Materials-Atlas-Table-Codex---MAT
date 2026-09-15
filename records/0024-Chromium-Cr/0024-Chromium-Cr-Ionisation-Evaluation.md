# Chromium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 24 charge-state rows and 24 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Chromium record](0024-Chromium-Cr.md)
- [Structured values and provenance](data/structured/0024-Chromium-Cr-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Cr I | 0 | 3d5.(6S).4s | 7S&lt;3&gt; | 6.76651 | 0.00004 | EVALUATED-UNBRACKETED | 278 |
| Cr II | 1 | 3d5 | 6S&lt;5/2&gt; | 16.486305 | 0.000015 | EVALUATED-UNBRACKETED | 279 |
| Cr III | 2 | 3d4 | 5D0 | 30.959 | 0.025 | EVALUATED-UNBRACKETED | 280 |
| Cr IV | 3 | 3d3 | 4F&lt;3/2&gt; | [49.16] | 0.05 | SEMIEMPIRICAL | 281 |
| Cr V | 4 | 3p6.3d2 | 3F&lt;2&gt; | [69.46] | 0.04 | SEMIEMPIRICAL | 282 |
| Cr VI | 5 | 3p6.3d | 2D&lt;3/2&gt; | 90.6349 | 0.0007 | EVALUATED-UNBRACKETED | 283 |
| Cr VII | 6 | 3s2.3p6 | 1S0 | [160.29] | 0.06 | SEMIEMPIRICAL | 284 |
| Cr VIII | 7 | 3s2.3p5 | 2P*&lt;3/2&gt; | [184.76] | 0.15 | SEMIEMPIRICAL | 285 |
| Cr IX | 8 | 3s2.3p4 | 3P&lt;2&gt; | [209.5] | 0.3 | SEMIEMPIRICAL | 286 |
| Cr X | 9 | 3s2.3p3 | 4S*&lt;3/2&gt; | [244.5] | 0.5 | SEMIEMPIRICAL | 287 |
| Cr XI | 10 | 3s2.3p2 | 3P0 | [270.8] | 0.5 | SEMIEMPIRICAL | 288 |
| Cr XII | 11 | 3s2.3p | 2P*&lt;1/2&gt; | [296.7] | 0.6 | SEMIEMPIRICAL | 289 |
| Cr XIII | 12 | 2p6.3s2 | 1S0 | [354.7] | 0.3 | SEMIEMPIRICAL | 290 |
| Cr XIV | 13 | 2p6.3s | 2S&lt;1/2&gt; | [384.163] | 0.006 | SEMIEMPIRICAL | 291 |
| Cr XV | 14 | 2s2.2p6 | 1S0 | [1011.6] | 0.5 | SEMIEMPIRICAL | 292 |
| Cr XVI | 15 | 2s2.2p5 | 2P*&lt;3/2&gt; | [1097.2] | 1.4 | SEMIEMPIRICAL | 293 |
| Cr XVII | 16 | 2s2.2p4 | 3P&lt;2&gt; | [1188.0] | 2.1 | SEMIEMPIRICAL | 294 |
| Cr XVIII | 17 | 2s2.2p3 | 4S*&lt;3/2&gt; | [1294.8] | 1.6 | SEMIEMPIRICAL | 295 |
| Cr XIX | 18 | 2s2.2p2 | 3P0 | [1394.5] | 0.7 | SEMIEMPIRICAL | 296 |
| Cr XX | 19 | 2s2.2p | 2P*&lt;1/2&gt; | [1495.1] | 0.7 | SEMIEMPIRICAL | 297 |
| Cr XXI | 20 | 1s2.2s2 | 1S0 | [1634.1] | 0.5 | SEMIEMPIRICAL | 298 |
| Cr XXII | 21 | 1s2.2s | 2S&lt;1/2&gt; | (1721.183) | 0.007 | THEORETICAL | 299 |
| Cr XXIII | 22 | 1s2 | 1S0 | (7481.8624) | 0.0012 | THEORETICAL | 300 |
| Cr XXIV | 23 | 1s | 2S&lt;1/2&gt; | (7894.80289) | 0.00019 | THEORETICAL | 301 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0024-Chromium-Cr-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

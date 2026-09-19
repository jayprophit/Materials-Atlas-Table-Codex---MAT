# Nickel — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 28 charge-state rows and 28 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Nickel record](0028-Nickel-Ni.md)
- [Structured values and provenance](data/structured/0028-Nickel-Ni-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Ni I | 0 | 3d8.(3F).4s2 | 3F&lt;4&gt; | 7.639878 | 0.000017 | EVALUATED-UNBRACKETED | 380 |
| Ni II | 1 | 3p6.3d9 | 2D&lt;5/2&gt; | 18.168838 | 0.000025 | EVALUATED-UNBRACKETED | 381 |
| Ni III | 2 | 3p6.3d8 | 3F&lt;4&gt; | 35.187 | 0.019 | EVALUATED-UNBRACKETED | 382 |
| Ni IV | 3 | 3p6.3d7 | 4F&lt;9/2&gt; | [54.92] | 0.25 | SEMIEMPIRICAL | 383 |
| Ni V | 4 | 3d6 | 5D&lt;4&gt; | [76.06] | 0.06 | SEMIEMPIRICAL | 384 |
| Ni VI | 5 | 3d5 | 6S&lt;5/2&gt; | [108.0] | 1.0 | SEMIEMPIRICAL | 385 |
| Ni VII | 6 | 3d4 | 5D0 | (132.0) | 2.0 | THEORETICAL | 386 |
| Ni VIII | 7 | 3d3 | 4F&lt;3/2&gt; | (162.0) | 2.1 | THEORETICAL | 387 |
| Ni IX | 8 | 3p6.3d2 | 3F&lt;2&gt; | [193.2] | 0.5 | SEMIEMPIRICAL | 388 |
| Ni X | 9 | 3p6.3d | 2D&lt;3/2&gt; | [224.7] | 0.5 | SEMIEMPIRICAL | 389 |
| Ni XI | 10 | 3s2.3p6 | 1S0 | [319.5] | 0.7 | SEMIEMPIRICAL | 390 |
| Ni XII | 11 | 3s2.3p5 | 2P*&lt;3/2&gt; | [351.6] | 0.3 | SEMIEMPIRICAL | 391 |
| Ni XIII | 12 | 3s2.3p4 | 3P&lt;2&gt; | [384.5] | 0.5 | SEMIEMPIRICAL | 392 |
| Ni XIV | 13 | 3s2.3p3 | 4S*&lt;3/2&gt; | [429.3] | 0.8 | SEMIEMPIRICAL | 393 |
| Ni XV | 14 | 3s2.3p2 | 3P0 | [462.8] | 1.1 | SEMIEMPIRICAL | 394 |
| Ni XVI | 15 | 3s2.3p | 2P*&lt;1/2&gt; | [495.4] | 1.7 | SEMIEMPIRICAL | 395 |
| Ni XVII | 16 | 2p6.3s2 | 1S0 | [571.07] | 0.12 | SEMIEMPIRICAL | 396 |
| Ni XVIII | 17 | 2p6.3s | 2S&lt;1/2&gt; | [607.020] | 0.019 | SEMIEMPIRICAL | 397 |
| Ni XIX | 18 | 2s2.2p6 | 1S0 | 1540.1 | 0.5 | EVALUATED-UNBRACKETED | 398 |
| Ni XX | 19 | 2s2.2p5 | 2P*&lt;3/2&gt; | [1646] | 3 | SEMIEMPIRICAL | 399 |
| Ni XXI | 20 | 2s2.2p4 | 3P&lt;2&gt; | [1758] | 4 | SEMIEMPIRICAL | 400 |
| Ni XXII | 21 | 2s2.2p3 | 4S*&lt;3/2&gt; | [1880] | 5 | SEMIEMPIRICAL | 401 |
| Ni XXIII | 22 | 2s2.2p2 | 3P0 | [2008.1] | 1.3 | SEMIEMPIRICAL | 402 |
| Ni XXIV | 23 | 2s2.2p | 2P*&lt;1/2&gt; | [2130.5] | 0.9 | SEMIEMPIRICAL | 403 |
| Ni XXV | 24 | 1s2.2s2 | 1S0 | [2295.6] | 2.1 | SEMIEMPIRICAL | 404 |
| Ni XXVI | 25 | 1s2.2s | 2S&lt;1/2&gt; | (2399.259) | 0.007 | THEORETICAL | 405 |
| Ni XXVII | 26 | 1s2 | 1S0 | (10288.8848) | 0.0010 | THEORETICAL | 406 |
| Ni XXVIII | 27 | 1s | 2S&lt;1/2&gt; | (10775.3948) | 0.0004 | THEORETICAL | 407 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0028-Nickel-Ni-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

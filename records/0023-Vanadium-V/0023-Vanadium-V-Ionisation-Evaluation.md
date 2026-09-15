# Vanadium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 23 charge-state rows and 23 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Vanadium record](0023-Vanadium-V.md)
- [Structured values and provenance](data/structured/0023-Vanadium-V-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| V I | 0 | 3d3.4s2 | 4F&lt;3/2&gt; | 6.746187 | 0.000021 | EVALUATED-UNBRACKETED | 255 |
| V II | 1 | 3d4 | 5D0 | 14.634 | 0.007 | EVALUATED-UNBRACKETED | 256 |
| V III | 2 | 3d3 | 4F&lt;3/2&gt; | 29.3111 | 0.0025 | EVALUATED-UNBRACKETED | 257 |
| V IV | 3 | 3p6.3d2 | 3F&lt;2&gt; | 46.709 | 0.005 | EVALUATED-UNBRACKETED | 258 |
| V V | 4 | 3p6.3d | 2D&lt;3/2&gt; | 65.28165 | 0.00017 | EVALUATED-UNBRACKETED | 259 |
| V VI | 5 | 3s2.3p6 | 1S0 | 128.125 | 0.025 | EVALUATED-UNBRACKETED | 260 |
| V VII | 6 | 3s2.3p5 | 2P*&lt;3/2&gt; | [150.72] | 0.13 | SEMIEMPIRICAL | 261 |
| V VIII | 7 | 3s2.3p4 | 3P&lt;2&gt; | [173.55] | 0.21 | SEMIEMPIRICAL | 262 |
| V IX | 8 | 3s2.3p3 | 4S*&lt;3/2&gt; | [206.0] | 0.4 | SEMIEMPIRICAL | 263 |
| V X | 9 | 3s2.3p2 | 3P0 | [230.5] | 0.5 | SEMIEMPIRICAL | 264 |
| V XI | 10 | 3s2.3p | 2P*&lt;1/2&gt; | [254.8] | 0.4 | SEMIEMPIRICAL | 265 |
| V XII | 11 | 2p6.3s2 | 1S0 | [308.5] | 0.3 | SEMIEMPIRICAL | 266 |
| V XIII | 12 | 2p6.3s | 2S&lt;1/2&gt; | [336.274] | 0.006 | SEMIEMPIRICAL | 267 |
| V XIV | 13 | 2s2.2p6 | 1S0 | 896.0 | 0.4 | EVALUATED-UNBRACKETED | 268 |
| V XV | 14 | 2s2.2p5 | 2P*&lt;3/2&gt; | [977.2] | 1.3 | SEMIEMPIRICAL | 269 |
| V XVI | 15 | 2s2.2p4 | 3P&lt;2&gt; | [1062.9] | 2.0 | SEMIEMPIRICAL | 270 |
| V XVII | 16 | 2s2.2p3 | 4S*&lt;3/2&gt; | [1165.2] | 1.1 | SEMIEMPIRICAL | 271 |
| V XVIII | 17 | 2s2.2p2 | 3P0 | [1258.9] | 0.6 | SEMIEMPIRICAL | 272 |
| V XIX | 18 | 2s2.2p | 2P*&lt;1/2&gt; | [1354.2] | 0.5 | SEMIEMPIRICAL | 273 |
| V XX | 19 | 1s2.2s2 | 1S0 | [1486.7] | 0.5 | SEMIEMPIRICAL | 274 |
| V XXI | 20 | 1s2.2s | 2S&lt;1/2&gt; | (1569.656) | 0.007 | THEORETICAL | 275 |
| V XXII | 21 | 1s2 | 1S0 | (6851.3112) | 0.0008 | THEORETICAL | 276 |
| V XXIII | 22 | 1s | 2S&lt;1/2&gt; | (7246.12624) | 0.00014 | THEORETICAL | 277 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

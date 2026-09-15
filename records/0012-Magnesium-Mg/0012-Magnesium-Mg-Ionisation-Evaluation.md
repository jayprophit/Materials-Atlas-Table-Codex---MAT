# Magnesium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 12 charge-state rows and 12 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Magnesium record](0012-Magnesium-Mg.md)
- [Structured values and provenance](data/structured/0012-Magnesium-Mg-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Mg I | 0 | 2p6.3s2 | 1S0 | 7.646236 | 0.000004 | EVALUATED-UNBRACKETED | 68 |
| Mg II | 1 | 2p6.3s | 2S&lt;1/2&gt; | 15.035271 | 0.000006 | EVALUATED-UNBRACKETED | 69 |
| Mg III | 2 | 2s2.2p6 | 1S0 | 80.1436 | 0.0006 | EVALUATED-UNBRACKETED | 70 |
| Mg IV | 3 | 2s2.2p5 | 2P*&lt;3/2&gt; | [109.2654] | 0.0012 | SEMIEMPIRICAL | 71 |
| Mg V | 4 | 2s2.2p4 | 3P&lt;2&gt; | [141.33] | 0.03 | SEMIEMPIRICAL | 72 |
| Mg VI | 5 | 2s2.2p3 | 4S*&lt;3/2&gt; | [186.76] | 0.06 | SEMIEMPIRICAL | 73 |
| Mg VII | 6 | 2s2.2p2 | 3P0 | [225.02] | 0.06 | SEMIEMPIRICAL | 74 |
| Mg VIII | 7 | 2s2.2p | 2P*&lt;1/2&gt; | [265.924] | 0.019 | SEMIEMPIRICAL | 75 |
| Mg IX | 8 | 1s2.2s2 | 1S0 | [327.99] | 0.04 | SEMIEMPIRICAL | 76 |
| Mg X | 9 | 1s2.2s | 2S&lt;1/2&gt; | (367.489) | 0.007 | THEORETICAL | 77 |
| Mg XI | 10 | 1s2 | 1S0 | (1761.8049) | 0.0010 | THEORETICAL | 78 |
| Mg XII | 11 | 1s | 2S&lt;1/2&gt; | (1962.663889) | 0.000007 | THEORETICAL | 79 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

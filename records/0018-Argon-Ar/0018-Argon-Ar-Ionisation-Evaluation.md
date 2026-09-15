# Argon — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 18 charge-state rows and 18 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Argon record](0018-Argon-Ar.md)
- [Structured values and provenance](data/structured/0018-Argon-Ar-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Ar I | 0 | 3s2.3p6 | 1S0 | 15.7596119 | 0.0000005 | EVALUATED-UNBRACKETED | 155 |
| Ar II | 1 | 3s2.3p5 | 2P*&lt;3/2&gt; | 27.62967 | 0.00012 | EVALUATED-UNBRACKETED | 156 |
| Ar III | 2 | 3s2.3p4 | 3P&lt;2&gt; | [40.735] | 0.012 | SEMIEMPIRICAL | 157 |
| Ar IV | 3 | 3s2.3p3 | 4S*&lt;3/2&gt; | [59.58] | 0.18 | SEMIEMPIRICAL | 158 |
| Ar V | 4 | 3s2.3p2 | 3P0 | [74.84] | 0.17 | SEMIEMPIRICAL | 159 |
| Ar VI | 5 | 3s2.3p | 2P*&lt;1/2&gt; | 91.290 | 0.010 | EVALUATED-UNBRACKETED | 160 |
| Ar VII | 6 | 2p6.3s2 | 1S0 | [124.41] | 0.06 | SEMIEMPIRICAL | 161 |
| Ar VIII | 7 | 2p6.3s | 2S&lt;1/2&gt; | [143.4567] | 0.0012 | SEMIEMPIRICAL | 162 |
| Ar IX | 8 | 2s2.2p6 | 1S0 | [422.60] | 0.06 | SEMIEMPIRICAL | 163 |
| Ar X | 9 | 2s2.2p5 | 2P*&lt;3/2&gt; | [479.76] | 0.12 | SEMIEMPIRICAL | 164 |
| Ar XI | 10 | 2s2.2p4 | 3P&lt;2&gt; | [540.4] | 0.6 | SEMIEMPIRICAL | 165 |
| Ar XII | 11 | 2s2.2p3 | 4S*&lt;3/2&gt; | [619.0] | 0.4 | SEMIEMPIRICAL | 166 |
| Ar XIII | 12 | 2s2.2p2 | 3P0 | [685.5] | 0.3 | SEMIEMPIRICAL | 167 |
| Ar XIV | 13 | 2s2.2p | 2P*&lt;1/2&gt; | [755.13] | 0.22 | SEMIEMPIRICAL | 168 |
| Ar XV | 14 | 1s2.2s2 | 1S0 | [855.5] | 0.3 | SEMIEMPIRICAL | 169 |
| Ar XVI | 15 | 1s2.2s | 2S&lt;1/2&gt; | (918.375) | 0.007 | THEORETICAL | 170 |
| Ar XVII | 16 | 1s2 | 1S0 | (4120.66559) | 0.00022 | THEORETICAL | 171 |
| Ar XVIII | 17 | 1s | 2S&lt;1/2&gt; | (4426.22407) | 0.00004 | THEORETICAL | 172 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0018-Argon-Ar-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

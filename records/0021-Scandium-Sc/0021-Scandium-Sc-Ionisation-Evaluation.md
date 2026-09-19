# Scandium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 21 charge-state rows and 21 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Scandium record](0021-Scandium-Sc.md)
- [Structured values and provenance](data/structured/0021-Scandium-Sc-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Sc I | 0 | 3d.4s2 | 2D&lt;3/2&gt; | 6.56149 | 0.00006 | EVALUATED-UNBRACKETED | 212 |
| Sc II | 1 | 3p6.3d.4s | 3D&lt;1&gt; | 12.79977 | 0.00025 | EVALUATED-UNBRACKETED | 213 |
| Sc III | 2 | 3p6.3d | 2D&lt;3/2&gt; | 24.756839 | 0.000012 | EVALUATED-UNBRACKETED | 214 |
| Sc IV | 3 | 3s2.3p6 | 1S0 | 73.4894 | 0.0004 | EVALUATED-UNBRACKETED | 215 |
| Sc V | 4 | 3s2.3p5 | 2P*&lt;3/2&gt; | [91.95] | 0.03 | SEMIEMPIRICAL | 216 |
| Sc VI | 5 | 3s2.3p4 | 3P&lt;2&gt; | [110.68] | 0.05 | SEMIEMPIRICAL | 217 |
| Sc VII | 6 | 3s2.3p3 | 4S*&lt;3/2&gt; | [137.99] | 0.25 | SEMIEMPIRICAL | 218 |
| Sc VIII | 7 | 3s2.3p2 | 3P0 | [158.08] | 0.25 | SEMIEMPIRICAL | 219 |
| Sc IX | 8 | 3s2.3p | 2P*&lt;1/2&gt; | 180.03 | 0.12 | EVALUATED-UNBRACKETED | 220 |
| Sc X | 9 | 2p6.3s2 | 1S0 | [225.18] | 0.05 | SEMIEMPIRICAL | 221 |
| Sc XI | 10 | 2p6.3s | 2S&lt;1/2&gt; | [249.798] | 0.005 | SEMIEMPIRICAL | 222 |
| Sc XII | 11 | 2s2.2p6 | 1S0 | 687.36 | 0.12 | EVALUATED-UNBRACKETED | 223 |
| Sc XIII | 12 | 2s2.2p5 | 2P*&lt;3/2&gt; | [757.7] | 1.0 | SEMIEMPIRICAL | 224 |
| Sc XIV | 13 | 2s2.2p4 | 3P&lt;2&gt; | [833.2] | 1.4 | SEMIEMPIRICAL | 225 |
| Sc XV | 14 | 2s2.2p3 | 4S*&lt;3/2&gt; | [926.5] | 0.7 | SEMIEMPIRICAL | 226 |
| Sc XVI | 15 | 2s2.2p2 | 3P0 | [1008.6] | 0.4 | SEMIEMPIRICAL | 227 |
| Sc XVII | 16 | 2s2.2p | 2P*&lt;1/2&gt; | [1093.5] | 0.4 | SEMIEMPIRICAL | 228 |
| Sc XVIII | 17 | 1s2.2s2 | 1S0 | [1213.1] | 0.4 | SEMIEMPIRICAL | 229 |
| Sc XIX | 18 | 1s2.2s | 2S&lt;1/2&gt; | (1287.957) | 0.007 | THEORETICAL | 230 |
| Sc XX | 19 | 1s2 | 1S0 | (5674.9036) | 0.0004 | THEORETICAL | 231 |
| Sc XXI | 20 | 1s | 2S&lt;1/2&gt; | (6033.75643) | 0.00009 | THEORETICAL | 232 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0021-Scandium-Sc-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

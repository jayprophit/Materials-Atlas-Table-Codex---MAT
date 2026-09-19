# Potassium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 19 charge-state rows and 19 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Potassium record](0019-Potassium-K.md)
- [Structured values and provenance](data/structured/0019-Potassium-K-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| K I | 0 | 3p6.4s | 2S&lt;1/2&gt; | 4.34066373 | 0.00000009 | EVALUATED-UNBRACKETED | 173 |
| K II | 1 | 3p6 | 1S0 | 31.62500 | 0.00019 | EVALUATED-UNBRACKETED | 174 |
| K III | 2 | 3s2.3p5 | 2P*&lt;3/2&gt; | [45.8031] | 0.0017 | SEMIEMPIRICAL | 175 |
| K IV | 3 | 3s2.3p4 | 3P&lt;2&gt; | [60.917] | 0.019 | SEMIEMPIRICAL | 176 |
| K V | 4 | 3s2.3p3 | 4S*&lt;3/2&gt; | [82.66] | 0.16 | SEMIEMPIRICAL | 177 |
| K VI | 5 | 3s2.3p2 | 3P0 | [99.44] | 0.20 | SEMIEMPIRICAL | 178 |
| K VII | 6 | 3s2.3p | 2P*&lt;1/2&gt; | 117.56 | 0.11 | EVALUATED-UNBRACKETED | 179 |
| K VIII | 7 | 3s2 | 1S0 | [154.87] | 0.05 | SEMIEMPIRICAL | 180 |
| K IX | 8 | 2p6.3s | 2S&lt;1/2&gt; | [175.8174] | 0.0025 | SEMIEMPIRICAL | 181 |
| K X | 9 | 2s2.2p6 | 1S0 | [503.67] | 0.07 | SEMIEMPIRICAL | 182 |
| K XI | 10 | 2s2.2p5 | 2P*&lt;3/2&gt; | [565.6] | 0.7 | SEMIEMPIRICAL | 183 |
| K XII | 11 | 2s2.2p4 | 3P&lt;2&gt; | [631.1] | 0.9 | SEMIEMPIRICAL | 184 |
| K XIII | 12 | 2s2.2p3 | 4S*&lt;3/2&gt; | [714.7] | 0.5 | SEMIEMPIRICAL | 185 |
| K XIV | 13 | 2s2.2p2 | 3P0 | [786.3] | 0.3 | SEMIEMPIRICAL | 186 |
| K XV | 14 | 2s2.2p | 2P*&lt;1/2&gt; | [860.92] | 0.25 | SEMIEMPIRICAL | 187 |
| K XVI | 15 | 2s2 | 1S0 | [967.7] | 0.3 | SEMIEMPIRICAL | 188 |
| K XVII | 16 | 1s2.2s | 2S&lt;1/2&gt; | (1034.542) | 0.007 | THEORETICAL | 189 |
| K XVIII | 17 | 1s2 | 1S0 | (4610.80714) | 0.00025 | THEORETICAL | 190 |
| K XIX | 18 | 1s | 2S&lt;1/2&gt; | (4934.04979) | 0.00005 | THEORETICAL | 191 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0019-Potassium-K-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

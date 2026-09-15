# Calcium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 20 charge-state rows and 20 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Calcium record](0020-Calcium-Ca.md)
- [Structured values and provenance](data/structured/0020-Calcium-Ca-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Ca I | 0 | 3p6.4s2 | 1S0 | 6.1131549210 | 0.0000000005 | EVALUATED-UNBRACKETED | 192 |
| Ca II | 1 | 3p6.4s | 2S&lt;1/2&gt; | 11.871719 | 0.000004 | EVALUATED-UNBRACKETED | 193 |
| Ca III | 2 | 3s2.3p6 | 1S0 | 50.91316 | 0.00025 | EVALUATED-UNBRACKETED | 194 |
| Ca IV | 3 | 3s2.3p5 | 2P*&lt;3/2&gt; | [67.2732] | 0.0021 | SEMIEMPIRICAL | 195 |
| Ca V | 4 | 3s2.3p4 | 3P&lt;2&gt; | [84.34] | 0.08 | SEMIEMPIRICAL | 196 |
| Ca VI | 5 | 3s2.3p3 | 4S*&lt;3/2&gt; | [108.78] | 0.25 | SEMIEMPIRICAL | 197 |
| Ca VII | 6 | 3s2.3p2 | 3P0 | [127.21] | 0.25 | SEMIEMPIRICAL | 198 |
| Ca VIII | 7 | 3s2.3p | 2P*&lt;1/2&gt; | 147.24 | 0.12 | EVALUATED-UNBRACKETED | 199 |
| Ca IX | 8 | 2p6.3s2 | 1S0 | [188.54] | 0.06 | SEMIEMPIRICAL | 200 |
| Ca X | 9 | 2p6.3s | 2S&lt;1/2&gt; | [211.275] | 0.004 | SEMIEMPIRICAL | 201 |
| Ca XI | 10 | 2s2.2p6 | 1S0 | [591.60] | 0.12 | SEMIEMPIRICAL | 202 |
| Ca XII | 11 | 2s2.2p5 | 2P*&lt;3/2&gt; | [658.2] | 0.9 | SEMIEMPIRICAL | 203 |
| Ca XIII | 12 | 2s2.2p4 | 3P&lt;2&gt; | [728.6] | 1.1 | SEMIEMPIRICAL | 204 |
| Ca XIV | 13 | 2s2.2p3 | 4S*&lt;3/2&gt; | [817.2] | 0.6 | SEMIEMPIRICAL | 205 |
| Ca XV | 14 | 2s2.2p2 | 3P0 | [894.0] | 0.4 | SEMIEMPIRICAL | 206 |
| Ca XVI | 15 | 2s2.2p | 2P*&lt;1/2&gt; | [973.7] | 0.3 | SEMIEMPIRICAL | 207 |
| Ca XVII | 16 | 1s2.2s2 | 1S0 | [1086.8] | 0.4 | SEMIEMPIRICAL | 208 |
| Ca XVIII | 17 | 1s2.2s | 2S&lt;1/2&gt; | (1157.726) | 0.007 | THEORETICAL | 209 |
| Ca XIX | 18 | 1s2 | 1S0 | (5128.8576) | 0.0003 | THEORETICAL | 210 |
| Ca XX | 19 | 1s | 2S&lt;1/2&gt; | (5469.86358) | 0.00006 | THEORETICAL | 211 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0020-Calcium-Ca-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

# Aluminium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 13 charge-state rows and 13 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Aluminium record](0013-Aluminium-Al.md)
- [Structured values and provenance](data/structured/0013-Aluminium-Al-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Al I | 0 | 3s2.3p | 2P*&lt;1/2&gt; | 5.985769 | 0.000003 | EVALUATED-UNBRACKETED | 80 |
| Al II | 1 | 2p6.3s2 | 1S0 | 18.82855 | 0.00005 | EVALUATED-UNBRACKETED | 81 |
| Al III | 2 | 2p6.3s | 2S&lt;1/2&gt; | 28.447642 | 0.000025 | EVALUATED-UNBRACKETED | 82 |
| Al IV | 3 | 2s2.2p6 | 1S0 | 119.9924 | 0.0019 | EVALUATED-UNBRACKETED | 83 |
| Al V | 4 | 2s2.2p5 | 2P*&lt;3/2&gt; | [153.8252] | 0.0025 | SEMIEMPIRICAL | 84 |
| Al VI | 5 | 2s2.2p4 | 3P&lt;2&gt; | [190.49] | 0.05 | SEMIEMPIRICAL | 85 |
| Al VII | 6 | 2s2.2p3 | 4S*&lt;3/2&gt; | [241.76] | 0.09 | SEMIEMPIRICAL | 86 |
| Al VIII | 7 | 2s2.2p2 | 3P0 | [284.64] | 0.07 | SEMIEMPIRICAL | 87 |
| Al IX | 8 | 2s2.2p | 2P*&lt;1/2&gt; | [330.21] | 0.04 | SEMIEMPIRICAL | 88 |
| Al X | 9 | 1s2.2s2 | 1S0 | [398.65] | 0.06 | SEMIEMPIRICAL | 89 |
| Al XI | 10 | 1s2.2s | 2S&lt;1/2&gt; | (442.005) | 0.007 | THEORETICAL | 90 |
| Al XII | 11 | 1s2 | 1S0 | (2085.97693) | 0.00016 | THEORETICAL | 91 |
| Al XIII | 12 | 1s | 2S&lt;1/2&gt; | (2304.140359) | 0.000012 | THEORETICAL | 92 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0013-Aluminium-Al-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

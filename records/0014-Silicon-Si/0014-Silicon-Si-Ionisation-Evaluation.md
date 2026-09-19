# Silicon — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 14 charge-state rows and 14 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Silicon record](0014-Silicon-Si.md)
- [Structured values and provenance](data/structured/0014-Silicon-Si-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Si I | 0 | 3s2.3p2 | 3P0 | 8.15168 | 0.00003 | EVALUATED-UNBRACKETED | 93 |
| Si II | 1 | 3s2.3p | 2P*&lt;1/2&gt; | 16.34585 | 0.00004 | EVALUATED-UNBRACKETED | 94 |
| Si III | 2 | 2p6.3s2 | 1S0 | 33.49300 | 0.00009 | EVALUATED-UNBRACKETED | 95 |
| Si IV | 3 | 2p6.3s | 2S&lt;1/2&gt; | 45.14179 | 0.00007 | EVALUATED-UNBRACKETED | 96 |
| Si V | 4 | 2s2.2p6 | 1S0 | 166.767 | 0.003 | EVALUATED-UNBRACKETED | 97 |
| Si VI | 5 | 2s2.2p5 | 2P*&lt;3/2&gt; | [205.279] | 0.005 | SEMIEMPIRICAL | 98 |
| Si VII | 6 | 2s2.2p4 | 3P&lt;2&gt; | [246.57] | 0.05 | SEMIEMPIRICAL | 99 |
| Si VIII | 7 | 2s2.2p3 | 4S*&lt;3/2&gt; | [303.59] | 0.05 | SEMIEMPIRICAL | 100 |
| Si IX | 8 | 2s2.2p2 | 3P0 | [351.28] | 0.06 | SEMIEMPIRICAL | 101 |
| Si X | 9 | 2s2.2p | 2P*&lt;1/2&gt; | [401.38] | 0.04 | SEMIEMPIRICAL | 102 |
| Si XI | 10 | 1s2.2s2 | 1S0 | [476.273] | 0.019 | SEMIEMPIRICAL | 103 |
| Si XII | 11 | 1s2.2s | 2S&lt;1/2&gt; | (523.415) | 0.007 | THEORETICAL | 104 |
| Si XIII | 12 | 1s2 | 1S0 | (2437.65805) | 0.00017 | THEORETICAL | 105 |
| Si XIV | 13 | 1s | 2S&lt;1/2&gt; | (2673.177958) | 0.000017 | THEORETICAL | 106 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0014-Silicon-Si-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

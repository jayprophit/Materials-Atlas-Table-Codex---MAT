# Fluorine — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 9 charge-state rows and 9 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Fluorine record](0009-Fluorine-F.md)
- [Structured values and provenance](data/structured/0009-Fluorine-F-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| F I | 0 | 2s2.2p5 | 2P*&lt;3/2&gt; | 17.42282 | 0.00005 | EVALUATED-UNBRACKETED | 38 |
| F II | 1 | 2s2.2p4 | 3P&lt;2&gt; | 34.97081 | 0.00012 | EVALUATED-UNBRACKETED | 39 |
| F III | 2 | 2s2.2p3 | 4S*&lt;3/2&gt; | [62.70798] | 0.00025 | SEMIEMPIRICAL | 40 |
| F IV | 3 | 2s2.2p2 | 3P0 | [87.175] | 0.017 | SEMIEMPIRICAL | 41 |
| F V | 4 | 2s2.2p | 2P*&lt;1/2&gt; | [114.249] | 0.006 | SEMIEMPIRICAL | 42 |
| F VI | 5 | 1s2.2s2 | 1S0 | 157.16311 | 0.00025 | EVALUATED-UNBRACKETED | 43 |
| F VII | 6 | 1s2.2s | 2S&lt;1/2&gt; | 185.1868 | 0.0006 | EVALUATED-UNBRACKETED | 44 |
| F VIII | 7 | 1s2 | 1S0 | (953.8983) | 0.0003 | THEORETICAL | 45 |
| F IX | 8 | 1s | 2S&lt;1/2&gt; | (1103.1175302) | 0.0000019 | THEORETICAL | 46 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0009-Fluorine-F-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

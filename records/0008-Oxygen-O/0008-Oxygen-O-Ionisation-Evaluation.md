# Oxygen — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 8 charge-state rows and 8 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Oxygen record](0008-Oxygen-O.md)
- [Structured values and provenance](data/structured/0008-Oxygen-O-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| O I | 0 | 2s2.2p4 | 3P&lt;2&gt; | 13.618055 | 0.000007 | EVALUATED-UNBRACKETED | 30 |
| O II | 1 | 2s2.2p3 | 4S*&lt;3/2&gt; | 35.12112 | 0.00006 | EVALUATED-UNBRACKETED | 31 |
| O III | 2 | 2s2.2p2 | 3P0 | [54.93554] | 0.00012 | SEMIEMPIRICAL | 32 |
| O IV | 3 | 2s2.2p | 2P*&lt;1/2&gt; | 77.41350 | 0.00025 | EVALUATED-UNBRACKETED | 33 |
| O V | 4 | 1s2.2s2 | 1S0 | 113.8990 | 0.0005 | EVALUATED-UNBRACKETED | 34 |
| O VI | 5 | 1s2.2s | 2S&lt;1/2&gt; | [138.1189] | 0.0021 | SEMIEMPIRICAL | 35 |
| O VII | 6 | 1s2 | 1S0 | (739.32697) | 0.00015 | THEORETICAL | 36 |
| O VIII | 7 | 1s | 2S&lt;1/2&gt; | (871.4099138) | 0.0000012 | THEORETICAL | 37 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0008-Oxygen-O-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

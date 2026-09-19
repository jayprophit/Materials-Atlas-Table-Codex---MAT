# Nitrogen — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 7 charge-state rows and 7 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Nitrogen record](0007-Nitrogen-N.md)
- [Structured values and provenance](data/structured/0007-Nitrogen-N-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| N I | 0 | 2s2.2p3 | 4S*&lt;3/2&gt; | 14.53413 | 0.00004 | EVALUATED-UNBRACKETED | 23 |
| N II | 1 | 2s2.2p2 | 3P0 | [29.60125] | 0.00009 | SEMIEMPIRICAL | 24 |
| N III | 2 | 2s2.2p | 2P*&lt;1/2&gt; | [47.4453] | 0.0025 | SEMIEMPIRICAL | 25 |
| N IV | 3 | 1s2.2s2 | 1S0 | 77.4735 | 0.0004 | EVALUATED-UNBRACKETED | 26 |
| N V | 4 | 1s2.2s | 2S&lt;1/2&gt; | 97.8901 | 0.0004 | EVALUATED-UNBRACKETED | 27 |
| N VI | 5 | 1s2 | 1S0 | (552.06741) | 0.00008 | THEORETICAL | 28 |
| N VII | 6 | 1s | 2S&lt;1/2&gt; | (667.0461377) | 0.0000007 | THEORETICAL | 29 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.


## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/0007-Nitrogen-N-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

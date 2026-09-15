# Carbon — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 6 charge-state rows and 6 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Carbon record](0006-Carbon-C.md)
- [Structured values and provenance](data/structured/0006-Carbon-C-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| C I | 0 | 2s2.2p2 | 3P0 | 11.2602880 | 0.0000011 | EVALUATED-UNBRACKETED | 17 |
| C II | 1 | 2s2.2p | 2P*&lt;1/2&gt; | 24.383143 | 0.000012 | EVALUATED-UNBRACKETED | 18 |
| C III | 2 | 1s2.2s2 | 1S0 | 47.88778 | 0.00025 | EVALUATED-UNBRACKETED | 19 |
| C IV | 3 | 1s2.2s | 2S&lt;1/2&gt; | 64.49352 | 0.00019 | EVALUATED-UNBRACKETED | 20 |
| C V | 4 | 1s2 | 1S0 | (392.09056) | 0.00004 | THEORETICAL | 21 |
| C VI | 5 | 1s | 2S&lt;1/2&gt; | (489.99320779) | 0.00000022 | THEORETICAL | 22 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

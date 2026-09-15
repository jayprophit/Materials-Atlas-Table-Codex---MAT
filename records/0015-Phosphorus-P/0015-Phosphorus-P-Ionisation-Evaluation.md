# Phosphorus — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 15 charge-state rows and 15 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Phosphorus record](0015-Phosphorus-P.md)
- [Structured values and provenance](data/structured/0015-Phosphorus-P-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| P I | 0 | 3s2.3p3 | 4S*&lt;3/2&gt; | 10.486686 | 0.000015 | EVALUATED-UNBRACKETED | 107 |
| P II | 1 | 3s2.3p2 | 3P0 | [19.76949] | 0.00004 | SEMIEMPIRICAL | 108 |
| P III | 2 | 3s2.3p | 2P*&lt;1/2&gt; | 30.20264 | 0.00009 | EVALUATED-UNBRACKETED | 109 |
| P IV | 3 | 2p6.3s2 | 1S0 | 51.44387 | 0.00012 | EVALUATED-UNBRACKETED | 110 |
| P V | 4 | 2p6.3s | 2S&lt;1/2&gt; | 65.02511 | 0.00012 | EVALUATED-UNBRACKETED | 111 |
| P VI | 5 | 2s2.2p6 | 1S0 | [220.430] | 0.005 | SEMIEMPIRICAL | 112 |
| P VII | 6 | 2s2.2p5 | 2P*&lt;3/2&gt; | [263.57] | 0.06 | SEMIEMPIRICAL | 113 |
| P VIII | 7 | 2s2.2p4 | 3P&lt;2&gt; | [309.60] | 0.10 | SEMIEMPIRICAL | 114 |
| P IX | 8 | 2s2.2p3 | 4S*&lt;3/2&gt; | [372.31] | 0.21 | SEMIEMPIRICAL | 115 |
| P X | 9 | 2s2.2p2 | 3P0 | [424.40] | 0.09 | SEMIEMPIRICAL | 116 |
| P XI | 10 | 2s2.2p | 2P*&lt;1/2&gt; | [479.44] | 0.05 | SEMIEMPIRICAL | 117 |
| P XII | 11 | 1s2.2s2 | 1S0 | [560.62] | 0.10 | SEMIEMPIRICAL | 118 |
| P XIII | 12 | 1s2.2s | 2S&lt;1/2&gt; | (611.741) | 0.007 | THEORETICAL | 119 |
| P XIV | 13 | 1s2 | 1S0 | (2816.90868) | 0.00019 | THEORETICAL | 120 |
| P XV | 14 | 1s | 2S&lt;1/2&gt; | (3069.842145) | 0.000014 | THEORETICAL | 121 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

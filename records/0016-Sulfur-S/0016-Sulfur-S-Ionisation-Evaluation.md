# Sulfur — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 16 charge-state rows and 16 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Sulfur record](0016-Sulfur-S.md)
- [Structured values and provenance](data/structured/0016-Sulfur-S-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| S I | 0 | 3s2.3p4 | 3P&lt;2&gt; | 10.3600167 | 0.0000014 | EVALUATED-UNBRACKETED | 122 |
| S II | 1 | 3s2.3p3 | 4S*&lt;3/2&gt; | 23.33788 | 0.00025 | EVALUATED-UNBRACKETED | 123 |
| S III | 2 | 3s2.3p2 | 3P0 | [34.86] | 0.04 | SEMIEMPIRICAL | 124 |
| S IV | 3 | 3s2.3p | 2P*&lt;1/2&gt; | [47.222] | 0.012 | SEMIEMPIRICAL | 125 |
| S V | 4 | 2p6.3s2 | 1S0 | 72.5945 | 0.0004 | EVALUATED-UNBRACKETED | 126 |
| S VI | 5 | 2p6.3s | 2S&lt;1/2&gt; | 88.0529 | 0.0004 | EVALUATED-UNBRACKETED | 127 |
| S VII | 6 | 2s2.2p6 | 1S0 | 280.954 | 0.007 | EVALUATED-UNBRACKETED | 128 |
| S VIII | 7 | 2s2.2p5 | 2P*&lt;3/2&gt; | 328.794 | 0.007 | EVALUATED-UNBRACKETED | 129 |
| S IX | 8 | 2s2.2p4 | 3P&lt;2&gt; | [379.84] | 0.21 | SEMIEMPIRICAL | 130 |
| S X | 9 | 2s2.2p3 | 4S*&lt;3/2&gt; | [447.7] | 0.3 | SEMIEMPIRICAL | 131 |
| S XI | 10 | 2s2.2p2 | 3P0 | [504.55] | 0.12 | SEMIEMPIRICAL | 132 |
| S XII | 11 | 2s2.2p | 2P*&lt;1/2&gt; | [564.41] | 0.05 | SEMIEMPIRICAL | 133 |
| S XIII | 12 | 1s2.2s2 | 1S0 | [651.96] | 0.12 | SEMIEMPIRICAL | 134 |
| S XIV | 13 | 1s2.2s | 2S&lt;1/2&gt; | (706.994) | 0.007 | THEORETICAL | 135 |
| S XV | 14 | 1s2 | 1S0 | (3223.78057) | 0.00020 | THEORETICAL | 136 |
| S XVI | 15 | 1s | 2S&lt;1/2&gt; | (3494.188518) | 0.000019 | THEORETICAL | 137 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

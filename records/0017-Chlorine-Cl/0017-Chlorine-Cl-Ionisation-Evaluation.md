# Chlorine — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 17 charge-state rows and 17 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Chlorine record](0017-Chlorine-Cl.md)
- [Structured values and provenance](data/structured/0017-Chlorine-Cl-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Cl I | 0 | 3s2.3p5 | 2P*&lt;3/2&gt; | 12.967633 | 0.000016 | EVALUATED-UNBRACKETED | 138 |
| Cl II | 1 | 3s2.3p4 | 3P&lt;2&gt; | 23.81364 | 0.00012 | EVALUATED-UNBRACKETED | 139 |
| Cl III | 2 | 3s2.3p3 | 4S*&lt;3/2&gt; | [39.80] | 0.11 | SEMIEMPIRICAL | 140 |
| Cl IV | 3 | 3s2.3p2 | 3P0 | [53.24] | 0.12 | SEMIEMPIRICAL | 141 |
| Cl V | 4 | 3s2.3p | 2P*&lt;1/2&gt; | [67.68] | 0.10 | SEMIEMPIRICAL | 142 |
| Cl VI | 5 | 2p6.3s2 | 1S0 | [96.94] | 0.04 | SEMIEMPIRICAL | 143 |
| Cl VII | 6 | 2p6.3s | 2S&lt;1/2&gt; | 114.2013 | 0.0006 | EVALUATED-UNBRACKETED | 144 |
| Cl VIII | 7 | 2s2.2p6 | 1S0 | 348.306 | 0.007 | EVALUATED-UNBRACKETED | 145 |
| Cl IX | 8 | 2s2.2p5 | 2P*&lt;3/2&gt; | 400.851 | 0.012 | EVALUATED-UNBRACKETED | 146 |
| Cl X | 9 | 2s2.2p4 | 3P&lt;2&gt; | [456.7] | 0.4 | SEMIEMPIRICAL | 147 |
| Cl XI | 10 | 2s2.2p3 | 4S*&lt;3/2&gt; | [530.0] | 0.4 | SEMIEMPIRICAL | 148 |
| Cl XII | 11 | 2s2.2p2 | 3P0 | [591.58] | 0.19 | SEMIEMPIRICAL | 149 |
| Cl XIII | 12 | 2s2.2p | 2P*&lt;1/2&gt; | [656.30] | 0.12 | SEMIEMPIRICAL | 150 |
| Cl XIV | 13 | 1s2.2s2 | 1S0 | [750.23] | 0.19 | SEMIEMPIRICAL | 151 |
| Cl XV | 14 | 1s2.2s | 2S&lt;1/2&gt; | (809.198) | 0.007 | THEORETICAL | 152 |
| Cl XVI | 15 | 1s2 | 1S0 | (3658.34366) | 0.00022 | THEORETICAL | 153 |
| Cl XVII | 16 | 1s | 2S&lt;1/2&gt; | (3946.29179) | 0.00007 | THEORETICAL | 154 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

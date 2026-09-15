# Sodium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 11 charge-state rows and 11 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Sodium record](0011-Sodium-Na.md)
- [Structured values and provenance](data/structured/0011-Sodium-Na-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Na I | 0 | 2p6.3s | 2S&lt;1/2&gt; | 5.13907696 | 0.00000025 | EVALUATED-UNBRACKETED | 57 |
| Na II | 1 | 2s2.2p6 | 1S0 | 47.28636 | 0.00025 | EVALUATED-UNBRACKETED | 58 |
| Na III | 2 | 2s2.2p5 | 2P*&lt;3/2&gt; | [71.6200] | 0.0012 | SEMIEMPIRICAL | 59 |
| Na IV | 3 | 2s2.2p4 | 3P&lt;2&gt; | [98.936] | 0.012 | SEMIEMPIRICAL | 60 |
| Na V | 4 | 2s2.2p3 | 4S*&lt;3/2&gt; | 138.404 | 0.012 | EVALUATED-UNBRACKETED | 61 |
| Na VI | 5 | 2s2.2p2 | 3P0 | [172.23] | 0.05 | SEMIEMPIRICAL | 62 |
| Na VII | 6 | 2s2.2p | 2P*&lt;1/2&gt; | [208.504] | 0.012 | SEMIEMPIRICAL | 63 |
| Na VIII | 7 | 1s2.2s2 | 1S0 | [264.192] | 0.022 | SEMIEMPIRICAL | 64 |
| Na IX | 8 | 1s2.2s | 2S&lt;1/2&gt; | (299.856) | 0.007 | THEORETICAL | 65 |
| Na X | 9 | 1s2 | 1S0 | (1465.0992) | 0.0007 | THEORETICAL | 66 |
| Na XI | 10 | 1s | 2S&lt;1/2&gt; | (1648.702285) | 0.000005 | THEORETICAL | 67 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

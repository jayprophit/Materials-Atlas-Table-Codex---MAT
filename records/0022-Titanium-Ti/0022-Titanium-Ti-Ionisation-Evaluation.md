# Titanium — Ground States and Ionisation Ladder

<!-- generated-by: sync-ionisation-evaluation.mjs -->

Dated NIST ASD 5.12 extraction, retrieved 14 September 2026. 22 charge-state rows and 22 numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.

- [Parent Titanium record](0022-Titanium-Ti.md)
- [Structured values and provenance](data/structured/0022-Titanium-Ti-NIST-Ionisation-Evaluation.yaml)
- [Retained source export](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) · SRC-000005
- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)

## State and evidence semantics

Each threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.

## Source table

| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |
|---|---:|---|---|---|---|---|---:|
| Ti I | 0 | 3d2.4s2 | 3F&lt;2&gt; | 6.828120 | 0.000012 | EVALUATED-UNBRACKETED | 233 |
| Ti II | 1 | 3d2.(3F).4s | 4F&lt;3/2&gt; | 13.5755 | 0.0025 | EVALUATED-UNBRACKETED | 234 |
| Ti III | 2 | 3p6.3d2 | 3F&lt;2&gt; | 27.49171 | 0.00025 | EVALUATED-UNBRACKETED | 235 |
| Ti IV | 3 | 3p6.3d | 2D&lt;3/2&gt; | 43.26717 | 0.00019 | EVALUATED-UNBRACKETED | 236 |
| Ti V | 4 | 3s2.3p6 | 1S0 | 99.299 | 0.012 | EVALUATED-UNBRACKETED | 237 |
| Ti VI | 5 | 3s2.3p5 | 2P*&lt;3/2&gt; | [119.533] | 0.025 | SEMIEMPIRICAL | 238 |
| Ti VII | 6 | 3s2.3p4 | 3P&lt;2&gt; | [140.68] | 0.18 | SEMIEMPIRICAL | 239 |
| Ti VIII | 7 | 3s2.3p3 | 4S*&lt;3/2&gt; | [170.5] | 0.4 | SEMIEMPIRICAL | 240 |
| Ti IX | 8 | 3s2.3p2 | 3P0 | [192.1] | 0.4 | SEMIEMPIRICAL | 241 |
| Ti X | 9 | 3s2.3p | 2P*&lt;1/2&gt; | 215.92 | 0.12 | EVALUATED-UNBRACKETED | 242 |
| Ti XI | 10 | 2p6.3s2 | 1S0 | [265.07] | 0.06 | SEMIEMPIRICAL | 243 |
| Ti XII | 11 | 2p6.3s | 2S&lt;1/2&gt; | [291.500] | 0.005 | SEMIEMPIRICAL | 244 |
| Ti XIII | 12 | 2s2.2p6 | 1S0 | 787.67 | 0.04 | EVALUATED-UNBRACKETED | 245 |
| Ti XIV | 13 | 2s2.2p5 | 2P*&lt;3/2&gt; | [864.0] | 1.2 | SEMIEMPIRICAL | 246 |
| Ti XV | 14 | 2s2.2p4 | 3P&lt;2&gt; | [944.5] | 1.6 | SEMIEMPIRICAL | 247 |
| Ti XVI | 15 | 2s2.2p3 | 4S*&lt;3/2&gt; | [1042.5] | 0.8 | SEMIEMPIRICAL | 248 |
| Ti XVII | 16 | 2s2.2p2 | 3P0 | [1130.2] | 0.5 | SEMIEMPIRICAL | 249 |
| Ti XVIII | 17 | 2s2.2p | 2P*&lt;1/2&gt; | [1220.3] | 0.5 | SEMIEMPIRICAL | 250 |
| Ti XIX | 18 | 1s2.2s2 | 1S0 | [1346.3] | 0.5 | SEMIEMPIRICAL | 251 |
| Ti XX | 19 | 1s2.2s | 2S&lt;1/2&gt; | (1425.257) | 0.007 | THEORETICAL | 252 |
| Ti XXI | 20 | 1s2 | 1S0 | (6249.0226) | 0.0007 | THEORETICAL | 253 |
| Ti XXII | 21 | 1s | 2S&lt;1/2&gt; | (6625.81023) | 0.00010 | THEORETICAL | 254 |

## Remaining gaps

Missing charge-state rows: none in the requested 0 to Z−1 range. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.

## Calculated energy equivalents

The structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.

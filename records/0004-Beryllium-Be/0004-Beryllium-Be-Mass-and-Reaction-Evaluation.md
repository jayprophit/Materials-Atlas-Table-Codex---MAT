# Beryllium — Atomic Masses and Reaction Energies

<!-- generated-by: sync-ame2020.mjs -->

**Dated evaluated data · scientific coverage remains partial.** 12 ground-state nuclides from AME2020. Values and uncertainties are transcribed from the retained unrounded analysis files; estimated quantities remain labelled.

- [Parent Beryllium record](0004-Beryllium-Be.md) · [NUBASE states and decays](0004-Beryllium-Be-Nuclear-Evaluation.md)
- [Structured data](data/isotopes/0004-Beryllium-Be-AME2020-Evaluation.yaml)
- [Original mass table](../../data/catalog/sources/ame2020-mass_1.mas20.txt) · [Original reaction table](../../data/catalog/sources/ame2020-rct1.mas20.txt)
- [AME2020 methods](https://doi.org/10.1088/1674-1137/abddb0) (SRC-000303) · [Tables and definitions](https://doi.org/10.1088/1674-1137/abddaf) (SRC-000304)

## Reading the data

All table energies and uncertainties are in keV; binding energy is per nucleon. A # replaces a decimal point in the original estimated value. UNKNOWN (*) retains the source's not-calculable entry; it is neither zero nor automatically NOT APPLICABLE. Source lines are one-based in the retained files. Uncertainties remain those published by the evaluation, with no replacement by independent-mass quadrature.

Atomic-mass conventions apply. Qα is total decay energy, not alpha-particle kinetic energy. Positive Q alone does not establish a decay branch, rate or observation. He-4's source Qα of zero is a bookkeeping identity. These tables describe ground-state combinations, not isomer or excited-daughter transitions. Nuclear state and daughter lookups are explicit in the structured companion. The binding quantity follows [Z M(¹H) + N mₙ − M(A,Z)]c²/A; it has not been converted to a bare-nucleus convention.

## Mass and binding table

| Nuclide | N | Atomic mass excess / keV | AME binding per nucleon / keV | Mass-file line |
|---|---:|---|---|---:|
| Be-5 | 1 | 37139# ± 2003# | 18# ± 401# | 49 |
| Be-6 | 2 | 18375.034 ± 5.448 | 4487.2478 ± 0.9080 | 53 |
| Be-7 | 3 | 15768.998 ± 0.071 | 5371.5487 ± 0.0101 | 58 |
| Be-8 | 4 | 4941.672 ± 0.035 | 7062.4356 ± 0.0044 | 62 |
| Be-9 | 5 | 11348.451 ± 0.076 | 6462.6693 ± 0.0085 | 67 |
| Be-10 | 6 | 12607.487 ± 0.081 | 6497.6306 ± 0.0081 | 72 |
| Be-11 | 7 | 20177.169 ± 0.238 | 5952.5402 ± 0.0216 | 77 |
| Be-12 | 8 | 25077.761 ± 1.909 | 5720.7223 ± 0.1590 | 83 |
| Be-13 | 9 | 33659.080 ± 10.180 | 5241.4359 ± 0.7831 | 89 |
| Be-14 | 10 | 39954.502 ± 132.245 | 4993.8973 ± 9.4461 | 95 |
| Be-15 | 11 | 49825.821 ± 165.797 | 4540.9708 ± 11.0532 | 101 |
| Be-16 | 12 | 57447.139 ± 165.797 | 4285.2851 ± 10.3623 | 108 |

## Q-values and separation energies

| Nuclide | Qβ− / keV | Qα / keV | S₂n / keV | S₂p / keV | Reaction-file line |
|---|---|---|---|---|---:|
| Be-5 | UNKNOWN (*) | UNKNOWN (*) | UNKNOWN (*) | -7630# ± 2003# | 48 |
| Be-6 | -28945# ± 2003# | UNKNOWN (*) | UNKNOWN (*) | -1372.1758 ± 5.4478 | 52 |
| Be-7 | -11907.5551 ± 25.1504 | -1587.1371 ± 0.0708 | 37512# ± 2003# | 10040.1785 ± 20.0001 | 57 |
| Be-8 | -17979.8973 ± 1.0005 | 91.8399 ± 0.0354 | 29575.9983 ± 5.4479 | 27228.3656 ± 0.0639 | 61 |
| Be-9 | -1068.0349 ± 0.8994 | -2307.6989 ± 20.0001 | 20563.1828 ± 0.1040 | 29302.6187 ± 7.5599 | 66 |
| Be-10 | 556.8759 ± 0.0822 | -7409.5245 ± 0.0966 | 8476.8212 ± 0.0883 | 33580.1385 ± 0.1199 | 71 |
| Be-11 | 11509.4607 ± 0.2380 | -8320.8746 ± 7.5632 | 7313.9182 ± 0.2497 | 35336.5997 ± 46.8171 | 76 |
| Be-12 | 11708.3636 ± 2.3214 | -8956.8373 ± 1.9106 | 3672.3612 ± 1.9096 | 38697.3273 ± 92.8673 | 82 |
| Be-13 | 17097.1315 ± 10.2295 | -9701.6627 ± 47.9106 | 2660.7254 ± 10.1833 | UNKNOWN (*) | 88 |
| Be-14 | 16290.8166 ± 133.9357 | -11667.5601 ± 161.5842 | 1265.8951 ± 132.2589 | UNKNOWN (*) | 94 |
| Be-15 | 20868.4411 ± 167.1256 | UNKNOWN (*) | -24.1049 ± 166.1096 | UNKNOWN (*) | 100 |
| Be-16 | 20335.4399 ± 167.6075 | UNKNOWN (*) | -1350.0001 ± 100.0000 | UNKNOWN (*) | 107 |

Qβ− comes from the mass-file line in the first table. The other three columns come from the reaction-file line. Definitions and original source strings are retained in the structured data.

## Binding-energy chart

![Beryllium: AME2020 binding energy per nucleon versus mass number, with evaluated and estimated points distinguished.](graphs/0004-Beryllium-Be-GRAPH-AME2020-Binding-Energy.svg)

Discrete source values and source-reported uncertainties. No interpolation, natural-abundance weighting or observed-decay claim is implied. This quantitative chart supplements the 22 separate illustrative panels.

## Remaining review

Later measurements, state-specific decay branches, isomer Q-values, additional reaction channels and full claim-level review remain open. Existing authored values retain their own provenance; this companion does not overwrite them.

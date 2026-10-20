# Helium — thermal functions and phase-specific heat capacity

<!-- generated-by: sync-thermochemistry.mjs -->

1 published Shomate fits are available in this dated NIST Chemistry WebBook extraction. The helium basis is one mole of neutral He atoms. The listed monatomic gas species is not a dimer, an isotope-specific equation of state or all species in an equilibrium vapour.

Canonical subject: **MAT:0002:ATOM:He** (ATOM), defined by the [unchanged curated owner](data/structured/0002-Helium-He.yaml) at `/atomic_states/0`. Molecular spin-isomer scope is **NOT-APPLICABLE-TO-MONATOMIC-SPECIES**. Isotopic composition is **UNSPECIFIED-IN-RETAINED-FIT**. No particular isotope, dimer population, cryogenic equilibrium or superfluid transition is inferred.
 The element's wider thermal domain remains PARTIAL.

[Parent record](0002-Helium-He.md) · [Structured coefficients](data/structured/0002-Helium-He-NIST-Thermochemistry.yaml) · [Calculated table](tables/0002-Helium-He-TABLE-010-Thermodynamic-Functions.md) · [CSV](tables/0002-Helium-He-TABLE-010-Thermodynamic-Functions.csv)

Source: **SRC-000509**, [NIST Chemistry WebBook](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440597&Units=SI&Mask=1), retrieved 2026-10-05. [Retained coefficient source](../../data/catalog/sources/nist-thermochemistry-0002-2026-10-05.html.txt) and [publisher's rounded comparison table](../../data/catalog/sources/nist-thermochemistry-0002-2026-10-05-table.html.txt) preserve the exact downloaded bytes and their SHA-256 hashes. The original evaluation is Chase (1998), with each earlier review date retained below.

## Applicable states and intervals

| Fit | Source phase variant | Valid T / K | Source comment |
|---|---|---:|---|
| GAS:1 | UNSPECIFIED-IN-FIT-TABLE | 298–6000 | Data last reviewed in March, 1982 |

A fit interval describes where the publisher supplies coefficients. Its endpoints are not automatically melting points, boiling points or equilibrium phase boundaries. Alternative solid phases may have overlapping ranges. The source's unspecified crystal structure is UNKNOWN. Each gas fit concerns its listed species; dissociation and ionisation equilibria are not calculated. Standard thermochemical functions do not supply arbitrary-pressure behaviour.

## Equations and reference states

With t = T/1000 and T in kelvin, use the exact source A–H coefficients in their published mixed-unit convention:

- Cp° = A + B·t + C·t² + D·t³ + E/t², in J mol⁻¹ K⁻¹.
- H°(T)−H°(298.15 K) = A·t + B·t²/2 + C·t³/3 + D·t⁴/4 − E/t + F − H, in kJ mol⁻¹.
- S° = A·ln(t) + B·t + C·t²/2 + D·t³/3 − E/(2·t²) + G, in J mol⁻¹ K⁻¹.

The last H is a coefficient, not the temperature-dependent enthalpy. Phase-specific reference offsets matter: do not splice enthalpy increments from different phases or interpret coefficient H as latent heat. The 298.15 K reference does not permit extrapolating a high-temperature fit down to 298.15 K. Outside-range evaluation is rejected. Unpublished coefficient uncertainty and covariance remain UNKNOWN; no error bars or extra physical precision are invented.

## Fit-specific scientific review

**SOURCE-SCOPE-LIMITATION: MAT:0002:THERMO:REVIEW:01.** Neutral monatomic He only, not He2, an excimer, He ions, atomic nuclei or an equilibrium mixture. No molecular factor of two applies. Source formula He and molecular weight do not establish numeric He-3/He-4 abundances or isotope-specific thermal properties. Existing He-3/He-4 branches and statistics retain separate scope. Do not import Hydrogen ortho/para assumptions into monatomic Helium or assign a spin mixture. Isotope nuclear-spin distinctions do not turn this elemental gas fit into isotope-specific models. Source: SRC-000509. Evidence: SOURCE-TRANSCRIBED; INDEPENDENT-SCIENTIFIC-REVIEW-PENDING.

**SOURCE-SCOPE-LIMITATION: MAT:0002:THERMO:REVIEW:02.** Only GAS298–6000K fit is supplied. No extrapolation to cryogenic helium, isotope-specific phase behaviour, liquid/solid states, lambda points, superfluidity or superconductivity is justified. The fit equations supply standard thermochemical functions without a pressure variable. No arbitrary-pressure EOS, applied sample pressure or pressure-temperature phase diagram is inferred. Any separate reference-pressure label belongs to its own datum. Coefficient uncertainty and covariance are unreported. Publisher rounding and numerical derivative residuals are source-format/software checks, not physical uncertainty. Transcription arithmetic and positive within-fit samples do not establish independent calorimetry, replication, complete Helium thermophysics or scientific completion. Source: SRC-000509. Evidence: SOURCE-TRANSCRIBED; INDEPENDENT-SCIENTIFIC-REVIEW-PENDING.

## Heat-capacity chart

![Helium: molar heat capacity calculated separately for each published phase and valid fit range](graphs/0002-Helium-He-GRAPH-010-Heat-Capacity.svg)

Each panel uses its own temperature scale. Lines sample the published equation; they are not observations or phase-stability predictions. Unknown uncertainties are not zero. These calculated charts supplement the chapter and do not replace any of the 22 requested illustrations.

## Validation and outstanding thermal data

The calculation is checked against the publisher's separately tabulated rounded values and the thermodynamic identities dH/dT = Cp and dS/dT = Cp/T. These checks verify transcription and arithmetic, not independent experimental validity. The source tables retain older evaluations; later measurements and application-specific state conditions need separate review. Thermal conductivity, diffusivity, expansion, pressure dependence, transition enthalpies and a phase diagram remain INSUFFICIENT DATA in this supplement. Existing phase-reference values are preserved for later source reconciliation.

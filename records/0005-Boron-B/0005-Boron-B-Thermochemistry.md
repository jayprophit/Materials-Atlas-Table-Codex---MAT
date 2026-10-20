# Boron — thermal functions and phase-specific heat capacity

<!-- generated-by: sync-thermochemistry.mjs -->

1 published Shomate fits are available in this dated NIST Chemistry WebBook extraction. The boron basis is one mole of neutral B atoms. The listed monatomic gas species is not a dimer, an isotope-specific equation of state or all species in an equilibrium vapour.

Canonical subject: **MAT:0005:ATOM:B** (ATOM), defined by the [unchanged curated owner](data/structured/0005-Boron-B.yaml) at `/atomic_states/0`. Molecular spin-isomer scope is **NOT-APPLICABLE-TO-MONATOMIC-SPECIES**. Isotopic composition is **UNSPECIFIED-IN-RETAINED-FIT**. No particular isotope, dimer population, cryogenic equilibrium or superfluid transition is inferred.
 The element's wider thermal domain remains PARTIAL.

[Parent record](0005-Boron-B.md) · [Structured coefficients](data/structured/0005-Boron-B-NIST-Thermochemistry.yaml) · [Calculated table](tables/0005-Boron-B-TABLE-010-Thermodynamic-Functions.md) · [CSV](tables/0005-Boron-B-TABLE-010-Thermodynamic-Functions.csv)

Source: **SRC-000512**, [NIST Chemistry WebBook](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440428&Units=SI&Mask=1), retrieved 2026-10-06. [Retained coefficient source](../../data/catalog/sources/nist-thermochemistry-0005-2026-10-06.html.txt) and [publisher's rounded comparison table](../../data/catalog/sources/nist-thermochemistry-0005-2026-10-06-table.html.txt) preserve the exact downloaded bytes and their SHA-256 hashes. The original evaluation is Chase (1998), with each earlier review date retained below.

## Applicable states and intervals

| Fit | Source phase variant | Valid T / K | Source comment |
|---|---|---:|---|
| GAS:1 | UNSPECIFIED-IN-FIT-TABLE | 4137.895–6000 | Data last reviewed in June, 1983 |

A fit interval describes where the publisher supplies coefficients. Its endpoints are not automatically melting points, boiling points or equilibrium phase boundaries. Alternative solid phases may have overlapping ranges. The source's unspecified crystal structure is UNKNOWN. Each gas fit concerns its listed species; dissociation and ionisation equilibria are not calculated. Standard thermochemical functions do not supply arbitrary-pressure behaviour.

## Equations and reference states

With t = T/1000 and T in kelvin, use the exact source A–H coefficients in their published mixed-unit convention:

- Cp° = A + B·t + C·t² + D·t³ + E/t², in J mol⁻¹ K⁻¹.
- H°(T)−H°(298.15 K) = A·t + B·t²/2 + C·t³/3 + D·t⁴/4 − E/t + F − H, in kJ mol⁻¹.
- S° = A·ln(t) + B·t + C·t²/2 + D·t³/3 − E/(2·t²) + G, in J mol⁻¹ K⁻¹.

The last H is a coefficient, not the temperature-dependent enthalpy. Phase-specific reference offsets matter: do not splice enthalpy increments from different phases or interpret coefficient H as latent heat. The 298.15 K reference does not permit extrapolating a high-temperature fit down to 298.15 K. Outside-range evaluation is rejected. Unpublished coefficient uncertainty and covariance remain UNKNOWN; no error bars or extra physical precision are invented.

## Fit-specific scientific review

**SOURCE-SCOPE-LIMITATION: MAT:0005:THERMO:REVIEW:01.** The exact publisher species is B with InChI=1S/B, not B2, B ions or an equilibrium vapor mixture. One mole of the source species is one mole of B atoms. No molecular factor of two applies. Existing B-10/B-11 isotope records and atomic-weight data retain separate scope. No isotope-specific gas properties or numeric isotope abundances are inferred from this elemental fit or its listed molecular weight. No B/B2 equilibrium fraction, dimer dissociation, ionisation fraction, charge-state mixture or molecular nuclear-spin population is calculated or assigned. Source: SRC-000512. Evidence: SOURCE-TRANSCRIBED; INDEPENDENT-SCIENTIFIC-REVIEW-PENDING.

**SOURCE-SCOPE-LIMITATION: MAT:0005:THERMO:REVIEW:02.** The gas-only response supplies one fit for 4137.895–6000 K. A separate retained condensed-phase diagnostic contains one LIQUID fit and two SOLID fits. Those fits are not imported, relabelled, or bound to the neutral atomic GAS state. No gas evaluation below the source minimum 4137.895 K is justified. The retained source limits do not themselves establish a boiling point, a gas stability boundary or a pressure-dependent phase boundary. The Shomate equations contain no pressure variable. Applied pressure, arbitrary-pressure EOS and phase diagrams are not inferred. Separate source entropy reference-pressure labels belong to those original data only. Fit boundaries from separate phases and enthalpy reference offsets are retained as reported and are not a constructed phase-transition path or latent-heat calculation. Coefficient uncertainty and covariance are unreported. Printed-temperature cells, output rounding and numerical derivative residuals are source-format/software checks, not physical uncertainty. Independent transcription arithmetic against publisher values and positive samples within the fit do not establish experimental replication, new calorimetry, complete Boron thermophysics or element completion. H(T)-H(298.15 K) retains a published reference offset; it does not authorize evaluating this high-temperature gas fit at 298.15 K or inferring a solid-to-gas transition. Existing solid allotropes, γ-B28 B2 pairs, B12 motifs, nuclear and compound contexts retain separate owners. SRC-000064 is the same underlying WebBook work: this dated retrieval is not independent corroboration. Source: SRC-000512. Evidence: SOURCE-TRANSCRIBED; INDEPENDENT-SCIENTIFIC-REVIEW-PENDING.

**PUBLISHER-TEMPERATURE-ROUNDING-REVIEW: MAT:0005:THERMO:REVIEW:03.** The publisher prints the first temperature as 4138., within the fit. At nominal 4138 K the enthalpy increment is 79.8453449466 kJ/mol, outside the half-last-digit tolerance for printed 79.84. The exact source minimum 4137.895 K lies within the printed-temperature cell 4137.5–4138.5 K and uniquely agrees with Cp, entropy and enthalpy at their printed precision. Preserve the raw row and explicit calculation_temperature_K=4137.895 in the evaluation index. This resolves formatting without widening tolerances or fit validity; it does not prohibit ordinary within-range evaluation at 4138 K and is not physical uncertainty. Source: SRC-000512. Evidence: PUBLISHER-CALCULATION-CHECK; INDEPENDENT-SCIENTIFIC-REVIEW-PENDING.

## Heat-capacity chart

![Boron: molar heat capacity calculated separately for each published phase and valid fit range](graphs/0005-Boron-B-GRAPH-011-Heat-Capacity.svg)

Each panel uses its own temperature scale. Lines sample the published equation; they are not observations or phase-stability predictions. Unknown uncertainties are not zero. These calculated charts supplement the chapter and do not replace any of the 22 requested illustrations.

## Validation and outstanding thermal data

The calculation is checked against the publisher's separately tabulated rounded values and the thermodynamic identities dH/dT = Cp and dS/dT = Cp/T. These checks verify transcription and arithmetic, not independent experimental validity. The source tables retain older evaluations; later measurements and application-specific state conditions need separate review. Thermal conductivity, diffusivity, expansion, pressure dependence, transition enthalpies and a phase diagram remain INSUFFICIENT DATA in this supplement. Existing phase-reference values are preserved for later source reconciliation.

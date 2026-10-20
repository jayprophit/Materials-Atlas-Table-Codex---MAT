# Molybdenum — thermal functions and phase-specific heat capacity

<!-- generated-by: sync-thermochemistry.mjs -->

4 published Shomate fits are available in this dated NIST Chemistry WebBook extraction. The source formula is Mo. Condensed data are expressed per mole of this elemental formula; the gas entry describes atomic Mo, not all species in an equilibrium vapour. The element's wider thermal domain remains PARTIAL.

[Parent record](0042-Molybdenum-Mo.md) · [Structured coefficients](data/structured/0042-Molybdenum-Mo-NIST-Thermochemistry.yaml) · [Calculated table](tables/0042-Molybdenum-Mo-TABLE-010-Thermodynamic-Functions.md) · [CSV](tables/0042-Molybdenum-Mo-TABLE-010-Thermodynamic-Functions.csv)

Source: **SRC-000431**, [NIST Chemistry WebBook](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7439987&Mask=FFFF), retrieved 2026-10-05. [Retained coefficient source](../../data/catalog/sources/nist-thermochemistry-0042-2026-10-05.html.txt) and [publisher's rounded comparison table](../../data/catalog/sources/nist-thermochemistry-0042-2026-10-05-table.html.txt) preserve the exact downloaded bytes and their SHA-256 hashes. The original evaluation is Chase (1998), with each earlier review date retained below.

## Applicable states and intervals

| Fit | Source phase variant | Valid T / K | Source comment |
|---|---|---:|---|
| GAS:1 | UNSPECIFIED-IN-FIT-TABLE | 4951.969–6000 | Data last reviewed in March, 1978 |
| LIQUID:1 | UNSPECIFIED-IN-FIT-TABLE | 2896–4951.969 | Data last reviewed in March, 1978 |
| SOLID:1 | UNSPECIFIED-IN-FIT-TABLE | 298–1900 | Data last reviewed in March, 1978 |
| SOLID:2 | UNSPECIFIED-IN-FIT-TABLE | 1900–2896 | Data last reviewed in March, 1978 |

A fit interval describes where the publisher supplies coefficients. Its endpoints are not automatically melting points, boiling points or equilibrium phase boundaries. Alternative solid phases may have overlapping ranges. The source's unspecified crystal structure is UNKNOWN. Each gas fit concerns its listed species; dissociation and ionisation equilibria are not calculated. Standard thermochemical functions do not supply arbitrary-pressure behaviour.

## Equations and reference states

With t = T/1000 and T in kelvin, use the exact source A–H coefficients in their published mixed-unit convention:

- Cp° = A + B·t + C·t² + D·t³ + E/t², in J mol⁻¹ K⁻¹.
- H°(T)−H°(298.15 K) = A·t + B·t²/2 + C·t³/3 + D·t⁴/4 − E/t + F − H, in kJ mol⁻¹.
- S° = A·ln(t) + B·t + C·t²/2 + D·t³/3 − E/(2·t²) + G, in J mol⁻¹ K⁻¹.

The last H is a coefficient, not the temperature-dependent enthalpy. Phase-specific reference offsets matter: do not splice enthalpy increments from different phases or interpret coefficient H as latent heat. The 298.15 K reference does not permit extrapolating a high-temperature fit down to 298.15 K. Outside-range evaluation is rejected. Unpublished coefficient uncertainty and covariance remain UNKNOWN; no error bars or extra physical precision are invented.

## Heat-capacity chart

![Molybdenum: molar heat capacity calculated separately for each published phase and valid fit range](graphs/0042-Molybdenum-Mo-GRAPH-009-Heat-Capacity.svg)

Each panel uses its own temperature scale. Lines sample the published equation; they are not observations or phase-stability predictions. Unknown uncertainties are not zero. These calculated charts supplement the chapter and do not replace any of the 22 requested illustrations.

## Validation and outstanding thermal data

The calculation is checked against the publisher's separately tabulated rounded values and the thermodynamic identities dH/dT = Cp and dS/dT = Cp/T. These checks verify transcription and arithmetic, not independent experimental validity. The source tables retain older evaluations; later measurements and application-specific state conditions need separate review. Thermal conductivity, diffusivity, expansion, pressure dependence, transition enthalpies and a phase diagram remain INSUFFICIENT DATA in this supplement. Existing phase-reference values are preserved for later source reconciliation.

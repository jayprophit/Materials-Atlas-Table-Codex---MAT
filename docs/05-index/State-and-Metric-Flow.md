# State and metric flow across MAT

The [Origin State](../../records/0000-Origin-State/0000-Origin-State.md) defines reference channels and comparison semantics. [Hydrogen](../../records/0001-Hydrogen-H/0001-Hydrogen-H.md) demonstrates how an element branches into isotope, charge, quantum, molecular, phase, material, process and application records. This remains the governing architecture; properties belong to the specific state where they were measured or calculated.

The flow is identity → state/species → reference and conditions → process/history → observation or calculation → evidence and uncertainty → relationships and publication assets. Reference conditions include temperature, pressure, fields, composition, time, physical scale and geometry where applicable. Zero, a selected reference and missing information remain distinct.

[Machine-readable schema and record index](../../data/quality/state-flow/index.json) links one individual audit for every existing record. It extracts 652 list items from the existing universal schema, preserving section and line provenance. These include metrics, metadata, categories and process families; they are not 652 universal scalar physical constants.

The audit maps exact normalised YAML keys to possible data owners. An owner candidate requires manual state, units, source and uncertainty review. `UNKNOWN` means the detector found no exact-key candidate; synonyms, narrative content and alternative canonical owners may still contain the information. Existing explicit null/status values remain visible. This audit must never become an automatic claim of scientific completeness.

## Conventional and non-conventional material

Conventional measured and evaluated datasets retain their original evidence labels. Calculations and theoretical predictions retain their models, equations, assumptions and uncertainties. Causali E material remains an author framework, following the [existing scientific-status document](../01-foundations/01-Causali-E/04-Causali-E-Scientific-Status.md).

Historical overlays, including Russell/Rife references where actually present, are preserved as source-attributed material outside the measured core. A text mention does not establish a populated metric, endorse a claim or prove a physical relationship. Element-specific proposed metrics require an explicit definition, provenance, testable prediction, comparison method, evidence and counterevidence. No historical frequencies or speculative values are invented to fill a gap.

## Scope and current repairs

The scan currently finds 0000–0118. It enumerates all existing four-digit record folders, so later records can be audited without silently assuming that every future record represents a confirmed chemical element. No record above 0118 was created by this audit. The foundation is not treated as a zeroth chemical element.

On 15 September 2026, 109 stale parent nuclear sections were linked to their already retained, element-specific NUBASE2020 evaluations. Their status is partial: isotope evaluation availability does not complete nuclear moments, Q-values, cross-sections or later experimental review. The [repair receipt](../../data/quality/parent-nuclear-link-reconciliation-2026-09-15.json) records affected owners and hashes. Hydrogen's first-ionisation evidence label in its chapter was aligned with the existing corrected structured value.

The [advanced completion work list](../09-production/Advanced-Completion-TODO.md) retains all broader scientific domains and the separate 22-image requirement per chemical element. Neither schema coverage nor a generated map completes those images or the underlying science.

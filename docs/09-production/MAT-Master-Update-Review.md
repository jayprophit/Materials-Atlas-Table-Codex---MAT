# MAT master update — audit, reference review and first implementation

## Additive universal-core continuation

The subsequent [universal core stage 1](../02-data/12-Universal-Core-Stage-1.md) adds a shared owner/state contract and constrained composition arithmetic. The [3 October reconciliation](MAT-Knowledge-Integration-2026-10-03.md) preserves the additional 24-section knowledge handoff and 28-section universal coverage requirement, maps them to existing section tasks, and adds a fifth canonical experiment reading with a reader/API comparison. Partial progress and the exact current task are recorded in the existing machine-readable intake and MAT-TODO ledger. The sections below retain the earlier audit and its acceptance gaps; no section is automatically complete.

The supplied 29 September update is preserved as SRC-000342: [data/research/sources/mat-update-2026-09-29.txt](../../data/research/sources/mat-update-2026-09-29.txt) (66,998 bytes; SHA-256 99e0d874068f5effcdad3ebb8bfb3ec65a80ed9e76cc864b045cb62390f9f73f). All 143 numbered sections and the preamble have line locators and hashes in the [machine-readable intake](../../data/quality/mat-update-intake.json). This is a requirements catalogue, not a claim that those capabilities exist.

The supplied dashboard is SRC-000343: [unaltered reference image](../../assets/references/genesis-dashboard-2026-09-29.png) (2,351,347 bytes; SHA-256 95d262aae03b6ab1a023de1d513693a926596538f861bf447e4081dcd93fd850). It is a 16-panel layout reference with unaccepted scientific content. It receives zero credit toward the original 22 separate images per element. Existing assets and placeholders remain in place.

## A. Current architecture

The canonical root remains the existing MAT repository. Primary chapter and structured records, source registries, relationship registries, visual/table/graph manifests and generated publication projections already exist. The full scientific scope remains foundation 0000, 118 recognised elements and separate proposed 119–188 entries. The current advanced audit reports no wholly accepted advanced element; candidate presence is not scientific completeness.

## B. Schema and record flow

The universal state schema already covers identity, nuclear/quantum/electronic, electromagnetic/spectral, chemical/structural/thermal/mechanical, pressure/environment/process/geometry/time/scale layers. The audit tracks 652 requirements per canonical record. The shared measurement schema accepts optional fields; it does not enforce a complete state/condition/source envelope for every legacy number. This continuation adds a bounded reading projection and leaves the locked parent schema and numeric owners unchanged. New proposed class names need a reviewed migration/crosswalk before they can enter canonical IDs.

## C. Foundation 0000

[records/0000-Origin-State/data/structured/0000-Origin-State.yaml](../../records/0000-Origin-State/data/structured/0000-Origin-State.yaml) already identifies FOUNDATION_REFERENCE, chemical_element=false and atomic_number=NOT-APPLICABLE. It has fifteen reference channels and distinguishes zero, missing, reference origin and author-framework mappings. These definitions do not establish literal nothingness or a universal vacuum. Existing figure geometry and all reference interpretations still require their recorded review.

## D. Hydrogen 0001

[records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml](../../records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml) remains Hydrogen, H, atomic number 1. Atomic H, charge states, isotopes, molecular H2 and ortho/para branches are distinguished. Existing ionisation, nuclear, Balmer, water-geometry, source and panel supplements remain canonical. The new poster must not rename the record or replace its numerical data. Hydrogen is the first acceptance example, but its entire target is not complete.

## E. Existing capabilities and the new bounded reader

The existing claim registry and epistemic graph support deterministic records and explicit edges without automatic truth promotion. Source accession, IDs, links, element coverage, calculated thermochemistry, ionisation and mass/reaction tables have dedicated checks. The new read-only adapter resolves four Hydrogen bindings from the original structured file. It carries the owner's evidence classification, returns missing uncertainty as null/UNKNOWN, distinguishes atomic H from equilibrium-H2, and refuses changed sources, units, species or owners. These are candidate readings awaiting the detailed source/state review indicated below.

| Binding | Object | Current value | Unit | Evidence retained | Uncertainty |
|---|---|---:|---|---|---|
| hydrogen-first-ionisation | MAT:0001:ATOM:H | 13.598434599702 | eV | THEORETICAL | 1.2e-11 |
| hydrogen-electron-affinity | MAT:0001:ATOM:H | 0.754195 | eV | MEASURED | 0.000018 |
| hydrogen-hyperfine-transition | MAT:0001:ATOM:H | 1420405751.768 | Hz | UNVERIFIED | UNKNOWN |
| hydrogen-equilibrium-h2-boiling | MAT:0001:MOL:H2 | 20.271 | K | UNVERIFIED | UNKNOWN |
| hydrogen-hyperfine-1970 | MAT:0001:ATOM:H | 1420405751.768 | Hz | MEASURED | 0.002 |

## Neutral atomic Hydrogen — explicit universal bridge

The [universal-core guide](../02-data/12-Universal-Core-Stage-1.md) and [atomic adapter](../../scripts/mat-atomic.mjs) expose the existing neutral child through `/atoms` and `--atoms`. General projections keep empty readings; the five examples above retain their previous payload. The single source-bound reading below is a projection of the same canonical value, not another measurement or numerical owner.

| Object | Metric | Value / eV | Source-displayed uncertainty / eV | Evidence |
|---|---|---:|---:|---|
| MAT:0001:ATOM:H | ionization.first | 13.598434599702 | 1.2e-11 | THEORETICAL |

Owner: [records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml](../../records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml), pointer `/charge_states/1`; existing binding: [data/research/mat-dashboard-bindings.json](../../data/research/mat-dashboard-bindings.json), pointer `/bindings/0`. Source SRC-000005: [NIST ASD original query](<https://physics.nist.gov/cgi-bin/ASD/ie.pl?spectra=H-Og&units=1&format=2&order=0&at_num_out=on&sp_name_out=on&ion_charge_out=on&el_name_out=on&seq_out=on&shells_out=on&conf_out=on&level_out=on&e_out=0&unc_out=on&biblio=on>), [DOI](https://doi.org/10.18434/T4W30F), [official definitions](<https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html>), [data/catalog/sources/nist-asd-ionisation-2026-09-14.csv](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv) physical row 2, [data/catalog/sources/nist-asd-ionisation-2026-09-14.provenance.json](../../data/catalog/sources/nist-asd-ionisation-2026-09-14.provenance.json) and [data/catalog/sources/nist-asd-ionisation-help-2026-09-14.html](../../data/catalog/sources/nist-asd-ionisation-help-2026-09-14.html). Version 5.12; retrieved 2026-09-14. Raw parentheses and bibliography key HDEL remain attached in the structured projection.

The reading references the existing `/electronic_ground_state` owner locator; the full object state remains UNRESOLVED with no state identity allocated. Isotope, temperature, pressure, source confidence level and coverage factor remain UNKNOWN. Owner label A is a legacy project qualifier. Retained eV uncertainty includes conversion-factor uncertainty. Underlying-work/claim acceptance, source-specific reuse rights and independent physical review remain pending. This bridge gives no whole element, domain or standalone-panel completion credit.

The hyperfine example also computes period = 1/frequency for that named transition. Its uncertainty stays UNKNOWN because the owner does not supply one. Normalised vectors, embeddings, universal element frequencies, body-frequency diagnostics and physical predictions are not implemented by this adapter. The JSON is a generated projection; editing it does not change the owner.

Reproduce with `node scripts/build-mat-update-intake.mjs`. List readings with `node scripts/read-mat-metric.mjs`, or inspect one with `node scripts/read-mat-metric.mjs hydrogen-first-ionisation`. Validate with `node scripts/validate-mat-update.mjs`. Schema: [bounded reading projection](../../data/schema/1.0.0/mat-reading-projection.schema.json).

## F. Missing capability groups

| Group | Sections | Existing candidate owners | Remaining gap |
|---|---|---|---|
| Audit, preservation and deduplication | 0–0 | [docs/02-data/00-Data-Architecture.md](../../docs/02-data/00-Data-Architecture.md); [data/quality/data-first-audit.json](../../data/quality/data-first-audit.json); [data/quality/MAT-TODO.json](../../data/quality/MAT-TODO.json) | Bounded exact-file audits exist; semantic deduplication and all historical intake still need review. |
| Foundation reference | 1–1 | [records/0000-Origin-State/data/structured/0000-Origin-State.yaml](../../records/0000-Origin-State/data/structured/0000-Origin-State.yaml) | Reference channels and explicit non-element identity exist. Whole-foundation scientific and publication review remains open. |
| Canonical Hydrogen identity | 2–2 | [records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml](../../records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml) | Hydrogen identity is preserved. The supplied image conflicts with this identity and is not a scientific source. |
| State hierarchy and record classes | 3–4 | [docs/02-data/01-Universal-Schema.md](../../docs/02-data/01-Universal-Schema.md); [docs/02-data/03-Identifier-System.md](../../docs/02-data/03-Identifier-System.md); [data/schema/1.0.0/mat-record.schema.json](../../data/schema/1.0.0/mat-record.schema.json) | Map requested classes to existing owners before adding types. Proposed mnemonic namespaces must not bypass canonical ID rules. |
| Mathematics, quantum and particle foundations | 5–9 | [docs/02-data/01-Universal-Schema.md](../../docs/02-data/01-Universal-Schema.md); [docs/05-index/07-Equation-and-Theory-Index.md](../../docs/05-index/07-Equation-and-Theory-Index.md) | The superset lists domains; complete source-bound quantum-field and particle catalogues or solvers have not been demonstrated. |
| Readings, frequency, dynamics and frames | 10–17 | [data/schema/1.0.0/mat-measurement.schema.json](../../data/schema/1.0.0/mat-measurement.schema.json); [data/research/frequency-cross-discipline.json](../../data/research/frequency-cross-discipline.json); [scripts/mat-reading.mjs](../../scripts/mat-reading.mjs) | Four bounded Hydrogen metric projections are the first implementation step. No universal reading/prediction engine, complete dynamics solver or universal element frequency is established. |
| Composition, process, phase, metrology and balances | 18–30 | [docs/02-data/10-Materials-Search-and-Design-Engine.md](../../docs/02-data/10-Materials-Search-and-Design-Engine.md); [templates/Material-Template.md](../../templates/Material-Template.md); [templates/Process-Template.md](../../templates/Process-Template.md); [data/schema/1.0.0/mat-measurement.schema.json](../../data/schema/1.0.0/mat-measurement.schema.json) | Design documentation and templates are present. Validated composition constraints, process histories, CALPHAD, multiphysics, exergy and general balance solvers require implementation and evidence. |
| Causali-E and authored operators | 31–36 | [records/0000-Origin-State/data/structured/0000-Origin-State.yaml](../../records/0000-Origin-State/data/structured/0000-Origin-State.yaml); [docs/02-data/11-Epistemic-Graph.md](../../docs/02-data/11-Epistemic-Graph.md) | Preserve all original operator strings in the source. Their author-framework semantics must be specified/tested separately from conventional algebra and physical laws. |
| Circularity, performance, robustness and uncertainty | 37–45 | [docs/02-data/06-Uncertainty-and-Confidence.md](../../docs/02-data/06-Uncertainty-and-Confidence.md); [scripts/thermochemistry.mjs](../../scripts/thermochemistry.mjs); [docs/02-data/10-Materials-Search-and-Design-Engine.md](../../docs/02-data/10-Materials-Search-and-Design-Engine.md) | Selected calculated functions exist; general life-cycle, Pareto, stochastic, covariance and validity engines remain pending. |
| Evidence and claim graph | 46–49 | [scripts/claims.mjs](../../scripts/claims.mjs); [scripts/epistemic-graph.mjs](../../scripts/epistemic-graph.mjs); [docs/02-data/10-Claim-Registry.md](../../docs/02-data/10-Claim-Registry.md); [docs/02-data/11-Epistemic-Graph.md](../../docs/02-data/11-Epistemic-Graph.md) | Deterministic claim/edge operations exist. Scientific validation, full source ingestion, replication and experiment planning are not implied by recorded edges. |
| Philosophy, cultural systems and unconventional models | 50–68 | [data/research/materials-phenomena-classical.json](../../data/research/materials-phenomena-classical.json); [data/research/frequency-reference-index.json](../../data/research/frequency-reference-index.json); [docs/07-migration/Historical-Models.md](../../docs/07-migration/Historical-Models.md); [data/research/russell-ten-octaves-1926.json](../../data/research/russell-ten-octaves-1926.json) | Existing concept/frequency/Russell intake is partial. New schools, claims and source editions need their own provenance and evidence category; no automatic equivalence or medical efficacy. |
| History, reverse engineering, patents and negative knowledge | 69–80 | [docs/05-index/06-People-and-Intellectual-Lineage.md](../../docs/05-index/06-People-and-Intellectual-Lineage.md); [scripts/claims.mjs](../../scripts/claims.mjs); [docs/02-data/10-Materials-Search-and-Design-Engine.md](../../docs/02-data/10-Materials-Search-and-Design-Engine.md) | General patent/prior-art, inverse ambiguity and lost-material evidence pipelines are proposed; source-specific cases and failed results need review. |
| Biomimicry and materials design | 81–89 | [templates/Material-Template.md](../../templates/Material-Template.md); [docs/02-data/10-Materials-Search-and-Design-Engine.md](../../docs/02-data/10-Materials-Search-and-Design-Engine.md) | Biological-machine and material-genome validation cases are pending. Replicator inspiration is not implemented synthesis capability. |
| New element, isotope and phase research | 90–91 | [data/catalog/proposed-elements-index.json](../../data/catalog/proposed-elements-index.json); [data/schema/1.0.0/mat-proposed-research.schema.json](../../data/schema/1.0.0/mat-proposed-research.schema.json) | 119–188 remain proposed entries. Predictions need named models/states; no catalogue entry establishes discovery. |
| Experiments, samples, sensors and failure | 92–99 | [templates/Process-Template.md](../../templates/Process-Template.md); [data/schema/1.0.0/mat-measurement.schema.json](../../data/schema/1.0.0/mat-measurement.schema.json); [docs/02-data/09-Time-Scale-and-Environment.md](../../docs/02-data/09-Time-Scale-and-Environment.md) | Sample/batch identity, calibration, raw traces, sensor adapters, laboratory loops and digital twins need defined owners and independent validation before any equipment integration. |
| Models, constraints, interoperability and source lifecycle | 100–106 | [data/registries/sources.yaml](../../data/registries/sources.yaml); [docs/02-data/05-Evidence-and-Provenance.md](../../docs/02-data/05-Evidence-and-Provenance.md); [docs/06-governance/01-Versioning.md](../../docs/06-governance/01-Versioning.md); [docs/06-governance/05-Attribution-and-Credit.md](../../docs/06-governance/05-Attribution-and-Credit.md) | Sources and provenance exist; complete model registries, contradiction resolution, external-ID joins and licence reviews remain partial or pending. |
| Creative, cultural, temporal and biological bridges | 107–119 | [data/research/materials-phenomena-classical.json](../../data/research/materials-phenomena-classical.json); [scripts/claims.mjs](../../scripts/claims.mjs); [docs/02-data/11-Epistemic-Graph.md](../../docs/02-data/11-Epistemic-Graph.md) | Retain fiction, authored time models, historical claims and biomedical hypotheses separately. Neither a diagram nor a frequency match demonstrates physical or clinical outcomes. No operational clinical or synthesis capability is created. |
| Discovery, raw readings, normalisation and contradictions | 120–127 | [scripts/claims.mjs](../../scripts/claims.mjs); [scripts/epistemic-graph.mjs](../../scripts/epistemic-graph.mjs); [scripts/mat-reading.mjs](../../scripts/mat-reading.mjs); [docs/02-data/10-Materials-Search-and-Design-Engine.md](../../docs/02-data/10-Materials-Search-and-Design-Engine.md) | Four raw metric projections now resolve canonical pointers. Normalised vectors, fingerprint similarity, discovery classifications and contradiction interpretation require separate defined transforms and tests. |
| Visual system and five acceptance examples | 128–134 | [data/quality/panel-image-plan.json](../../data/quality/panel-image-plan.json); [records/0001-Hydrogen-H/0001-Hydrogen-H-Visual-Specification.md](../../records/0001-Hydrogen-H/0001-Hydrogen-H-Visual-Specification.md); [templates/Material-Template.md](../../templates/Material-Template.md) | The 22 standalone panels remain required. The new 16-panel poster is a layout reference only. Hydrogen, steel, Nd-Fe-B, a historic material and biomimicry require case-by-case acceptance. |
| Staged implementation, tests and final scope | 135–142 | [scripts/validate-mat.mjs](../../scripts/validate-mat.mjs); [scripts/refresh-advanced-audits.mjs](../../scripts/refresh-advanced-audits.mjs); [MAT-ADVANCED-RESUME.md](../../MAT-ADVANCED-RESUME.md) | Follow incremental source-bound batches. Passing a catalogue/adapter test does not complete the universal-system vision or any whole element. |

Owner paths identify useful existing material, not proof of complete implementation. In particular, whole composition/process engines, autonomous laboratory loops, general inverse design, validated medical prediction, normalised reading vectors and complete cultural/history datasets remain pending.

## G. Reference-image conflicts

| Issue | Panels | Observed reference content | Required disposition |
|---|---|---|---|
| IDENTITY | 1, 2, 3, 8, 16 | The image calls atomic number 0001 Primidium, symbol Pr. | Preserve the original image as a reference. Scientific views must resolve Hydrogen/H from its owner; Pr belongs to the separate Praseodymium entry. |
| ATOMIC-MOLECULAR-STATE | 1, 2, 5, 6, 8, 9 | A stable monatomic STP gas label is mixed with H2-like phase, thermodynamic and bonding values. | Require the species, spin composition, phase and conditions for every metric. Do not import this mixed table as a Hydrogen measurement. |
| ISOTOPES | 3 | The image labels its mass-2 isotope unstable and its mass-3 isotope theoretical. | Compare with the canonical Hydrogen isotope branches and evaluated nuclear states before rendering; no image-derived isotope enters core data. |
| MASS-REFERENCE | 1, 3 | Approximate elemental atomic weight and single-particle/nuclear mass are combined. | Keep standard atomic-weight interval, isotope mass and nuclear mass as distinct quantities with their own sources and units. |
| SPIN-AND-ATOM-MODEL | 2, 4 | The poster presents an electron spin of minus one half beside a literal orbit schematic. | Distinguish spin quantum number from a projection; label any Bohr orbit as a model, not an electron trajectory. |
| FREQUENCY-PERIOD | 4 | The printed frequency 6.579e15 Hz and period 1.519e-15 s fail T = 1/f. | Retain the two strings for review; calculate their reciprocal only as an arithmetic diagnostic. Do not accept the depicted physical mechanism. |
| UNSPECIFIED-WAVE-MECHANISM | 4 | A de Broglie wavelength and a typical vibrational/orbit frequency lack a precise state or momentum definition. | Require the named transition or mode, model, state and source; no universal element frequency is inferred. |
| DENSITY-AND-HEAT-CAPACITY-BASIS | 5, 9 | Gas density 8.99e-5 kg/m3 and specific heat 14.304 J/mol-K appear without a consistent species/mass-versus-mole basis. | Block accession until source, units, pressure, temperature and molecular/spin state are independently checked; do not silently correct by guessing conversion factors. |
| ENERGY-AND-IONISATION | 6, 7 | The 121.6 nm line is juxtaposed with generic UV ionisation wording. | Separate bound-bound transitions from ionisation thresholds and state the lower/upper states and wavelength medium. |
| CROSS-SECTION-CONDITIONS | 10 | Single electron, neutron and proton cross-sections are presented without projectile energy, target isotope or interaction definition. | Store cross-sections only with the process, energy, state, differential/integrated convention and source. |
| FORMULA-AND-SELECTION-RULES | 6, 8 | Primidium-based formula labels coexist with H2O and monatomic IR/Raman labels. | Keep each molecular identity and selection rule bound to its own species and mode; verify representative compounds independently. |
| EXTREMES-AND-SAFETY | 12, 13, 15 | Best/worst performance and broad safety or sustainability claims have no comparison set or conditions. | Keep as unverified design text; require a material state, process, objective, comparison population and supporting evidence before ranking. |
| ORIGIN-CLAIM | 16 | The summary describes a first element after the void. | Do not equate the MAT reference origin with literal nothingness or a physical creation sequence. Preserve authored interpretations in their separate category. |

Arithmetic diagnostic only: the printed f = 6.579 × 10^15 Hz and T = 1.519 × 10^-15 s give fT = 9.993501. The reciprocal of the printed frequency is 1.519988e-16 s. This diagnoses internal inconsistency; it does not validate the image's orbit/vibration interpretation or create a new physical value.

## H. Migration and interpretation risks

Keep artistic layout, user proposals, historical/cultural assertions, source-reported values and independently reviewed scientific measurements distinct. Preserve all original authored Causali-E expressions in the source; do not reinterpret them as standard arithmetic identities. Keep named traditions and translations source-specific. A recorded Rife/Russell or other claim, a patent, a similar number, a diagram or a source hash is not evidence that a physical or clinical effect is established. The image remains accessible for comparison with these qualifications. No archived/source file was deleted, renamed or overwritten; the two original user files remain outside the repository unchanged.

## I. Staged next work and acceptance examples

| Example | Requirement section | Current acceptance | Next concrete step |
|---|---:|---|---|
| hydrogen | 130 | PARTIAL | Complete state-specific claims, uncertainty and source review; four bounded readings do not satisfy the whole acceptance target. |
| steel | 131 | PENDING | Choose a documented grade/sample, composition basis and thermal/process history; create a source-bound material record under the existing identifier rules. |
| nd-fe-b | 132 | PENDING | Distinguish a compound/phase from a processed magnet, including dopants, microstructure, coating and test conditions. |
| historic-material | 133 | PENDING | Select one source-documented object/sample; retain translation and processing ambiguity rather than asserting a unique reconstruction. |
| biomimicry | 134 | PENDING | Choose ATP synthase, nacre or bone and bind geometry, energy flow, scale and mechanism to primary evidence before drawing engineering analogies. |

Continue source-bound element enrichment at Copper (0029), while resolving Scandium and Iron review gaps. Extend the bounded reader only after named state, unit, source and uncertainty semantics are checked. Complete Hydrogen's acceptance target, then one documented steel state, one Nd-Fe-B magnet state, one historical sample and one biomimetic mechanism. Reuse existing owners and require reproducible tests before any broader class/schema migration. Continue scientific tables and calculated charts now; defer generated illustration completion until the data-first review.

## J. Requirement tracking and first change

Every section below has a durable MAT-UPDATE task in the central TODO ledger, and all remain OPEN. Section-level preservation is complete for this supplied file; line-by-line scientific validation and implementation are not. The first code change is the four-reading adapter and its guards, plus source/section/image integrity validation. It creates no new element, no alternate periodic table, no accepted scientific image value and no automatic claim promotion.

| Section | Source lines | Group | Requirement |
|---:|---|---|---|
| 0 | 16–36 | preservation | FIRST INSTRUCTION — DO NOT START BY REWRITING EVERYTHING |
| 1 | 37–90 | foundation | CANONICAL MAT ROOT |
| 2 | 91–131 | hydrogen | CANONICAL FIRST ELEMENT |
| 3 | 132–178 | state-identity | MAT IS STATE-BASED, NOT ONLY ELEMENT-BASED |
| 4 | 179–258 | state-identity | UNIVERSAL MAT RECORD CLASSES |
| 5 | 259–348 | science-foundations | CORE SCIENCE DOMAINS |
| 6 | 349–388 | science-foundations | MATHEMATICS IS A FOUNDATION LAYER |
| 7 | 389–430 | science-foundations | QUANTUM MECHANICS |
| 8 | 431–477 | science-foundations | QUANTUM FIELD THEORY |
| 9 | 478–534 | science-foundations | PARTICLE PHYSICS |
| 10 | 535–596 | readings | NUMERICAL MAT READING ENGINE |
| 11 | 597–656 | readings | FREQUENCY IS MULTIDIMENSIONAL |
| 12 | 657–711 | readings | WAVES AND SIGNALS |
| 13 | 712–804 | readings | UNIVERSAL MEASUREMENT AND DYNAMICS LAYER |
| 14 | 805–831 | readings | REFERENCE FRAMES |
| 15 | 832–858 | readings | RELATIVITY / TIME DILATION |
| 16 | 859–890 | readings | RATES OF CHANGE |
| 17 | 891–914 | readings | DIMENSIONLESS NUMBERS |
| 18 | 915–955 | composition-process | COMPOSITION ENGINE |
| 19 | 956–1008 | composition-process | COMPOSITION DESIGN / SLIDERS |
| 20 | 1009–1074 | composition-process | PROCESS GENOME |
| 21 | 1075–1107 | composition-process | STRUCTURE ACROSS SCALES |
| 22 | 1108–1131 | composition-process | PROCESS → STRUCTURE → PROPERTY → PERFORMANCE → FAILURE |
| 23 | 1132–1154 | composition-process | PHASE AND STABILITY ENGINE |
| 24 | 1155–1172 | composition-process | NON-EQUILIBRIUM PHYSICS |
| 25 | 1173–1193 | composition-process | SPATIAL FIELD ENGINE |
| 26 | 1194–1210 | composition-process | MULTIPHYSICS |
| 27 | 1211–1236 | composition-process | METROLOGY |
| 28 | 1237–1256 | composition-process | DIMENSIONAL-ANALYSIS ENGINE |
| 29 | 1257–1284 | composition-process | CONSERVATION / BALANCE AUDITOR |
| 30 | 1285–1302 | composition-process | EXERGY / ENERGY QUALITY |
| 31 | 1303–1342 | author-framework | CAUSALI-E — UNIVERSAL AUTHORED PRINCIPLE |
| 32 | 1343–1426 | author-framework | ORIGINAL 12 A/B/C OPERATORS |
| 33 | 1427–1488 | author-framework | ORIGINAL 24 POTENTIAL EXPRESSIONS |
| 34 | 1489–1510 | author-framework | NESTED CAUSALITY |
| 35 | 1511–1540 | author-framework | ZERO / ORIGIN CONCEPT |
| 36 | 1541–1594 | author-framework | TRANSFORMATION / EXCHANGE PRINCIPLE |
| 37 | 1595–1654 | performance-uncertainty | BY-PRODUCT / CIRCULAR MATTER PRINCIPLE |
| 38 | 1655–1686 | performance-uncertainty | RECYCLING / SECOND-LIFE ENGINE |
| 39 | 1687–1729 | performance-uncertainty | EXTREMES + ALL OPTIONS PRINCIPLE |
| 40 | 1730–1758 | performance-uncertainty | EFFICIENCY IS MULTIDIMENSIONAL |
| 41 | 1759–1780 | performance-uncertainty | SENSITIVITY ENGINE |
| 42 | 1781–1797 | performance-uncertainty | TOLERANCE / ROBUSTNESS ENGINE |
| 43 | 1798–1821 | performance-uncertainty | STOCHASTIC / PROBABILITY ENGINE |
| 44 | 1822–1840 | performance-uncertainty | UNCERTAINTY PROPAGATION |
| 45 | 1841–1865 | performance-uncertainty | VALIDITY ENGINE |
| 46 | 1866–1916 | evidence | EVIDENCE ENGINE |
| 47 | 1917–1954 | evidence | EPISTEMIC FIREWALL |
| 48 | 1955–1998 | evidence | CLAIM GRAPH |
| 49 | 1999–2024 | evidence | THEORY → PREDICTION → EXPERIMENT |
| 50 | 2025–2076 | historical-cultural | PHILOSOPHY DOMAIN |
| 51 | 2077–2117 | historical-cultural | PLATO / PYTHAGOREAN / ARISTOTELIAN BRANCHES |
| 52 | 2118–2137 | historical-cultural | ANCIENT ATOMISM |
| 53 | 2138–2191 | historical-cultural | ENERGY / SPIRIT / SOUL / CONSCIOUSNESS |
| 54 | 2192–2226 | historical-cultural | CHAKRAS / SUBTLE BODY |
| 55 | 2227–2283 | historical-cultural | MAGIC / MANA / TRADITIONAL POWER SYSTEMS |
| 56 | 2284–2310 | historical-cultural | AETHER / ETHER |
| 57 | 2311–2334 | historical-cultural | VIMANA / ANCIENT TECHNOLOGY CLAIMS |
| 58 | 2335–2376 | historical-cultural | EARTH / GAIA / WORLD MODELS |
| 59 | 2377–2410 | historical-cultural | REALMS / PLANES |
| 60 | 2411–2429 | historical-cultural | GNOSTIC SYSTEMS |
| 61 | 2430–2447 | historical-cultural | HISTORICAL / UNCONVENTIONAL RESEARCH OVERLAYS |
| 62 | 2448–2468 | historical-cultural | WALTER RUSSELL |
| 63 | 2469–2508 | historical-cultural | RIFE |
| 64 | 2509–2543 | historical-cultural | MARKO RODIN / VORTEX-BASED MATHEMATICS |
| 65 | 2544–2568 | historical-cultural | TERRENCE HOWARD |
| 66 | 2569–2578 | historical-cultural | GAGUT |
| 67 | 2579–2600 | historical-cultural | TESLA |
| 68 | 2601–2630 | historical-cultural | THEORY COMPARISON ENGINE |
| 69 | 2631–2676 | history-research | HISTORY / ARCHAEOLOGY / LOST MATERIALS |
| 70 | 2677–2704 | history-research | TACIT KNOWLEDGE |
| 71 | 2705–2730 | history-research | REVERSE ENGINEERING |
| 72 | 2731–2744 | history-research | INVERSE AMBIGUITY |
| 73 | 2745–2766 | history-research | UNIVERSAL TRANSFORMATION GRAPH |
| 74 | 2767–2810 | history-research | ELEMENT VS MATERIAL MANUFACTURING |
| 75 | 2811–2831 | history-research | RESEARCH INTELLIGENCE |
| 76 | 2832–2874 | history-research | PATENT INTELLIGENCE |
| 77 | 2875–2898 | history-research | RESEARCH → PATENT → PRODUCT CHAIN |
| 78 | 2899–2918 | history-research | TECHNOLOGY MATURITY |
| 79 | 2919–2948 | history-research | PRIOR-ART / REDISCOVERY ENGINE |
| 80 | 2949–2969 | history-research | NEGATIVE KNOWLEDGE |
| 81 | 2970–3003 | biomimicry-design | BIOMIMICRY / NATURE ENGINEERING |
| 82 | 3004–3040 | biomimicry-design | BIOLOGICAL MACHINE LIBRARY |
| 83 | 3041–3064 | biomimicry-design | NATURE MECHANISM FINGERPRINT |
| 84 | 3065–3096 | biomimicry-design | BIOLOGICAL MATERIALS |
| 85 | 3097–3115 | biomimicry-design | SELF-ASSEMBLY / MORPHOGENESIS |
| 86 | 3116–3143 | biomimicry-design | EVOLUTIONARY DESIGN |
| 87 | 3144–3185 | biomimicry-design | REPLICATOR / MATTER-COMPILER ROADMAP |
| 88 | 3186–3221 | biomimicry-design | MATERIALS DISCOVERY |
| 89 | 3222–3246 | biomimicry-design | MAT MATERIAL GENOME |
| 90 | 3247–3267 | proposed-research | NEW ELEMENT / ISOTOPE RESEARCH |
| 91 | 3268–3287 | proposed-research | NEW STATES OF MATTER / MATERIAL PHASES |
| 92 | 3288–3297 | lab-observation | EXPERIMENT PLANNER |
| 93 | 3298–3317 | lab-observation | AUTONOMOUS LAB LOOP |
| 94 | 3318–3335 | lab-observation | SAMPLE / BATCH / MATERIAL IDENTITY |
| 95 | 3336–3356 | lab-observation | RAW EVIDENCE RETENTION |
| 96 | 3357–3390 | lab-observation | SENSOR / OBSERVATION ENGINE |
| 97 | 3391–3415 | lab-observation | UNKNOWN SAMPLE IDENTIFICATION |
| 98 | 3416–3435 | lab-observation | DIGITAL TWIN |
| 99 | 3436–3472 | lab-observation | FAILURE + RESILIENCE |
| 100 | 3473–3489 | models-provenance | INFORMATION / COMPLEXITY |
| 101 | 3490–3508 | models-provenance | CONSTRAINT SOLVER |
| 102 | 3509–3529 | models-provenance | MODEL REGISTRY / MODEL DISAGREEMENT |
| 103 | 3530–3548 | models-provenance | VERSIONING / SUPERSESSION |
| 104 | 3549–3580 | models-provenance | DATA INTEROPERABILITY |
| 105 | 3581–3605 | models-provenance | SOURCE / PROVENANCE LIFECYCLE |
| 106 | 3606–3624 | models-provenance | COPYRIGHT / MEDIA |
| 107 | 3625–3661 | speculation-biological | FICTION / CREATIVE INSPIRATION |
| 108 | 3662–3689 | speculation-biological | FICTION → SCIENCE TRANSLATION |
| 109 | 3690–3719 | speculation-biological | ANCIENT / RELIGIOUS / CULTURAL KNOWLEDGE |
| 110 | 3720–3743 | speculation-biological | DECLASSIFIED / REDACTED RECORDS |
| 111 | 3744–3780 | speculation-biological | CONSPIRACY / ANOMALY ENGINE |
| 112 | 3781–3799 | speculation-biological | TIME / HISTORY / RETRODICTION |
| 113 | 3800–3834 | speculation-biological | BRANCHING TIME — AUTHOR SPECULATIVE MODEL |
| 114 | 3835–3856 | speculation-biological | RETROCAUSALITY |
| 115 | 3857–3879 | speculation-biological | SPACETIME STATE COORDINATES |
| 116 | 3880–3901 | speculation-biological | LIFE / ECOLOGICAL CONTINUITY PRINCIPLE |
| 117 | 3902–3933 | speculation-biological | WEAPONISATION / DESTRUCTIVE PATHWAYS |
| 118 | 3934–3958 | speculation-biological | MEDICINE / DRUG DISCOVERY |
| 119 | 3959–3989 | speculation-biological | CRISPR / BIOLOGICAL BRIDGE |
| 120 | 3990–4014 | discovery-readings | DISCOVERY MODES |
| 121 | 4015–4033 | discovery-readings | DISCOVERY CLASSIFICATION |
| 122 | 4034–4085 | discovery-readings | UNIVERSAL EDGE TYPES |
| 123 | 4086–4139 | discovery-readings | UNIVERSAL MAT READING |
| 124 | 4140–4172 | discovery-readings | RAW VS NORMALISED READINGS |
| 125 | 4173–4198 | discovery-readings | MAT FINGERPRINT |
| 126 | 4199–4217 | discovery-readings | UNKNOWN / MISSING-VARIABLE DISCOVERY |
| 127 | 4218–4245 | discovery-readings | CONTRADICTION ENGINE |
| 128 | 4246–4297 | visual-acceptance | MAT VISUAL SYSTEM |
| 129 | 4298–4313 | visual-acceptance | RECOMMENDED FIRST VALIDATION SET |
| 130 | 4314–4373 | visual-acceptance | HYDROGEN ACCEPTANCE TARGET |
| 131 | 4374–4404 | visual-acceptance | STEEL ACCEPTANCE TARGET |
| 132 | 4405–4426 | visual-acceptance | Nd-Fe-B ACCEPTANCE TARGET |
| 133 | 4427–4446 | visual-acceptance | LOST-MATERIAL ACCEPTANCE TARGET |
| 134 | 4447–4466 | visual-acceptance | BIOMIMICRY ACCEPTANCE TARGET |
| 135 | 4467–4600 | implementation | RECOMMENDED IMPLEMENTATION ORDER |
| 136 | 4601–4639 | implementation | TEST REQUIREMENTS |
| 137 | 4640–4658 | implementation | STRICT SCIENTIFIC RULES |
| 138 | 4659–4680 | implementation | STRICT DATA RULE |
| 139 | 4681–4718 | implementation | CORE MAT PHILOSOPHY |
| 140 | 4719–4806 | implementation | FINAL SYSTEM VISION |
| 141 | 4807–4844 | implementation | IMPLEMENTATION CONDUCT FOR CODEX |
| 142 | 4845–4878 | implementation | FIRST CODEX TASK |

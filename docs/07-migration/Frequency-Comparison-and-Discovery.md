# Frequency references, comparisons and discovery

MAT tracks source claims and established measurements together while preserving their different evidence status. Frequency alone is not an identity, a dose, a diagnosis or proof of a biological mechanism.

## Imported sources

| Source | Coverage | Status |
|---|---|---|
| SRC-000309: Spooky2 selected list, 2021 | 24-page PDF; 544 table occurrences, 543 unique entries; 1,778 values/ranges | All table rows extracted; unit unstated |
| SRC-000310: Spooky2 list, 2015 | 171 pages; 6,004 program occurrences, 6,003 unique records; 43,341 tokens | Numeric values, ranges and uninterpreted program expressions retained |
| SRC-000311: Nenah Sylver, fifth-edition introduction, 2021 | 34 pages of front matter and introduction | Text and numeric mentions extracted; not the full handbook or Chapter 5 frequency directory |

The corpus retains every page's extracted text, page number and source hash. Numeric mentions in prose include dates, counts and page references: they are not automatically frequency measurements. Image-only lettering and two-column reading order still require editorial review. The reproduced 9 November 1931 Milbank Johnson letter on handbook PDF page 20 discusses a microscope visit and arrangements involving Arthur I. Kendall; it is historical correspondence, not a controlled efficacy study.

The 2015 source describes HC and KHZ settings (square/inverse-sawtooth waveform, positive offset and amplitude), but the amplitude unit and complete protocol context are not established here. Program expressions such as `frequency=number`, sweeps and device commands remain literal source syntax. MAT does not execute them or infer treatment durations from them.

## Hospital, technology and science cross-reference

| System | Frequency meaning | Other essential metrics | Useful outcome | Limitations and comparison boundary | Source |
|---|---|---|---|---|---|
| MRI | RF excitation and detection of nuclear magnetic response in a specified field | Nucleus, static field, pulse sequence, relaxation, tissue environment, image quality, RF exposure | Soft-tissue imaging without ionising X-rays | Motion, implant compatibility, field hazards and acquisition conditions matter; not a generic body frequency | SRC-000312 |
| Diagnostic ultrasound | Mechanical sound; above 20 kHz, commonly MHz | Acoustic output, coupling, depth, attenuation, echo timing and image quality | Real-time anatomical and functional information | Air/bone can limit imaging; exposure and diagnostic purpose matter. Acoustic and electromagnetic MHz are different mechanisms | SRC-000313 |
| Shortwave diathermy | RF carrier bands of 13.56 or 27.12 MHz | Peak/average power, pulse width/rate, duty cycle, SAR, fields and deposited energy | Defined thermal or nonthermal device applications | US definitions specify limited intended uses and controls; they do not establish Rife-list efficacy or cancer treatment | SRC-000317 |
| Wireless medical telemetry | RF communications bands: 608–614, 1395–1400, 1427–1432 MHz in the US | Bandwidth, interference, link reliability and frequency coordination | Transmits physiological monitoring data | Carrier frequency is not the patient's heart or respiratory rate, and is not a therapeutic setting | SRC-000314 |
| Atomic and molecular spectroscopy | Defined transition or vibrational/rotational response | Species, charge/state, medium, wavelength convention, instrument, uncertainty | Identification and structure/energy analysis | Use the existing state-specific MAT spectral records; a numerical coincidence with a vendor list is not a shared transition |
| Rife/Spooky2 lists | Publisher-associated program tokens; units often unstated | Unit, waveform, amplitude, coupling, duration, target definition and independent outcomes are missing or incomplete | Historical comparison, evidence review and hypothesis generation | No reliable cancer-cure evidence in the CRUK overview; similarity to regulated RF devices does not transfer efficacy | SRC-000309, SRC-000310, SRC-000315 |

## Cross-reference rules

1. Match subject identity and frequency kind before comparing numbers. Separate atomic spectra, applied stimulation, acoustic vibration, physiological rhythms and symbolic associations.
2. Require explicit units. Missing units remain UNKNOWN. A KHZ database code does not establish kilohertz units.
3. Retain source conditions, uncertainty and original values. Convert only with a documented equation; do not infer harmonics merely to manufacture a match.
4. Compare outcomes with controls, effect sizes, replication and alternative explanations. Mark similarities as numerical, mechanistic or evidence-supported separately.
5. Treat topic matches from the search index as lexical candidates requiring review. A plant or animal word is not a taxonomic identification; a substance name does not specify an element's chemical form.
6. Assess benefits and limitations for a particular material, compound, isotope, dose, state and application. Avoid universal good/bad scores for elements.

## Discovery paths

New compounds and materials can arise from bonding, composition and processing changes among existing elements. New chemical elements require nuclear identity evidence, not just a new bond or frequency pattern. IUPAC's recognition process evaluates experimental discovery claims (SRC-000316).

For materials research, store composition, phase, bonding model, stability, processing conditions, measured properties, uncertainty and replication. For nuclear discovery hypotheses, store atomic-number evidence, reaction/decay interpretation and independent confirmation separately. Proposed identities 119–188 remain unconfirmed in MAT.

For biological claims, record species, tissue, environment, applied signal, controls, endpoints and independent evidence. Human, animal and plant findings cannot be assumed interchangeable. MAT can expose testable questions; it cannot guarantee that a pattern produces a discovery.

## Machine-readable references

- [Hospital and technology comparison metrics](../../data/research/frequency-cross-discipline.json)
- [2015–2021 source comparisons](../../data/research/frequency-source-comparisons.json)
- [Candidate element reference links](../../data/research/frequency-element-reference-links.json)

- [Search index and subject taxonomy](../../data/research/frequency-reference-index.json)
- [2015 structured programs](../../data/research/spooky2-frequency-list-2015.json)
- [2015 page corpus](../../data/research/spooky2-frequency-list-2015-corpus.json)
- [2021 structured selected list](../../data/research/spooky2-frequency-list-2021.json)
- [Handbook introduction page corpus](../../data/research/rife-handbook-introduction-2021-corpus.json)
- [Selected-list reading table](Spooky2-Frequency-Reference.md)

Outstanding: review image text and column order; verify publisher syntax and units; independently evaluate individual claims; review lexical categories against organism/substance identifiers; broaden comparisons to ECG/EEG, photobiology, industrial sensors and material-specific spectroscopy using primary sources.

## Complete source files

- [2021 Spooky2 list, 24 pages](../../data/research/sources/spooky2-frequency-list-2021.pdf) — SRC-000309.
- [2015 supplied list, 171 pages](../../data/research/sources/spooky2-frequency-list-2015.pdf) — SRC-000310.
- [Supplied Rife Handbook introduction, 34 pages](../../data/research/sources/rife-handbook-introduction-2021.pdf) — SRC-000311. This is the supplied excerpt, not the complete handbook.
- [Walter Russell primary-source collection](Russell-1926-Primary-Source.md) — SRC-000324.
- [Hash and page preservation manifest](../../data/research/frequency-source-preservation.json). Exact source preservation and reviewed machine-readable transcription have separate completion states.

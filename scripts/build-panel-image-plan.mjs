import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './lib.mjs';

// The user's two posters define separate deliverables, not replacement V-slot IDs.
const sets = [
  { id: 'A', count: 9, style: 'Light blue educational reference', panels: [
    ['Atomic Structure', ['V02'], 'Neutral atom identity; distinguish a schematic from a literal electron trajectory.'],
    ['Electron Probability Cloud (1s)', ['V04'], 'Element-specific occupied states and qualified density representation; do not copy Hydrogen 1s to every element.'],
    ['H₂ Molecule', ['V03'], 'Element-specific elemental bonding or lattice; identify the species and state.'],
    ['Isotopes', ['V05'], 'Separate isotope sub-diagrams, nucleon counts, stability and source-qualified abundances.'],
    ['Spectral Emission (Balmer Series)', ['V06'], 'Element-specific transitions, wavelengths, medium and spectral chart; Balmer is Hydrogen-specific.'],
    ['Water Molecule (H₂O)', ['V03', 'V14'], 'Element-specific representative compound with verified geometry; explicitly handle unsupported compounds.'],
    ['Hydrogen in the Universe', ['V17', 'V14'], 'Element-specific astrophysical occurrence and origin with qualified abundance.'],
    ['Hydrogen as a Fuel', ['V13', 'V17'], 'Element-specific application/process flow; fuel is not a universal element property.'],
    ['Key Properties', ['V07', 'V10', 'V12'], 'Condition-qualified property icons and labels; phase, temperature and pressure must agree.']
  ]},
  { id: 'B', count: 13, style: 'Dark navy cyan-bordered master blueprint reference', panels: [
    ['Natural State / Occurrence', ['V01'], 'Separate occurrence examples within one standalone panel; identify elemental versus compound forms.'],
    ['Standard 2D Scientific View', ['V02'], 'Atomic schematic, particle legend and key atomic-data table.'],
    ['H₂ Bonding View', ['V03'], 'Element-specific elemental bonding and compound examples, with bond notation and state labels.'],
    ['Electron Probability Cloud / Quantum View', ['V04'], 'Element-specific quantum-density illustration and legend, explicitly qualitative or calculated.'],
    ['Isotopes', ['V05'], 'Isotope sub-diagrams and labels; retain uncertainty and isotope qualifiers.'],
    ['Spectral Fingerprint / Energy Transitions', ['V06'], 'Spectrum, energy-level transition diagram and line table as components of this standalone panel.'],
    ['Physical & Chemical Properties', ['V07', 'V10', 'V12'], 'Readable source-backed property table with units, conditions and uncertainty.'],
    ['Magnetic / Electromagnetic Behavior', ['V08', 'V09'], 'Species/state-specific response diagrams and explanation; distinguish atoms, molecules and bulk phases.'],
    ['3D Extruded Data Object', ['V16'], 'Conceptual data sculpture representing identity/properties/connections; not a measured atom.'],
    ['3D Cutaway (Internal Structure)', ['V15', 'V16'], 'Labelled conceptual data-object cutaway; distinguish data layers from physical atomic structure.'],
    ['Exploded Layer View', ['V16'], 'Separate labelled identity, property, structure, electron, nuclear and base layers of the conceptual object.'],
    ['Interaction / Compatibility', ['V03', 'V14'], 'Element-specific reaction/compound sub-diagrams; balanced equations and explicit conditions where supplied.'],
    ['Reserved Future Metrics', ['V18'], 'A separate labelled extension panel. Proposed/custom metrics remain visibly distinct from established data.']
  ]}
];
const records = readdirSync(join(root, 'records')).filter(x => /^\d{4}-/.test(x) && Number(x.slice(0,4)) >= 1 && Number(x.slice(0,4)) <= 118).sort();
if (records.length !== 118) throw new Error('Expected 118 chemical-element records');
const output = { schema_version: '1.0.0', authority: 'Explicit user clarification: both poster sets, each numbered panel delivered as a single image for its placeholder.',
  unit_of_delivery: 'One independently addressable image per numbered panel; internal sub-diagrams remain part of that panel. Additional component exports may supplement it.',
  architecture: 'Additive crosswalk to existing locked V01–V18; does not rename or replace those slots.',
  minimum_images_per_element: 22, minimum_images_all_elements: 2596,
  completion_rule: 'A collage, composite poster, multi-section substitute, empty file or registration alone cannot complete a panel. Require the correct separate file, element-specific evidence, visual inspection and placeholder wiring.',
  templates: sets.map(s => ({ ...s, panels: s.panels.map(([title, slots, brief], i) => ({ panel_id: `${s.id}${String(i+1).padStart(2,'0')}`, reference_label: title, locked_visual_slots: slots, adaptation_brief: brief })) })),
  elements: records.map(stem => ({ record_id: `MAT:${stem.slice(0,4)}`, stem, panels: sets.flatMap(s => s.panels.map(([title, slots], i) => {
    const id = `${s.id}${String(i+1).padStart(2,'0')}`;
    return { panel_id: id, reference_label: title, locked_visual_slots: slots, planned_path: `records/${stem}/images/panels/${stem}-PANEL-${id}.png`, status: 'PENDING-INDIVIDUAL-ASSET-REVIEW', asset_path: null, source_ids: [], review: 'Existing assets have not yet been accepted against this exact standalone-panel requirement.' };
  })) })) };
writeFileSync(join(root, 'data/quality/panel-image-plan.json'), JSON.stringify(output, null, 2)+'\n');
const policyPath = join(root, 'data/quality/visual-template-policy.json');
if (existsSync(policyPath)) {
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  policy.standalone_panel_contract = { sets: { A: 9, B: 13 }, per_element: 22, both_sets_required: true, plan: 'data/quality/panel-image-plan.json', delivery: output.unit_of_delivery, completion_rule: output.completion_rule };
  writeFileSync(policyPath, JSON.stringify(policy, null, 2)+'\n');
}
console.log(`Recorded ${records.length} elements × 22 separate panels = 2596 image deliverables; no unreviewed asset marked complete.`);

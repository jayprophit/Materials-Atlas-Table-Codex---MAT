// Audit vocabulary only: does not change the locked scientific record schema.
export const domains=Object.entries({
 atomic_electronic:'electronic|electron_configuration|ground_state|ground_configuration|ground_level|ground_shell',
 ionisation_ladder:'ionisation|ionization',nuclear_isotopes_decay:'isotope|nuclide|isomer|half_life|decay|nubase',nuclear_q_values:'q_value|q_beta|q_alpha|decay_energy',
 nmr_nuclear_moments:'nmr|magnetic_moment|quadrupole|gyromagnetic',spectroscopy:'spectr|wavelength|raman|absorption_line|emission_line',
 crystal_polymorph_phase:'crystal|polymorph|allotrop|phase_diagram|space_group',lattice:'lattice|unit_cell|cell_parameter',density:'density',
 thermal:'thermal|heat_capacity|enthalpy|melting|boiling|heat_of',electrical:'electrical|resistivity|conductivity|band_gap',optical:'optical|refractive|dielectric|reflectiv',magnetic:'magnetic|magnetism|susceptibility|curie|neel',mechanical:'mechanical|elastic|modulus|hardness|strength|poisson',
 anisotropy:'anisotrop|direction_resolved',deformation_slip_twinning:'deformation|plasticity|slip|twinning',defects_dislocations:'defect|dislocation|vacancy|stacking_fault',
 surfaces_interfaces_corrosion:'surface|interface|passivation|corrosion|oxidation_layer',compounds_materials:'compound|carbide|oxide|hydride|nitride|material_famil',alloys_processing:'alloy|precipitation|heat_treatment|process_history|anneal|ageing',
 high_pressure_temperature:'high_pressure|high_temperature|compression|extreme_condition',superconductivity_quantum:'superconduct|quantum_hall|superfluid|topological',electrochemistry_batteries:'electrochem|battery|batteries|electrode|redox',geochemistry:'geochem|geolog|mineral|reservoir|crustal',biology_toxicology:'biolog|toxic|bioavailability|physiolog',
 astrophysics_nuclear_relationships:'astrophys|nucleosynth|stellar|cosmochem|chronometr|chronology',production_refining_recycling:'production|refining|recycling|extraction|smelting',
 relationships:'relationship|edges',people_lineage:'lineage|people|discoverer|intellectual',experiments:'experiment',tables:'table',graph_manifest:'graph',evidence_provenance:'provenance|source_id|evaluation',migration_audit:'migration',schema_validation:'schema_validation|validation_status',visual_specification:'visual_spec|visual_manifest|v01|v18'
}).map(([id,pattern])=>({id,pattern}));
export const nullTokens=new Set(['UNKNOWN','NOT-APPLICABLE','NOT_APPLICABLE','NOT APPLICABLE','UNAVAILABLE','NOT-AVAILABLE','NOT-MEASURED','NOT-ESTABLISHED','INSUFFICIENT DATA','PLANNED','PENDING','NONE YET']);
export function substantive(value){
 if(value===null||value===undefined)return false;
 if(typeof value==='string')return value.trim()!==''&&!nullTokens.has(value.trim().toUpperCase());
 if(typeof value==='number')return Number.isFinite(value);
 if(typeof value==='boolean')return false;
 if(Array.isArray(value))return value.some(substantive);
 if(Object.hasOwn(value,'value'))return substantive(value.value);
 return Object.entries(value).some(([k,v])=>!/(?:status|source|registry|schema|version|record_id|rule|interpretation|note|scope|path|snapshot|url)/i.test(k)&&substantive(v));
}

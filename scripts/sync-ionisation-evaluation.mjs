// Add a dated, independently reproducible source extraction without replacing authored science.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {parseIonisation} from './nist-ionisation.mjs';
import {energyEquivalents} from './energy-equivalents.mjs';
const root=join(import.meta.dirname,'..'),snapshot='data/catalog/sources/nist-asd-ionisation-2026-09-14.csv';
const bytes=readFileSync(join(root,snapshot)),rows=parseIonisation(bytes.toString('utf8'));
const metadata=JSON.parse(readFileSync(join(root,'data/catalog/sources/nist-asd-ionisation-2026-09-14.provenance.json'),'utf8'));
if(createHash('sha256').update(bytes).digest('hex')!==metadata.sha256)throw new Error('Snapshot hash mismatch');
const elements=JSON.parse(readFileSync(join(root,'data/catalog/elements-baseline.json'),'utf8')).elements;
const constants=YAML.parse(readFileSync(join(root,'data/constants/si-defining-constants.yaml'),'utf8'));
const marker='generated-by: sync-ionisation-evaluation.mjs';
const outputs=[];
function add(path,body){const absolute=join(root,path);if(existsSync(absolute)&&!readFileSync(absolute,'utf8').includes(marker))throw new Error('Refusing to replace authored file '+path);outputs.push({path,body});}
const index=[];
for(const e of elements){
 const entries=rows.filter(r=>r.z===e.z),stem=e.chapterPath.split('/')[1],folder='records/'+stem;
 if(entries.some(r=>r.spectrum.split(' ')[0]!==e.symbol))throw new Error('Element symbol mismatch '+e.matId);
 const missing=Array.from({length:e.z},(_,i)=>i).filter(q=>!entries.some(r=>r.charge===q));
 const dataPath=`${folder}/data/structured/${stem}-NIST-Ionisation-Evaluation.yaml`,chapter=`${folder}/${stem}-Ionisation-Evaluation.md`;
 const data={registry_id:e.matId+':REG:NIST-IONISATION',record_id:e.matId,schema_version:'1.0.0',record_version:'1.0.0',status:'RESEARCHED-IN-PROGRESS',evaluation:{...metadata,snapshot},
  interpretation:{scope:'Ground-state isolated atoms and positive atomic ions; not solid-state work functions, solution redox potentials, optical line wavelengths or isotope-resolved thresholds.',
   unbracketed:'Evaluated unbracketed ASD energy; no blanket claim of a direct measurement.',square_brackets:'Interpolation, extrapolation or semiempirical procedure relying on experimental values.',parentheses:'Ab initio or otherwise not derived from evaluated experimental data.',
   configuration:'Largest component of a calculated ground-level eigenvector; source notation and uncertainty of assignment retained.',uncertainty:'Exact displayed NIST eV uncertainty retained; no confidence level or missing uncertainty invented.',
   source_names:'NIST source element names are retained as provenance; the MAT parent name remains canonical, including Aluminium.',missing:'UNKNOWN means no row or numeric energy in this snapshot, not evidence that the quantity is inapplicable.'},
  coverage:{requested_charge_states:e.z,returned_charge_states:entries.length,numeric_energies:entries.filter(r=>r.ionisation_energy.value!==null).length,missing_charge_states:missing,status:entries.length?'PARTIAL':'INSUFFICIENT DATA'},
  calculations:{source_ids:['SRC-000005','SRC-000302'],constants:'data/constants/si-defining-constants.yaml',equations:['E_J = E_eV * e','f = E_J / h','lambda_vac = c / f'],scope:'Energy-equivalent frequency and vacuum wavelength, not emission lines, universal element frequencies or recoil-corrected photoionisation thresholds. Input theoretical and semiempirical status remains attached. Floating-point digits do not add precision.'},
  entries:entries.map(r=>({evaluation_entry_id:`${e.matId}:NIST-IONISATION:${r.charge}`,record_id:e.matId,...r,electron_count:e.z-r.charge,electron_count_equation:'N_e = Z - q',final_ion_charge:r.charge+1,source_id:'SRC-000005',source_locator:`${snapshot}#line=${r.source_line}`,energy_equivalents:energyEquivalents(r.ionisation_energy,constants.constants)}))};
 add(dataPath,'# '+marker+'\n'+YAML.stringify(data,{lineWidth:120}));
 const cell=v=>String(v).replaceAll('|','\\|').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const body=`# ${e.name} — Ground States and Ionisation Ladder\n\n<!-- ${marker} -->\n\nDated NIST ASD 5.12 extraction, retrieved 14 September 2026. ${entries.length} charge-state rows and ${data.coverage.numeric_energies} numeric ionisation energies are present. This is scoped reference coverage; the element remains under scientific review.\n\n- [Parent ${e.name} record](${stem}.md)\n- [Structured values and provenance](data/structured/${stem}-NIST-Ionisation-Evaluation.yaml)\n- [Retained source export](../../${snapshot}) · SRC-000005\n- [NIST definitions and qualifiers](https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html)\n\n## State and evidence semantics\n\nEach threshold removes one electron from an isolated ground-state atom or ion of charge q, producing charge q+1. Electron count is calculated as Z−q. This is not a bulk work function or electrochemical potential. Square brackets retain semiempirical estimates; parentheses retain theoretical values. Unbracketed values retain their evaluated status. Ground configurations describe dominant calculated components and may have uncertain assignments. NIST notation is preserved. Numeric uncertainty is transcribed in eV; unavailable uncertainty remains UNKNOWN. No confidence level, isotope assignment or extra precision is inferred.\n\n## Source table\n\n`+(entries.length?'| Spectrum | q | Ground configuration | Ground level | Energy / eV | Uncertainty / eV | Evidence | Source line |\n|---|---:|---|---|---|---|---|---:|\n'+entries.map(r=>`| ${cell(r.spectrum)} | ${r.charge} | ${cell(r.ground_configuration_raw)} | ${cell(r.ground_level_raw)} | ${cell(r.ionisation_energy.raw?r.ionisation_energy.prefix+r.ionisation_energy.raw+r.ionisation_energy.suffix:'UNKNOWN')} | ${r.ionisation_energy.uncertainty_raw||'UNKNOWN'} | ${r.ionisation_energy.value_status} | ${r.source_line} |`).join('\n'):'INSUFFICIENT DATA: no rows for this element were returned by the retained NIST query. No numerical placeholders have been created.')+`\n\n## Remaining gaps\n\nMissing charge-state rows: ${missing.length?missing.join(', '):'none in the requested 0 to Z−1 range'}. Blank energies, where present, remain UNKNOWN. The raw bibliography keys allow tracing entries within NIST; the underlying papers have not all received independent claim-level review here. Isotope shifts, excited-state thresholds, material properties and later literature remain separate work.\n`;
 const chart = data.coverage.numeric_energies ? `

## Ionisation ladder chart

![Discrete ground-state ionisation thresholds by initial charge, coloured by evidence status; logarithmic energy axis.](graphs/${stem}-GRAPH-NIST-Ionisation-Ladder.svg)

Generated from the structured evaluation above. Missing energies occupy a separate axis strip, not zero energy. Reported uncertainties are shown where valid on the logarithmic axis; missing uncertainties remain unknown. The source table retains exact notation and source-line locators.
` : '';
 add(chapter,body+chart+'\n## Calculated energy equivalents\n\nThe structured entries include f = E/h and the energy-equivalent vacuum wavelength λ = hc/E, converting eV to joules with the exact elementary charge. The [SI defining constants](../../data/constants/si-defining-constants.yaml) are registered as SRC-000302. Frequency uncertainty propagates linearly; wavelength uncertainty uses the first-order reciprocal derivative. Missing source uncertainty remains UNKNOWN. These are mathematical energy equivalents, not observed spectral lines, universal element frequencies or recoil-corrected photoionisation thresholds. Theoretical and semiempirical input status is retained; floating-point digits do not imply additional precision.\n');index.push({mat_id:e.matId,z:e.z,chapter,data:dataPath,...data.coverage});
}
// Check every target before any write, then write only owned outputs.
for(const {path,body}of outputs){mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),body);}
writeFileSync(join(root,'data/catalog/ionisation-evaluation-index.json'),JSON.stringify({generated_by:marker,source_id:'SRC-000005',snapshot,sha256:metadata.sha256,rows:rows.length,elements:index},null,2)+'\n');
console.log(JSON.stringify({elements:index.length,with_rows:index.filter(e=>e.returned_charge_states>0).length,rows:rows.length,numeric_energies:index.reduce((s,e)=>s+e.numeric_energies,0)}));

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {R,validateSchema} from './lib.mjs';
import {parseIonisation} from './nist-ionisation.mjs';
import {energyEquivalents} from './energy-equivalents.mjs';
const constants=YAML.parse(R('data/constants/si-defining-constants.yaml'));
assert.equal(constants.source_id,'SRC-000302');
assert.equal(constants.constants.speed_of_light.value,299792458);
assert.equal(constants.constants.Planck_constant.value,6.62607015e-34);
assert.equal(constants.constants.elementary_charge.value,1.602176634e-19);
const index=JSON.parse(R('data/catalog/ionisation-evaluation-index.json'));
const bytes=readFileSync(new URL('../'+index.snapshot,import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'),index.sha256);
const parsed=parseIonisation(bytes.toString('utf8')),sources=YAML.parse(R('data/registries/sources.yaml')).sources;
assert(sources.some(s=>s.source_id===index.source_id));
assert.equal(index.elements.length,118);const ids=new Set();let count=0;
for(let i=0;i<118;i++){
 const e=index.elements[i],z=i+1,mat='MAT:'+String(z).padStart(4,'0');assert.equal(e.z,z);assert.equal(e.mat_id,mat);
 assert(e.data.startsWith('records/'+String(z).padStart(4,'0')+'-'));
 const d=YAML.parse(R(e.data));assert.equal(d.record_id,mat);assert.equal(d.registry_id,mat+':REG:NIST-IONISATION');assert.equal(d.evaluation.sha256,index.sha256);assert.equal(d.evaluation.source_id,index.source_id);
 const expected=parsed.filter(r=>r.z===z);assert.equal(d.entries.length,expected.length);assert.equal(e.returned_charge_states,expected.length);
 for(let j=0;j<expected.length;j++){
  const row=d.entries[j],raw=expected[j];for(const [key,val]of Object.entries(raw))assert.deepEqual(row[key],val,e.data+' '+key);
  assert.equal(row.electron_count,z-row.charge);assert.equal(row.final_ion_charge,row.charge+1);
  assert.equal(row.source_locator,index.snapshot+'#line='+row.source_line);assert.equal(row.source_id,index.source_id);
  assert.equal(row.evaluation_entry_id,mat+':NIST-IONISATION:'+row.charge);assert(!ids.has(row.evaluation_entry_id));ids.add(row.evaluation_entry_id);
  assert.deepEqual(validateSchema('data/schema/1.0.0/mat-measurement.schema.json',row.ionisation_energy),[]);
  assert.deepEqual(row.energy_equivalents,energyEquivalents(raw.ionisation_energy,constants.constants));
  if(raw.ionisation_energy.value!==null)for(const m of [row.energy_equivalents.frequency,row.energy_equivalents.vacuum_wavelength])assert.deepEqual(validateSchema('data/schema/1.0.0/mat-measurement.schema.json',m),[]);
  count++;
 }
 const missing=Array.from({length:z},(_,q)=>q).filter(q=>!expected.some(r=>r.charge===q));assert.deepEqual(d.coverage.missing_charge_states,missing);assert.deepEqual(e.missing_charge_states,missing);
 assert.equal(d.coverage.numeric_energies,expected.filter(r=>r.ionisation_energy.value!==null).length);
 assert(R(e.chapter).includes('generated-by: sync-ionisation-evaluation.mjs'));
}
assert.equal(count,index.rows);console.log(`Ionisation: ${count} rows match retained source, units, qualifiers, nulls, IDs, electron counts, source locators and measurement schema; 118 packages checked.`);

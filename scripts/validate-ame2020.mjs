import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {R,root,validateSchema} from './lib.mjs';
import {join} from 'node:path';
import {parseAmeMass,parseAmeReactions,joinAmeTables,massSnapshot,reactionSnapshot,metricKeys} from './ame2020.mjs';
import {parseNubase} from './nubase.mjs';
const index=JSON.parse(R('data/catalog/ame2020-evaluation-index.json')),charts=JSON.parse(R('data/quality/ame2020-chart-manifest.json'));
const sha=b=>createHash('sha256').update(b).digest('hex'),sources=new Set(YAML.parse(R('data/registries/sources.yaml')).sources.map(s=>s.source_id));
for(const id of index.source_ids)assert(sources.has(id));
for(const s of index.snapshots)assert.equal(sha(readFileSync(join(root,s.path))),s.sha256);
const rows=joinAmeTables(parseAmeMass(R(massSnapshot)),parseAmeReactions(R(reactionSnapshot)));
const groundIds=new Set(parseNubase(R('data/catalog/sources/nubase_4.mas20.txt')).filter(r=>r.state_index===0&&r.Z>0).map(r=>`MAT:${String(r.Z).padStart(4,'0')}:NUBASE2020:${r.A}:0`));
assert.equal(index.elements.length,118);assert.equal(charts.elements.length,118);const ids=new Set();let count=0,numeric=0;
for(let z=1;z<=118;z++){
 const e=index.elements[z-1],d=YAML.parse(R(e.data)),expected=rows.filter(r=>r.Z===z),mat='MAT:'+String(z).padStart(4,'0');
 assert.equal(e.z,z);assert.equal(e.mat_id,mat);assert.equal(d.record_id,mat);assert.equal(d.registry_id,mat+':REG:AME2020');assert.equal(d.entries.length,expected.length);assert.equal(e.ground_states,expected.length);assert.deepEqual(d.evaluation.snapshots,index.snapshots);
 for(let i=0;i<expected.length;i++){
  const a=d.entries[i],b=expected[i];for(const [key,value]of Object.entries(b))assert.deepEqual(a[key],value,e.data+' '+key);
  assert.equal(a.evaluation_entry_id,`${mat}:AME2020:${a.A}:0`);assert(!ids.has(a.evaluation_entry_id));ids.add(a.evaluation_entry_id);
  assert.equal(a.nuclear_state_index,0);assert(groundIds.has(a.nubase_ground_state_ref));
  assert.equal(a.channel_references.beta_minus_daughter.A,a.A);assert.equal(a.channel_references.beta_minus_daughter.Z,z+1);
  assert.equal(a.channel_references.alpha_daughter.A,a.A-4);assert.equal(a.channel_references.alpha_daughter.Z,z-2);
  for(const c of ['beta_minus_daughter','alpha_daughter']){const ref=a.channel_references[c].nubase_ground_state_ref;if(ref)assert(groundIds.has(ref));}
  for(const key of metricKeys){assert.deepEqual(validateSchema('data/schema/1.0.0/mat-measurement.schema.json',a[key]),[]);if(a[key].value!==null)numeric++;}
  count++;
 }
 for(const key of metricKeys)assert.equal(e.numeric_by_metric[key],expected.filter(r=>r[key].value!==null).length);
 const chart=charts.elements.find(c=>c.record_id===mat);assert.equal(chart.chart,e.chart);assert.equal(chart.input,e.data);assert.equal(chart.input_sha256,sha(R(e.data).replace(/\r\n/g,'\n')));assert.equal(chart.sha256,sha(readFileSync(join(root,e.chart))));assert.equal(chart.numeric_points,e.numeric_by_metric.binding_energy_per_nucleon);
 assert(R(e.chapter).includes(e.chart.split('/').slice(2).join('/')));assert(R(e.chapter).includes('generated-by: sync-ame2020.mjs'));
}
assert.equal(count,index.chemical_element_ground_states);assert.equal(rows.length,index.ground_states_including_neutron);
console.log(`AME2020: ${count} ground-state nuclides, ${numeric} numeric quantities, 118 element packages and charts validated against retained tables.`);

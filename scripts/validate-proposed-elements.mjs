import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';import YAML from 'yaml';import {root,recordDirs,R,validateSchema} from './lib.mjs';import {domains} from './advanced-domains.mjs';import {systematicElement} from './proposed-elements.mjs';
const read=p=>JSON.parse(R(p)),index=read('data/catalog/proposed-elements-index.json'),scope=read('data/quality/element-scope-0000-0188.json'),profile=read('data/research/proposed-elements/state-flow-profile.json'),sources=new Set(YAML.parse(R('data/registries/sources.yaml')).sources.map(s=>s.source_id));
assert.equal(recordDirs().length,119);assert.equal(index.entries.length,70);assert.equal(scope.entries.length,188);assert.equal(scope.foundation.chemical_element,false);
const seen=new Set(),paths=new Set(),names=new Set(),symbols=new Set();
for(const i of scope.inputs)assert.equal(createHash('sha256').update(R(i.path)).digest('hex'),i.sha256,'Stale scope input '+i.path);
for(const [i,e] of index.entries.entries()){
 const z=i+119,d=read(e.path);assert.equal(e.z,z);assert.equal(d.atomic_number,z);assert.equal(d.entry_id,'MAT-PROPOSED:'+String(z).padStart(4,'0'));assert.deepEqual({name:d.name,symbol:d.symbol},systematicElement(z));
 assert.deepEqual(validateSchema('data/schema/1.0.0/mat-proposed-research.schema.json',d),[],e.path);
 for(const [set,value]of [[seen,d.entry_id],[paths,e.path],[names,d.name],[symbols,d.symbol]]){assert(!set.has(value));set.add(value);}
 assert.equal(d.recognition_status,'PROPOSED-NOT-RECOGNISED');assert.equal(d.fully_advanced,false);
 for(const source of d.source_ids)assert(sources.has(source));
 assert.deepEqual(Object.keys(d.domains).sort(),domains.map(x=>x.id).sort());assert.equal(d.state_flow.requirement_count,profile.requirements.length);
 assert.equal(d.identity.neutral_electron_count,z);
 for(const field of ['standard_atomic_weight','group','period','electron_configuration'])assert.equal(d.identity[field].value,null);
 assert.equal(d.visual_plan.panels.length,22);assert.equal(new Set(d.visual_plan.panels.map(p=>p.panel_id)).size,22);
 for(const p of d.visual_plan.panels){assert.equal(p.asset_path,null);assert.equal(p.status,'PENDING-SCIENTIFIC-SCOPE-AND-ASSET');}
 for(const domain of Object.values(d.domains)){assert.equal(domain.status,'UNKNOWN');assert.equal(domain.applicability,'INSUFFICIENT DATA');assert.deepEqual(domain.claims,[]);}
 assert(Object.values(d.research_layers).every(x=>Array.isArray(x)&&x.length===0),'Accepted predictions require a dedicated claim schema/review before changing the pending-only catalogue.');
 assert.deepEqual(d.state_flow.overrides,[]);
}
assert.equal(profile.requirements.length,read('data/quality/state-flow/index.json').requirements.length);
assert.deepEqual(scope.entries.map(e=>e.z),Array.from({length:188},(_,i)=>i+1));assert.equal(scope.summary.required_panels,4136);assert.equal(scope.summary.fully_advanced,0);
const advanced=read('data/quality/advanced-completion-matrix.json');
for(const e of scope.entries){
 assert(existsSync(join(root,e.path)));assert.equal(e.recognition_status,e.z<=118?'RECOGNISED':'PROPOSED-NOT-RECOGNISED');
 assert.deepEqual(Object.keys(e.domains).sort(),domains.map(d=>d.id).sort());
 for(const [id,d]of Object.entries(e.domains)){
  const original=e.z<=118?advanced.records.find(r=>r.mat_id===e.entry_id).domains[id]:read(e.path).domains[id];
  assert.equal(d.status,original.status);assert.equal(d.applicability,original.applicability);assert.equal(d.scientific_verification,'PENDING');
 }
}
console.log('Scope validated: 118 recognised + 70 pending proposed entries; 36 domains and 22 distinct panel requirements per proposed entry.');

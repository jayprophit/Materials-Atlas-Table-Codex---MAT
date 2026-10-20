import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {root,loadYaml,validateSchema} from '../lib.mjs';
import {loadReading,loadReadingComparison,projectReading,resolvePointer,checkFrequencyPeriod} from '../mat-reading.mjs';
const bindings=JSON.parse(readFileSync(join(root,'data/research/mat-dashboard-bindings.json'),'utf8')).bindings;
const owner=loadYaml(bindings[0].path),registry=loadYaml('data/registries/sources.yaml');
test('five source-bound readings preserve theoretical/measured/unknown distinctions and species',()=>{
 const result=bindings.map(b=>loadReading(b));
 result.forEach(r=>assert.deepEqual(validateSchema('data/schema/1.0.0/mat-reading-projection.schema.json',r),[]));
 assert.equal(result[0].evidence_type,'THEORETICAL');assert.equal(result[0].uncertainty,1.2e-11);
 assert.equal(result[1].evidence_type,'MEASURED');assert.equal(result[1].uncertainty,0.000018);
 assert.equal(result[2].evidence_type,'UNVERIFIED');assert.equal(result[2].uncertainty,null);assert.equal(result[2].derived_period.uncertainty,null);
 assert.equal(result[3].object_ref,'MAT:0001:MOL:H2');assert.equal(result[3].state.spin_composition,'EQUILIBRIUM-H2');
 assert.equal(result[2].value*result[2].derived_period.value,1);
});

test('canonical experiment state/evidence/uncertainty remain distinct from parent hyperfine summary',()=>{
 const binding=bindings.find(b=>b.binding_id==='hydrogen-hyperfine-1970');
 const experiment=loadYaml(binding.path),r=loadReading(binding);
 assert.equal(r.value,experiment.experiments[0].measured.frequency.value);assert.equal(r.uncertainty,0.002);assert.equal(r.evidence_type,'MEASURED');
 assert.equal(r.state.isotope,'1H');assert.match(r.provenance.source_url,/tf.nist.gov/);
 assert.equal(loadReading(bindings[2]).uncertainty,null);assert.equal(loadReading(bindings[2]).evidence_type,'UNVERIFIED');
 for(const change of [{experiment_id:'MAT:0001:EXP:OTHER'},{state:{...binding.state,isotope:'2H'}},{pointer:'/experiments/1/measured/electron_affinity'}])assert.throws(()=>projectReading({...binding,...change},experiment,registry,owner),/Experiment/);
 const view=loadReadingComparison();assert.equal(view.readings.length,5);assert.equal(view.relationships.find(r=>r.type==='FORMS-MOLECULE').target,'MAT:0001:MOL:H2');
 assert.equal(view.relationships.find(r=>r.type==='FORMS-MOLECULE').evidence,null);
});
test('changed identity, source, unit, species and atomic/molecular crossover are rejected',()=>{
 for(const change of [{owner:'MAT:0059'},{source_id:'SRC-000343'},{unit:'Hz'},{object_ref:'MAT:0001:MOL:H2'},{state:{species:'Pr'}}])assert.throws(()=>projectReading({...bindings[0],...change},owner,registry));
 assert.throws(()=>loadReading({...bindings[0],path:'../outside.yaml'}),/inside canonical records/);
});
test('missing data is rejected while a real zero and zero uncertainty remain explicit',()=>{
 const doc=structuredClone(owner);doc.ionization.first.value=null;
 assert.throws(()=>projectReading(bindings[0],doc,registry),/finite numeric/);
 doc.ionization.first.value=0;doc.ionization.first.uncertainty=0;
 const r=projectReading(bindings[0],doc,registry);assert.equal(r.value,0);assert.equal(r.uncertainty,0);assert.equal(r.uncertainty_status,'REPORTED-IN-OWNER');
 doc.ionization.first.uncertainty=-1;assert.throws(()=>projectReading(bindings[0],doc,registry),/uncertainty/);
});
test('an image or architecture reference cannot be substituted as a scientific source',()=>{
 const copy=structuredClone(registry);copy.sources.find(s=>s.source_id==='SRC-000005').source_type='USER-SUPPLIED-IMAGE-REFERENCE';
 assert.throws(()=>projectReading(bindings[0],owner,copy),/not a scientific value source/);
});
test('reciprocal-period diagnostics reject the reference-image pair without asserting physical validity',()=>{
 const check=checkFrequencyPeriod(6.579e15,1.519e-15);assert.equal(check.consistent,false);assert.ok(Math.abs(check.product-9.993501)<1e-9);
 assert.equal(checkFrequencyPeriod(10,0.1).consistent,true);assert.throws(()=>checkFrequencyPeriod(0,1));
 const doc=structuredClone(owner);doc.spectral.hyperfine_21cm.uncertainty=2;
 const r=projectReading(bindings[2],doc,registry);assert.equal(r.derived_period.uncertainty,2/r.value**2);
 assert.equal(r.derived_period.uncertainty_status,'FIRST-ORDER-PROPAGATED');
});
test('JSON pointer resolution decodes escaped tokens and rejects absent or inherited fields',()=>{
 assert.equal(resolvePointer({'a/b':{'~':4}},'/a~1b/~0'),4);
 assert.throws(()=>resolvePointer({},'/toString'));assert.throws(()=>resolvePointer({x:null},'/x/y'));
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {join,relative} from 'node:path';
import {root} from '../lib.mjs';
import {loadMaterialExample,materialOwnerPath,projectMaterial} from '../mat-material.mjs';
import {loadOwner,verifyOwner} from '../mat-universal-object.mjs';
import {adjustComposition,convertComposition} from '../mat-composition.mjs';
import {startServer} from '../mat-query-service.mjs';

const inputs=()=>{
  const {document,owner}=loadOwner(materialOwnerPath);
  const source=loadOwner('data/registries/sources.yaml').document.sources.find(s=>s.source_id===document.source_id);
  const catalogue=loadOwner('data/catalog/elements-baseline.json').document.elements;
  return {document,owner,source,catalogue};
};
const withOwner=(document,pointer,run)=>{
  const output=join(root,'output');mkdirSync(output,{recursive:true});
  const dir=mkdtempSync(join(output,'mat-material-test-'));
  try{
    const path=relative(root,join(dir,'owner.json')).replaceAll('\\','/');
    writeFileSync(join(root,path),JSON.stringify(pointer?{'materials/list':{'candidate~1':document}}:document));
    const loaded=loadOwner(path,pointer);
    run(loaded.document,loaded.owner);
  }finally{rmSync(dir,{recursive:true,force:true});}
};
test('real certified alloy retains partial composition and separate source statuses/uncertainty',()=>{
  const m=loadMaterialExample(),o=m.object;
  assert.equal(verifyOwner(o),true);assert.equal(o.object_ref,'MAT:0026:MATERIAL:NIST-SRM-126c');assert.equal(o.atomic_number,null);
  assert.equal(o.composition.coverage,'PARTIAL');assert.equal(o.readings.length,11);
  assert.equal(o.readings.filter(r=>r.source_value_status==='CERTIFIED').length,4);
  assert.equal(o.readings.filter(r=>r.source_value_status==='REFERENCE').length,6);
  assert.equal(o.readings.find(r=>r.component_ref==='MAT:0028').value,36.054);
  assert.equal(o.readings.find(r=>r.component_ref==='MAT:0028').uncertainty,0.029);
  assert.equal(o.readings.find(r=>r.component_ref==='MAT:0028').uncertainty_context.coverage_factor,2.8);
  assert.equal(o.readings.at(-1).source_value_status,'INFORMATION');assert.equal(o.readings.at(-1).uncertainty,null);
  assert.ok(Math.abs(m.composition_summary.sum_fraction-0.36872)<1e-12);
  assert.equal(m.composition_summary.unassigned_identity,'UNKNOWN');assert.equal(m.composition_summary.combined_uncertainty,null);
  assert.ok(!o.composition.components.some(c=>c.object_ref==='MAT:0026'));
  assert.throws(()=>adjustComposition(o.composition,{'MAT:0028':37}),/complete composition/);
  assert.throws(()=>convertComposition(o.composition,'at%'),/Cross-basis/);
});
test('reported process steps resolve their owner pointers, states and approximate parameters',()=>{
  const m=loadMaterialExample(),steps=m.object.process_genome;
  assert.equal(steps.length,4);assert.match(steps[0].process_ref,/VACUUM-MELT$/);assert.match(steps.at(-1).process_ref,/LATHE$/);
  for(const s of steps){const p=s.provenance[0];assert.equal(loadOwner(p.path,p.pointer).document.process_id,s.process_ref);}
  assert.equal(steps[2].parameters[0].value,130);assert.equal(steps[2].parameters[0].qualifier,'APPROXIMATE');assert.equal(steps[2].parameters[0].uncertainty,null);
  assert.equal(m.applicability.process_temperature,null);assert.equal(m.applicability.phase_fractions,null);
  assert.equal(m.applicability.minimum_recommended_analytical_sample.value,200);
});
test('source/version/method/process and metrology drift fail closed',()=>{
  for(const [mutate,error] of [
    [x=>x.document.certificate_issue='2026-10-03',/identity or version/],
    [x=>x.source.sha256='0'.repeat(64),/Stale scientific source snapshot/],
    [x=>x.document.composition.components[0].object_ref='MAT:9999',/Unresolved constituent/],
    [x=>x.document.composition.components[0].analytical_method_codes=[999],/Unresolved analytical method/],
    [x=>x.document.composition.components.at(-1).uncertainty=0,/uncertainty classification/],
    [x=>x.document.process_history[1].input_state_refs=['missing'],/Unresolved process state/],
    [x=>x.document.process_history.reverse(),/Disconnected process history/],
    [x=>x.document.composition.components[0].unmodelled_uncertainty=1,/Unmodelled component metadata/],
    [x=>x.document.composition.coverage='COMPLETE',/partial mass-fraction metrology/]
  ]){
    const x=inputs();mutate(x);
    withOwner(x.document,'',(document,owner)=>assert.throws(()=>projectMaterial(document,owner,x.source,x.catalogue),error));
  }
});
test('material projection rejects stale, misdirected or changed owner content',()=>{
  const x=inputs();
  assert.throws(()=>projectMaterial(x.document,{...x.owner,sha256:'0'.repeat(64)},x.source,x.catalogue),/Stale material owner hash/);
  assert.throws(()=>projectMaterial(x.document,{...x.owner,pointer:'/composition'},x.source,x.catalogue),/does not match its owner/);
  const changed=structuredClone(x.document);changed.composition.components[0].value+=1;
  assert.throws(()=>projectMaterial(changed,x.owner,x.source,x.catalogue),/does not match its owner/);
});
test('nested material owner retains resolvable full reading and process pointers',()=>{
  const x=inputs(),pointer='/materials~1list/candidate~01';
  withOwner(x.document,pointer,(document,owner)=>{
    const {object}=projectMaterial(document,owner,x.source,x.catalogue);
    assert.equal(verifyOwner(object),true);
    for(const reading of object.readings){
      const p=reading.provenance[0];assert.ok(p.pointer.startsWith(pointer+'/composition/components/'));
      const row=loadOwner(p.path,p.pointer).document;
      assert.equal(row.object_ref,reading.component_ref);assert.equal(row.value,reading.value);assert.equal(row.uncertainty,reading.uncertainty);
    }
    for(const process of object.process_genome){
      const p=process.provenance[0];assert.equal(loadOwner(p.path,p.pointer).document.process_id,process.process_ref);
      for(const parameter of process.parameters){const q=parameter.provenance[0];assert.equal(loadOwner(q.path,q.pointer).document.value,parameter.value);}
    }
  });
});
test('certificate adapter refuses property fields instead of silently omitting them',()=>{
  const x=inputs();
  for(const key of ['properties','readings']){
    const extended={...x.document,[key]:[{metric:'fracture_toughness',value:null,uncertainty:null}]};
    withOwner(extended,'',(document,owner)=>assert.throws(()=>projectMaterial(document,owner,x.source,x.catalogue),/reviewed property adapter/));
  }
});
test('material data round trip uses the existing read-only query service',async()=>{
  const server=await startServer({port:0});
  try{const response=await fetch('http://127.0.0.1:'+server.address().port+'/materials');assert.equal(response.status,200);
    const {materials}=await response.json();assert.equal(materials[0].object.readings.length,11);assert.equal(materials[0].object.process_genome.length,4);
    assert.equal(materials[0].source.source_id,'SRC-000346');assert.match(materials[0].source.url,/nist.gov/);
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

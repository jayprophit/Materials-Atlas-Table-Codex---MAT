import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,dirname,resolve,sep} from 'node:path';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import YAML from 'yaml';
import {root} from '../lib.mjs';
import {loadNeutralHydrogen,atomicOwnerPath,atomicBindingPath,atomicSourcePaths} from '../mat-atomic.mjs';
import {buildUniversalObjects,loadOwner,verifyOwner,hash,validateObject} from '../mat-universal-object.mjs';
import {loadReadingComparison} from '../mat-reading.mjs';
import {loadMaterialExample} from '../mat-material.mjs';
import {startServer} from '../mat-query-service.mjs';

function fixture(run){
  const output=resolve(root,'output');mkdirSync(output,{recursive:true});
  const dir=mkdtempSync(join(output,'mat-atomic-test-'));
  assert(dir.startsWith(output+sep));
  try{
    for(const path of [atomicOwnerPath,atomicBindingPath,'data/registries/sources.yaml',...Object.values(atomicSourcePaths)]){
      const dst=join(dir,path);mkdirSync(dirname(dst),{recursive:true});writeFileSync(dst,readFileSync(join(root,path)));
    }
    const change=(path,mutate)=>{
      const file=join(dir,path),json=path.endsWith('.json'),doc=json?JSON.parse(readFileSync(file)):YAML.parse(readFileSync(file,'utf8'));
      mutate(doc);writeFileSync(file,json?JSON.stringify(doc):YAML.stringify(doc));
    };
    run({dir,change});
  }finally{assert(resolve(dir).startsWith(output+sep));rmSync(dir,{recursive:true,force:true});}
}

test('existing neutral H bridges the same source reading with unresolved full state',()=>{
  const a=loadNeutralHydrogen(),r=a.object.readings[0];
  assert.equal(a.object.object_ref,'MAT:0001:ATOM:H');assert.equal(a.object.object_class,'ATOM');assert.equal(a.object.atomic_number,null);
  assert.equal(a.object.owner.pointer,'/charge_states/1');assert.equal(verifyOwner(a.object),true);
  assert.deepEqual(a.binding_reading,loadReadingComparison().readings[0]);
  assert.equal(r.value,13.598434599702);assert.equal(r.unit,'eV');assert.equal(r.uncertainty,1.2e-11);assert.equal(r.evidence_type,'THEORETICAL');
  assert.equal(a.object.state.status,'UNRESOLVED');assert.equal(a.object.state.state_ref,null);
  assert.equal(r.state_ref,atomicOwnerPath+'#/electronic_ground_state');assert.equal(a.state_context.reading_state_reference_kind,'EXISTING-OWNER-LOCATOR; NOT-A-STATE-IDENTITY');
  assert.deepEqual(loadOwner(atomicOwnerPath,'/electronic_ground_state').document,{configuration:'1s1',term:'2S1/2'});
  for(const k of ['isotope','temperature','pressure','confidence_level','coverage_factor'])assert.equal(a.state_context[k],null,k);
  assert.equal(a.state_context.legacy_owner_confidence_label,'A');assert.equal(Object.hasOwn(r,'uncertainty_context'),false);
  assert.equal(r.reference_frame_ref,null);assert.equal(r.validity,null);
  assert.equal(a.source.source_row.source_line,2);assert.equal(a.source.source_row.charge,0);assert.equal(a.source.source_row.spectrum,'H I');
  assert.equal(a.source.source_row.ionisation_energy.raw,'13.598434599702');assert.equal(a.source.source_row.ionisation_energy.uncertainty_raw,'0.000000000012');
  assert.deepEqual(a.source.bibliography_keys,['HDEL']);assert.equal(a.source.rights_status,'UNKNOWN');assert.equal(a.source.rights_admitted,false);
  assert.match(a.acceptance,/INDEPENDENT-SCIENTIFIC-REVIEW-PENDING/);assert.match(a.source.underlying_work_review,/REQUIRES-CLAIM-LEVEL-REVIEW/);
  for(const p of r.provenance)assert.equal(hash(readFileSync(join(root,p.path))),p.sha256,p.path);
});

test('the generic catalogue adds one existing atom with empty readings and preserves H2',()=>{
  const objects=buildUniversalObjects();assert.equal(objects.length,192);
  const a=objects.find(o=>o.object_ref==='MAT:0001:ATOM:H');assert.deepEqual(a.readings,[]);assert.equal(a.state.state_ref,null);assert.equal(verifyOwner(a),true);
  assert.equal(objects.find(o=>o.object_ref==='MAT:0001:MOL:H2').object_class,'MOLECULE');
  assert.equal(objects.find(o=>o.object_ref==='MAT:0001').object_class,'CHEMICAL_ELEMENT');
  assert.equal(objects.find(o=>o.object_ref==='MAT:0000').object_class,'FOUNDATION_REFERENCE');
  assert(objects.every(o=>o.readings.length===0));
  assert.throws(()=>validateObject({...a,object_ref:'MAT:0001:MOL:H2'}),/atomic child namespace/);
  assert.throws(()=>verifyOwner({...a,owner:{...a.owner,sha256:'0'.repeat(64)}}),/Stale owner hash/);
  assert.throws(()=>verifyOwner({...a,owner:{...a.owner,pointer:'/charge_states/0'}}),/Unresolved canonical/);
});

test('persisted atomic owner species, charge, ground state and H2 crossover fail closed',()=>{
  const cases=[
    [d=>d.mat_id='MAT:0002',/owner\/species\/charge/],
    [d=>d.symbol='He',/owner\/species\/charge/],
    [d=>d.atomic_number=2,/owner\/species\/charge/],
    [d=>d.charge_states[1].charge=1,/owner\/species\/charge/],
    [d=>d.charge_states[1].id='MAT:0001:MOL:H2',/owner\/species\/charge/],
    [d=>d.electronic_ground_state.configuration='2s1',/ground-state owner/]
  ];
  for(const [mutate,error] of cases)fixture(({dir,change})=>{change(atomicOwnerPath,mutate);assert.throws(()=>loadNeutralHydrogen(dir),error);});
});

test('persisted binding pointer, unit, source, species, charge and unsupported state changes fail closed',()=>{
  const cases=[
    [b=>b.pointer='/electron_affinity/recommended_measurement',/binding or pointer/],
    [b=>b.unit='J',/binding or pointer/],
    [b=>b.source_id='SRC-000007',/binding or pointer/],
    [b=>b.path='../owner.yaml',/binding or pointer/],
    [b=>b.object_ref='MAT:0001:MOL:H2',/binding or pointer/],
    [b=>b.state.species='H2',/species\/charge\/state/],
    [b=>b.state.charge=1,/species\/charge\/state/],
    [b=>b.state.isotope='1H',/species\/charge\/state/],
    [b=>b.conditions.temperature=298.15,/species\/charge\/state/],
    [b=>b.derive_period=true,/binding or pointer/]
  ];
  for(const [mutate,error] of cases)fixture(({dir,change})=>{change(atomicBindingPath,d=>mutate(d.bindings[0]));assert.throws(()=>loadNeutralHydrogen(dir),error);});
});

test('persisted metric value, uncertainty, evidence, units and locators must match source row',()=>{
  const cases=[m=>m.value+=1,m=>m.uncertainty=0,m=>m.uncertainty=null,m=>m.evidence_type='MEASURED',m=>m.value_status='EVALUATED',m=>m.unit='J',m=>m.source_locator=atomicSourcePaths.csv+'#line=3'];
  for(const mutate of cases)fixture(({dir,change})=>{change(atomicOwnerPath,d=>mutate(d.ionization.first));assert.throws(()=>loadNeutralHydrogen(dir),/value\/uncertainty\/evidence\/source-locator/);});
  fixture(({dir,change})=>{change(atomicOwnerPath,d=>d.ionization.first.source_id='SRC-000007');assert.throws(()=>loadNeutralHydrogen(dir),/Unresolved or changed metric source/);});
});

test('registry version/type drift and changed retained source/provenance/help snapshots fail closed',()=>{
  for(const mutate of [s=>s.version='5.13',s=>s.source_type='USER-SUPPLIED-IMAGE',s=>s.doi='10.0000/wrong',s=>s.url='https://example.invalid',s=>s.dated_extractions[0].snapshot=atomicSourcePaths.help])fixture(({dir,change})=>{
    change('data/registries/sources.yaml',d=>mutate(d.sources.find(s=>s.source_id==='SRC-000005')));
    assert.throws(()=>loadNeutralHydrogen(dir),/source identity\/version\/type/);
  });
  for(const [key,path] of Object.entries(atomicSourcePaths))fixture(({dir})=>{
    const file=join(dir,path);writeFileSync(file,Buffer.concat([readFileSync(file),Buffer.from('\n')]));
    assert.throws(()=>loadNeutralHydrogen(dir),new RegExp('Changed reviewed atomic '+key+' snapshot'));
  });
});

test('duplicate source IDs and altered scientific acceptance notes are refused',()=>{
  fixture(({dir,change})=>{
    change('data/registries/sources.yaml',d=>d.sources.push({...d.sources.find(s=>s.source_id==='SRC-000005'),version:'contradictory'}));
    assert.throws(()=>loadNeutralHydrogen(dir),/source ID must be unique/);
  });
  for(const limitations of [null,[],['Independently accepted measured value with cleared redistribution rights.']])fixture(({dir,change})=>{
    change(atomicBindingPath,d=>d.bindings[0].limitations=limitations);
    assert.throws(()=>loadNeutralHydrogen(dir),/binding limitations changed/);
  });
});

test('an owner edit between parent and child reads cannot mix provenance versions',()=>{
  fixture(({dir})=>{
    const file=join(dir,atomicOwnerPath),original=fs.readFileSync;let changed=false;
    try{
      fs.readFileSync=function(path,...args){
        const bytes=original.call(this,path,...args);
        if(resolve(String(path))===resolve(file)&&!changed){
          changed=true;const doc=YAML.parse(bytes.toString());doc.ionization.first.value+=1;
          writeFileSync(file,YAML.stringify(doc));
        }
        return bytes;
      };
      syncBuiltinESMExports();
      assert.throws(()=>loadNeutralHydrogen(dir),/owner changed between parent and child reads/);
      assert.equal(changed,true);
    }finally{fs.readFileSync=original;syncBuiltinESMExports();}
  });
});

test('read-only atom API preserves existing reading and material API payloads',async()=>{
  const server=await startServer({port:0});
  try{
    const url='http://127.0.0.1:'+server.address().port;
    for(const [route,expected] of [['atoms',{atoms:[loadNeutralHydrogen()]}],['readings',loadReadingComparison()],['materials',{materials:[loadMaterialExample()]}]]){
      const response=await fetch(url+'/'+route);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/application\/json/);assert.deepEqual(await response.json(),expected);
    }
    const denied=await fetch(url+'/atoms',{method:'POST',body:'{}'});assert.equal(denied.status,405);assert.deepEqual(await denied.json(),{error:'read-only service'});
  }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

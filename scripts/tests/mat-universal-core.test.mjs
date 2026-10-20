import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {root} from '../lib.mjs';
import {buildUniversalObjects,canonicalIdentity,projectObject,validateObject,verifyOwner} from '../mat-universal-object.mjs';
import {validateComposition,convertComposition,adjustComposition} from '../mat-composition.mjs';

const composition=()=>({unit:'wt%',basis:'MASS',constraint:'VARIABLE',coverage:'COMPLETE',components:[{object_ref:'test:Fe',value:97.8},{object_ref:'test:C',value:0.6},{object_ref:'test:Cr',value:1},{object_ref:'test:Ni',value:0.6}]});
const owner={path:'test-fixture.json',pointer:'',sha256:'0'.repeat(64)};
const synthetic=(overrides={})=>projectObject({object_ref:'MAT:0001:MATERIAL:TEST',object_class:'MATERIAL',recognition:'NOT-AN-ELEMENT',owner,...overrides});
const sourceReading=()=>({metric:'composition.mass_fraction',value:1,null_state:null,unit:'wt%',uncertainty:0.1,evidence_type:'EVALUATED',provenance:[owner],state_ref:'test:state',reference_frame_ref:null,validity:null,component_ref:'MAT:0006',source_value_status:'CERTIFIED',uncertainty_context:{kind:'EXPANDED',confidence_level:0.95,coverage_factor:null}});

test('material, process and sample identity aliases resolve without treating parent or registry IDs as aliases',()=>{
 for(const alias of ['material_id','process_id','sample_id']){
  const id='MAT:0026:MATERIAL:TEST';
  assert.equal(canonicalIdentity({[alias]:id,parent_id:'MAT:0026',registry_id:'MAT:0026:REG:TEST'}),id);
  assert.equal(canonicalIdentity({[alias]:id,id}),id);
  assert.throws(()=>canonicalIdentity({[alias]:id,id:'MAT:0026:MATERIAL:OTHER'}),/conflicting/);
 }
 assert.throws(()=>canonicalIdentity({parent_id:'MAT:0026',registry_id:'MAT:0026:REG:TEST'}),/Missing/);
 assert.throws(()=>canonicalIdentity({material_id:'MAT:0026:MATERIAL:TEST',sample_id:'MAT:0026:SAMPLE:TEST'}),/conflicting/);
});

test('source-valued component readings preserve certificate classifications and expanded uncertainty context',()=>{
 const o=synthetic();
 for(const source_value_status of ['CERTIFIED','REFERENCE']){
  o.readings=[{...sourceReading(),source_value_status}];
  assert.equal(validateObject(o).readings[0].source_value_status,source_value_status);
  assert.equal(o.readings[0].uncertainty_context.coverage_factor,null);
 }
 const information={...sourceReading(),source_value_status:'INFORMATION',uncertainty:null};
 delete information.uncertainty_context;
 o.readings=[information];assert.equal(validateObject(o).readings[0].uncertainty,null);
 const geometry={metric:'geometry.length',value:1,null_state:null,unit:'m',uncertainty:null,evidence_type:'UNVERIFIED',provenance:[owner],state_ref:'test:state',reference_frame_ref:null,validity:null};
 for(const qualifier of [null,'APPROXIMATE','RECOMMENDED']){
  o.process_genome=[{process_ref:'test:shape',input_state_refs:['test:feed'],output_state_refs:['test:shaped'],parameters:[{...geometry,qualifier}],provenance:[owner]}];
  assert.equal(validateObject(o).process_genome[0].parameters[0].qualifier,qualifier);
 }
});

test('source component uncertainty metadata fails closed without changing pure composition arithmetic',()=>{
 const check=reading=>validateObject({...synthetic(),readings:[reading]});
 const missingComponent=sourceReading();delete missingComponent.component_ref;
 assert.throws(()=>check(missingComponent),/component reference/);
 assert.throws(()=>check({...sourceReading(),component_ref:'test:C'}));
 assert.throws(()=>check({...sourceReading(),evidence_type:'MEASURED'}),/evaluated evidence/);
 const missingContext=sourceReading();delete missingContext.uncertainty_context;
 assert.throws(()=>check(missingContext),/expanded uncertainty context/);
 assert.throws(()=>check({...sourceReading(),source_value_status:'INFORMATION'}),/unknown uncertainty/);
 for(const confidence_level of [-0.1,1.1,NaN,Infinity])assert.throws(()=>check({...sourceReading(),uncertainty_context:{...sourceReading().uncertainty_context,confidence_level}}));
 for(const coverage_factor of [0,-1,NaN,Infinity])assert.throws(()=>check({...sourceReading(),uncertainty_context:{...sourceReading().uncertainty_context,coverage_factor}}));
 assert.throws(()=>check({...sourceReading(),source_value_status:'MEASURED'}));
 assert.throws(()=>check({...sourceReading(),qualifier:'EXACT'}));
 const c=composition();c.components[0].source_value_status='CERTIFIED';
 assert.throws(()=>adjustComposition(c,{'test:C':1},{remainder_ref:'test:Fe'}),/unmodelled/);
 assert.deepEqual(adjustComposition(composition(),{'test:C':1},{remainder_ref:'test:Fe'}).property_predictions,[]);
});

test('every existing identity inherits one contract, with no accepted numeric readings generated',()=>{
  const objects=buildUniversalObjects();
  assert.equal(objects.filter(o=>o.recognition==='FOUNDATION').length,1);
  const recognised=objects.filter(o=>o.recognition==='RECOGNISED');
  assert.equal(recognised.length,118);
  for(let z=1;z<=118;z++)assert.equal(recognised.find(o=>o.object_ref==='MAT:'+String(z).padStart(4,'0')).atomic_number,z);
  const index=JSON.parse(readFileSync(join(root,'data/catalog/proposed-elements-index.json'),'utf8'));
  assert.equal(objects.filter(o=>o.recognition==='PROPOSED-NOT-RECOGNISED').length,index.entries.length);
  assert.equal(objects.find(o=>o.object_ref==='MAT:0001:MOL:H2').object_class,'MOLECULE');
  for(const o of objects){assert.equal(verifyOwner(o),true);assert.deepEqual(o.readings,[]);assert.equal(o.layers.MAT_FINGERPRINT,'NOT-COMPUTED');}
});

test('candidate identity has no 118/188 ceiling; candidate recognition cannot silently become confirmed',()=>{
  for(const z of [119,189,10000]){
    const id='MAT-PROPOSED:'+String(z).padStart(4,'0');
    const o=synthetic({object_ref:id,object_class:'CHEMICAL_ELEMENT',recognition:'PROPOSED-NOT-RECOGNISED',atomic_number:z});
    assert.equal(o.atomic_number,z);
    assert.throws(()=>validateObject({...o,recognition:'RECOGNISED'}),/mismatch/);
  }
  assert.throws(()=>synthetic({object_ref:'MAT:0000',object_class:'CHEMICAL_ELEMENT',recognition:'RECOGNISED',atomic_number:0}));
  assert.throws(()=>synthetic({object_ref:'MAT:0001'}),/child identifiers/);
  assert.throws(()=>synthetic({object_ref:'MAT:0119',object_class:'CHEMICAL_ELEMENT',recognition:'RECOGNISED',atomic_number:119}),/recognised catalogue/);
});

test('owner hashes and canonical references prevent silent projection drift',()=>{
  const o=buildUniversalObjects()[1];
  assert.throws(()=>verifyOwner({...o,owner:{...o.owner,sha256:'f'.repeat(64)}}),/Stale owner/);
  assert.throws(()=>verifyOwner({...o,object_ref:'MAT:0050',atomic_number:50}),/Unresolved canonical/);
  assert.throws(()=>verifyOwner({...o,owner:{...o.owner,path:'../outside.yaml'}}),/inside repository/);
});

test('typed metrics retain evidence lanes, real zero, unknown uncertainty and frame requirements',()=>{
  const o=synthetic();
  const r={metric:'density',value:0,null_state:null,unit:'kg/m3',uncertainty:null,evidence_type:'CALCULATED',provenance:[owner],state_ref:'test:state',reference_frame_ref:null,validity:null};
  o.readings=[r];assert.equal(validateObject(o).readings[0].value,0);
  for(const lane of ['MEASURED','CALCULATED','SIMULATED','THEORETICAL','PREDICTED','HISTORICAL','PHILOSOPHICAL','RELIGIOUS-TRADITIONAL','SPECULATIVE','DISPUTED','FALSIFIED','FICTIONAL','AUTHOR-FRAMEWORK']){
    r.evidence_type=lane;assert.equal(validateObject(o).readings[0].evidence_type,lane);
  }
  r.value=null;assert.throws(()=>validateObject(o),/null states/);r.null_state='UNKNOWN';r.evidence_type='UNVERIFIED';validateObject(o);
  r.evidence_type='MEASURED';assert.throws(()=>validateObject(o),/Missing data/);
  r.value=0;r.null_state=null;r.metric='time_dilation';assert.throws(()=>validateObject(o),/reference frame/);
  r.reference_frame_ref='test:frame';validateObject(o);
  r.value=Infinity;assert.throws(()=>validateObject(o));
});

test('all eight representations require explicit basis and preserve complete/partial semantics',()=>{
  const units={'wt%':['MASS',100],'at%':['ATOM_COUNT',100],'mol%':['AMOUNT',100],'vol%':['VOLUME',100],ppm:['MASS',1e6],ppb:['MASS',1e9],phase_fraction:['VOLUME',1],isotope_fraction:['ATOM_COUNT',1]};
  for(const [unit,[basis,scale]]of Object.entries(units)){
    const c={...composition(),unit,basis,components:[{object_ref:'test:A',value:scale/4},{object_ref:'test:B',value:scale*3/4}]};
    assert.equal(validateComposition(c).sum_fraction,1);
    c.components.pop();assert.throws(()=>validateComposition(c),/balance/);
    c.coverage='PARTIAL';assert.equal(validateComposition(c).unassigned_fraction,0.75);
  }
  assert.throws(()=>validateComposition({...composition(),unit:'ppm',basis:undefined}),/basis/);
});

test('unit scaling does not convert between mass, atom, amount, volume or population bases',()=>{
  const c=composition(),ppm=convertComposition(c,'ppm');
  assert.equal(ppm.components[1].value,6000);
  assert.ok(Math.abs(convertComposition(ppm,'wt%').components[0].value-97.8)<1e-12);
  assert.throws(()=>convertComposition(c,'at%'),/Cross-basis/);
  assert.throws(()=>convertComposition(c,'phase_fraction'),/population/);
  assert.throws(()=>convertComposition(c,'toString'),/Unsupported/);
});

test('multi-component remainder adjustment balances and preserves original input with no predictions',()=>{
  const c=composition(),before=structuredClone(c);
  const r=adjustComposition(c,{'test:C':0.8,'test:Cr':2,'test:Ni':1.2},{remainder_ref:'test:Fe'});
  assert.equal(r.composition.components[0].value,96);
  assert.deepEqual(c,before);assert.deepEqual(r.property_predictions,[]);assert.equal(r.evidence_type,'CALCULATED');
  assert.throws(()=>adjustComposition(c,{'test:C':100},{remainder_ref:'test:Fe'}));
  assert.throws(()=>adjustComposition(c,{'test:absent':1},{remainder_ref:'test:Fe'}),/Unknown component/);
});

test('ratio lock preserves unchanged ratios; free mode only accepts balanced supplied candidates',()=>{
  const c=composition();
  const r=adjustComposition(c,{'test:C':1},{mode:'LOCK_RATIO'}).composition;
  assert.ok(Math.abs(r.components[0].value/r.components[2].value-97.8)<1e-10);
  assert.ok(Math.abs(validateComposition(r).sum_fraction-1)<1e-12);
  assert.throws(()=>adjustComposition(c,{'test:C':1},{mode:'FREE_OPTIMISATION'}),/balance/);
  assert.equal(adjustComposition(c,{'test:C':1,'test:Fe':97.4},{mode:'FREE_OPTIMISATION'}).property_predictions.length,0);
});

test('bad totals, negative/nonfinite values, duplicate species and fixed stoichiometry fail closed',()=>{
  for(const bad of [-1,NaN,Infinity,null,'5',101]){const c=composition();c.components[0].value=bad;assert.throws(()=>validateComposition(c));}
  const c=composition();c.components[1].object_ref=c.components[0].object_ref;assert.throws(()=>validateComposition(c),/Unique/);
  assert.throws(()=>adjustComposition({...composition(),constraint:'FIXED_STOICHIOMETRIC'},{'test:C':1},{remainder_ref:'test:Fe'}),/Fixed stoichiometry/);
  assert.throws(()=>adjustComposition(composition(),{'test:C':NaN},{remainder_ref:'test:Fe'}));
  const uncertain=composition();uncertain.components[0].uncertainty=0.1;
  assert.throws(()=>adjustComposition(uncertain,{'test:C':1},{remainder_ref:'test:Fe'}),/unmodelled/);
  assert.throws(()=>validateComposition({...composition(),evidence_type:'MEASURED'}),/metadata/);
});

test('same material contract carries ordered process references and explicit outputs without proving recycling',()=>{
  const o=synthetic();o.composition=composition();
  o.process_genome=[{process_ref:'test:mix',input_state_refs:['test:feed'],output_state_refs:['test:mixed'],parameters:[],provenance:[owner]}];
  o.links=[{relation:'BY_PRODUCT',target_ref:'test:residual',evidence_refs:[]}];
  assert.equal(validateObject(o).links[0].relation,'BY_PRODUCT');
  o.composition.components[0].value=1;assert.throws(()=>validateObject(o),/balance/);
});

test('alloys, biological objects, natural processes and cosmic material reuse the state/evidence contract',()=>{
  for(const [object_class,scale]of [['ALLOY','MACRO'],['BIOLOGICAL_SYSTEM','MICRO'],['PROCESS','PLANETARY'],['MATERIAL','COSMOLOGICAL']]){
    const o=synthetic({object_ref:'MAT:0000:MODEL:TEST-'+object_class,object_class});
    o.state.scale=scale;assert.equal(validateObject(o).state.scale,scale);
    assert.deepEqual(o.readings,[]);assert.equal(o.atomic_number,null);
  }
});

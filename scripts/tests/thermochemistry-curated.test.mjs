import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import Ajv from 'ajv';
import {syncThermochemistry} from '../sync-thermochemistry.mjs';
import {validateThermochemistryContext,validateThermochemistryReviewNotes} from '../thermochemistry-context.mjs';
import {shomate} from '../thermochemistry.mjs';
import {publisherTemperatureBasis} from '../thermochemistry-publisher-temperature.mjs';

const root=path.resolve(import.meta.dirname,'../..'),stem='0001-Hydrogen-H',folder='records/'+stem;
const identityPath=`${folder}/data/structured/${stem}.yaml`,mainPath=`${folder}/${stem}.md`;
const tableManifest=`${folder}/data/structured/${stem}-Table-Manifest.yaml`,graphManifest=`${folder}/data/structured/${stem}-Graph-Manifest.yaml`;
const authoredPaths=[identityPath,mainPath,tableManifest,graphManifest];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const readOriginal=file=>fs.readFileSync(path.join(root,file));
const validateSchema=new Ajv({allErrors:true}).compile(JSON.parse(readOriginal('data/schema/1.0.0/thermochemistry-evaluation.schema.json')));

function authoredFixtureBytes(file){
 const original=readOriginal(file);
 if(file===identityPath)return original;
 const suffix=file===tableManifest?'MAT:0001:TABLE:010':'MAT:0001:GRAPH:009';
 const start=file===mainPath?'<!-- NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->':`# NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`;
 const end=file===mainPath?'<!-- /NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->':`# /NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`;
 const text=original.toString('utf8');
 if(!text.includes(start)&&!text.includes(end))return original;
 assert.equal(text.split(start).length,2);assert.equal(text.split(end).length,2);
 const from=original.indexOf(Buffer.from(start)),to=original.indexOf(Buffer.from(end),from);
 assert.ok(to>from);
 // Remove only the approved generated block from this temporary fixture. Retain
 // every byte of authored prefix/tail, including its original line endings.
 let after=to+Buffer.byteLength(end);
 if(original.subarray(after,after+2).toString()==='\r\n')after+=2;
 else if(original[after]===10)after++;
 return Buffer.concat([original.subarray(0,from),original.subarray(after)]);
}

function fixture(t){
 const repoRoot=fs.mkdtempSync(path.join(tmpdir(),'mat-curated-thermal-'));
 const relative=path.relative(path.resolve(tmpdir()),repoRoot);
 assert.ok(!path.isAbsolute(relative)&&/^mat-curated-thermal-[^\\/]+$/.test(relative));
 t.after(()=>fs.rmSync(repoRoot,{recursive:true,force:true}));
 const write=(file,body)=>{fs.mkdirSync(path.dirname(path.join(repoRoot,file)),{recursive:true});fs.writeFileSync(path.join(repoRoot,file),body);};
 const read=file=>fs.readFileSync(path.join(repoRoot,file));
 const originals=Object.fromEntries(authoredPaths.map(file=>[file,authoredFixtureBytes(file)]));
 for(const [file,bytes]of Object.entries(originals))write(file,bytes);
 const source_id='SRC-000999';
 const snapshot=(name,body)=>{const file='data/catalog/sources/'+name+'.txt';write(file,body);return {path:file,url:'https://fixture.invalid/'+name,bytes:Buffer.byteLength(body),sha256:hash(body)};};
 const subject={object_ref:'MAT:0001:MOL:H2',object_class:'MOLECULE',owner:{path:identityPath,pointer:'/molecular_states/H2',sha256:hash(originals[identityPath])},spin_isomer_scope:'UNSPECIFIED-IN-RETAINED-FIT',isotopic_composition:'UNSPECIFIED-IN-RETAINED-FIT'};
 const item={record_id:'MAT:0001',z:1,name:'Hydrogen',source_id,source_formula:'H2',molar_basis:'mol H2',atoms_per_source_formula:2,retrieved:'2026-10-05',parent_integration:'CURATED-APPEND-ONLY',subject,
  snapshot:snapshot('hydrogen','Synthetic H2 coefficients fixture; not scientific data.'),publisher_table_snapshot:snapshot('hydrogen-table','Synthetic arithmetic fixture; not scientific data.'),
  heat_capacity_fits:[{fit_id:'MAT:0001:THERMO:SHOMATE:GAS:01',source_id,source_locator:'data/catalog/sources/hydrogen.txt#line=1',source_column:1,phase:'GAS',phase_label_as_reported:'TEST-FIXTURE-GAS',temperature_range:{min:300,max:600,unit:'K',raw:'300 to 600'},
   coefficients:Object.fromEntries([...'ABCDEFGH'].map(k=>[k,{raw:k==='A'?'30':'0',value:k==='A'?30:0}])),coefficient_uncertainty:'UNKNOWN',coefficient_covariance:'UNKNOWN',reference_as_reported:'Synthetic fixture',comment_as_reported:'Synthetic fixture; no scientific claim',evidence_status:'PUBLISHED-EVALUATED-FIT'}]};
 const save=()=>write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[item],source_gaps:[]}));
 write('data/catalog/elements-baseline.json',JSON.stringify({elements:[{z:1,name:'Hydrogen',symbol:'H',chapterPath:mainPath}]}));
 write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[]}));save();
 const context=()=>({identityDocument:YAML.parse(read(identityPath).toString('utf8')),identityPath,identitySha256:hash(read(identityPath))});
 return {repoRoot,write,read,originals,item,save,context};
}
function assertNoOutputs(f){
 assert.ok(!fs.existsSync(path.join(f.repoRoot,`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`)));
 assert.ok(!fs.existsSync(path.join(f.repoRoot,'.mat-local/thermochemistry-plot-input.json')));
}
function addFixtureReceipt(f){
 const plot=JSON.parse(f.read('.mat-local/thermochemistry-plot-input.json'))[0];
 f.write(plot.chart,'<svg xmlns="http://www.w3.org/2000/svg"><title>Synthetic chart receipt fixture only</title></svg>');
 f.write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[{record_id:'MAT:0001',input:plot.input,input_sha256:hash(f.read(plot.input)),csv:plot.csv,csv_sha256:hash(f.read(plot.csv)),chart:plot.chart,chart_sha256:hash(f.read(plot.chart))}]}));
 return plot;
}

function interpretedComparison(f){
 // Test-only constant-Cp arithmetic. No values represent real Hydrogen science.
 const fit=f.item.heat_capacity_fits[0];fit.temperature_range={min:300.15,max:600,unit:'K',raw:'300.15 to 600'};
 const calculated=shomate(fit,300.15),raw=['300',calculated.heat_capacity_J_mol_K.toFixed(6),calculated.entropy_J_mol_K.toFixed(6),'inert test field',calculated.enthalpy_increment_kJ_mol.toFixed(6)];
 const check={temperature_K:300,candidate_fit_ids:[fit.fit_id],raw,heat_capacity_J_mol_K:Number(raw[1]),entropy_J_mol_K:Number(raw[2]),enthalpy_increment_kJ_mol:Number(raw[4]),calculation_temperature_K:300.15,calculation_temperature_basis:publisherTemperatureBasis,calculation_temperature_evidence:'INTERPRETATION',printed_temperature_rounding_interval_K:{min:299.5,max:300.5}};
 f.item.publisher_calculation_checks=[check];return check;
}

test('future bounded generation carries interpretation notes into model and chapter without changing original labels or authored owners',t=>{
 const f=fixture(t);interpretedComparison(f);f.save();const catalogueBefore=f.read('data/catalog/thermochemistry-evaluation-index.json');
 syncThermochemistry({repoRoot:f.repoRoot,elements:[1]});
 const model=YAML.parse(f.read(`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`).toString('utf8')),chapter=f.read(`${folder}/${stem}-Thermochemistry.md`).toString('utf8');
 assert.equal(validateSchema(model),true,JSON.stringify(validateSchema.errors));assert.equal(model.review_notes.length,1);assert.equal(model.review_notes[0].evidence_status,'INTERPRETATION');
 for(const text of ['printed 300 K','chosen 300.15 K','does not establish a unique temperature','not independent measurements'])assert.ok(chapter.includes(text));
 assert.deepEqual(f.read('data/catalog/thermochemistry-evaluation-index.json'),catalogueBefore);assert.equal(f.item.review_notes,undefined);assert.equal(f.item.publisher_calculation_checks[0].raw[0],'300');
 assert.deepEqual(f.read(identityPath),f.originals[identityPath]);for(const p of [mainPath,tableManifest,graphManifest])assert.deepEqual(f.read(p).subarray(0,f.originals[p].length),f.originals[p]);
});

test('misclassified comparison evidence is refused before any output or curated append is written',t=>{
 for(const evidence of ['MEASURED','EXACT']){const f=fixture(t);interpretedComparison(f).calculation_temperature_evidence=evidence;f.save();assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot,elements:[1]}),/evidence must be INTERPRETATION/);assertNoOutputs(f);for(const p of authoredPaths)assert.deepEqual(f.read(p),f.originals[p]);}
});

test('curated Hydrogen adds H2-specific outputs while preserving the complete authored master and raw prefixes',t=>{
 const f=fixture(t),beforeDirectory=process.cwd();
 assert.deepEqual(syncThermochemistry({repoRoot:f.repoRoot,elements:[1]}),{elements:1,source_gaps:0,fits:1,calculated_rows:101});
 assert.equal(process.cwd(),beforeDirectory);
 assert.deepEqual(f.read(identityPath),f.originals[identityPath]);
 for(const file of [mainPath,tableManifest,graphManifest])assert.deepEqual(f.read(file).subarray(0,f.originals[file].length),f.originals[file]);
 const parent=f.read(mainPath).toString('utf8');
 assert.ok(parent.includes('<!-- NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->'));
 assert.ok(parent.includes('MAT:0001:MOL:H2'));assert.ok(parent.includes('UNSPECIFIED-IN-RETAINED-FIT'));
 for(const [file,key,count]of [[tableManifest,'tables',10],[graphManifest,'graphs',9]]){
  const original=YAML.parse(f.originals[file].toString('utf8')),updated=YAML.parse(f.read(file).toString('utf8'));
  assert.equal(updated[key].length,count);assert.deepEqual(updated[key].slice(0,-1),original[key]);
  for(const metadata of Object.keys(original).filter(k=>k!==key))assert.deepEqual(updated[metadata],original[metadata]);
 }
 const model=YAML.parse(f.read(`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`).toString('utf8'));
 assert.ok(validateSchema(model),JSON.stringify(validateSchema.errors));
 assert.deepEqual(model.subject,f.item.subject);assert.equal(model.parent_integration,'CURATED-APPEND-ONLY');
 assert.deepEqual(validateThermochemistryContext(model,f.context()),f.item.subject);
 assert.equal(model.species.molar_basis,'mol H2');assert.equal(model.heat_capacity_fits[0].coefficients.A.value,30);
 const chapter=f.read(`${folder}/${stem}-Thermochemistry.md`).toString('utf8');
 assert.ok(chapter.includes('Canonical subject: **MAT:0001:MOL:H2**'));assert.ok(chapter.includes('No normal/para/ortho composition'));
 const plot=JSON.parse(f.read('.mat-local/thermochemistry-plot-input.json'))[0];assert.deepEqual(plot.subject,f.item.subject);
});

test('approved curated blocks and generated targets rerun byte-identically with their original receipt',t=>{
 const f=fixture(t);syncThermochemistry({repoRoot:f.repoRoot});const plot=addFixtureReceipt(f);
 const files=[...authoredPaths,plot.input,plot.csv,plot.chart,`${folder}/${stem}-Thermochemistry.md`,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.md`,'.mat-local/thermochemistry-plot-input.json'];
 const before=files.map(f.read);syncThermochemistry({repoRoot:f.repoRoot});assert.deepEqual(files.map(f.read),before);
});

test('curated canonical context rejects stale, atomic, spin-specific and otherwise incompatible subject bindings before writes',t=>{
 const changes=[
  item=>{item.subject.owner.sha256='0'.repeat(64);},
  item=>{item.subject.owner.path='records/0002-Helium-He/data/structured/0002-Helium-He.yaml';},
  item=>{item.subject.owner.pointer='/molecular_states/absent';},
  item=>{item.subject.object_ref='MAT:0001:ATOM:H';item.subject.object_class='ATOM';item.subject.owner.pointer='/charge_states/1';},
  item=>{item.subject.object_class='ATOM';},
  item=>{item.subject.owner.pointer='/molecular_states/H2/spin_isomers/0';item.subject.object_ref='MAT:0001:MOL:H2:ORTHO';},
  item=>{item.subject.spin_isomer_scope='NORMAL-HYDROGEN';},
  item=>{item.subject.spin_isomer_scope='NOT-APPLICABLE-TO-MONATOMIC-SPECIES';},
  item=>{delete item.subject.isotopic_composition;},
  item=>{delete item.parent_integration;},
  item=>{delete item.subject;},
  item=>{item.source_formula='H';item.molar_basis='mol H';item.atoms_per_source_formula=1;},
  item=>{item.species={source_formula:'H',molar_basis:'mol H2',atoms_per_source_formula:2};},
  item=>{item.species={source_formula:'H2',molar_basis:'mol H',atoms_per_source_formula:2};},
  item=>{item.species={source_formula:'H2',molar_basis:'mol H2',atoms_per_source_formula:1};},
 ];
 for(const change of changes){
  const f=fixture(t);change(f.item);f.save();assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(Thermochemistry|thermochemistry|Curated)/);
  for(const file of authoredPaths)assert.deepEqual(f.read(file),f.originals[file]);assertNoOutputs(f);
 }
 const stale=fixture(t);stale.write(identityPath,Buffer.concat([stale.read(identityPath),Buffer.from('\n# Authored owner change\n')]));
 const before=authoredPaths.map(stale.read);assert.throws(()=>syncThermochemistry({repoRoot:stale.repoRoot}),/identity hash mismatch/);assert.deepEqual(authoredPaths.map(stale.read),before);assertNoOutputs(stale);
});

test('curated atom and molecule identities reject condensed or unresolved phases before writing any mixed-fit output',t=>{
 for(const objectClass of ['ATOM','MOLECULE'])for(const phase of ['SOLID','LIQUID','UNKNOWN',null,undefined]){
  const f=fixture(t);
  if(objectClass==='ATOM'){
   Object.assign(f.item,{source_formula:'H',molar_basis:'mol H',atoms_per_source_formula:1});
   Object.assign(f.item.subject,{object_ref:'MAT:0001:ATOM:H',object_class:'ATOM',spin_isomer_scope:'NOT-APPLICABLE-TO-MONATOMIC-SPECIES'});
   f.item.subject.owner.pointer='/charge_states/1';
  }
  // First establish a valid gas subject, then add an incompatible fit. A valid
  // first fit must not permit partially generated output from a mixed accession.
  assert.deepEqual(validateThermochemistryContext(f.item,f.context()),f.item.subject);
  const incompatible={...structuredClone(f.item.heat_capacity_fits[0]),phase};
  f.item.heat_capacity_fits.push(incompatible);f.save();
  assert.throws(()=>validateThermochemistryContext(f.item,f.context()),/GAS-only.*explicit phase binding/);
  assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/GAS-only.*explicit phase binding/);
  for(const file of authoredPaths)assert.deepEqual(f.read(file),f.originals[file]);assertNoOutputs(f);
 }
 const missing=fixture(t);
 for(const fits of [[],null,undefined,Array(1)]){
  missing.item.heat_capacity_fits=fits;
  assert.throws(()=>validateThermochemistryContext(missing.item,missing.context()),/GAS-only.*explicit phase binding/);
 }
});

test('review-note validation preserves existing IDs and rejects malformed notes before the legacy context return',()=>{
 const note={note_id:'FIT-SHAPE-REVIEW',status:'REQUIRES-REVIEW',evidence_status:'CALCULATED-FROM-PUBLISHED-FIT',text:'Synthetic review note; no scientific assertion.'};
 for(const item of [{},{review_notes:[]},{review_notes:[note]}]){
  assert.doesNotThrow(()=>validateThermochemistryReviewNotes(item));assert.equal(validateThermochemistryContext(item),null);
 }
 for(const notes of [null,{},'review',Array(1),[null],[undefined],[[]],[note,{...note}]]){
  assert.throws(()=>validateThermochemistryReviewNotes({review_notes:notes}),/(review note|review notes)/i);
  assert.throws(()=>validateThermochemistryContext({review_notes:notes}),/(review note|review notes)/i);
 }
});

test('malformed or duplicate review notes fail before any generated output or authored append is written',t=>{
 const note={note_id:'FIT-SHAPE-REVIEW',status:'REQUIRES-REVIEW',evidence_status:'CALCULATED-FROM-PUBLISHED-FIT',text:'Synthetic review note; no scientific assertion.'};
 const invalid=[null,{},'review',[null],[[]],[{}],[note,{...note}]];
 for(const field of ['note_id','status','evidence_status','text']){
  const missing={...note};delete missing[field];invalid.push([missing]);
  for(const value of ['', ' \t\r\n', 12])invalid.push([{...note,[field]:value}]);
 }
 for(const notes of invalid){
  const f=fixture(t);f.item.review_notes=notes;f.save();
  assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(review note|review notes)/i);
  for(const file of authoredPaths)assert.deepEqual(f.read(file),f.originals[file]);assertNoOutputs(f);
 }
 const f=fixture(t);syncThermochemistry({repoRoot:f.repoRoot});
 const model=YAML.parse(f.read(`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`).toString('utf8'));
 for(const notes of invalid.filter(n=>!Array.isArray(n)||n.length!==2))assert.equal(validateSchema({...model,review_notes:notes}),false);
 assert.equal(validateSchema({...model,review_notes:[note]}),true);assert.equal(validateSchema({...model,review_notes:[]}),true);
});

test('edited or duplicated curated parent and manifest append blocks fail without overwriting any output',t=>{
 for(const file of [mainPath,tableManifest,graphManifest])for(const mutation of ['edit','duplicate']){
  const f=fixture(t);syncThermochemistry({repoRoot:f.repoRoot});const plot=addFixtureReceipt(f);
  const text=f.read(file).toString('utf8');
  const edited=mutation==='edit'?text.replace(file===tableManifest?'calculated thermodynamic functions':'phase-specific heat capacity','Authored correction'):
   text+'\n'+(file===mainPath?'<!-- NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->':`# NIST-THERMOCHEMISTRY-CURATED-ENTRY MAT:0001:${file===tableManifest?'TABLE:010':'GRAPH:009'}`)+'\n';
  // Parent wording is lowercase inside the approved block; target its stable caveat directly.
  f.write(file,mutation==='edit'&&file===mainPath?text.replace('Published fit limits forbid extrapolation.','Authored correction within approved block.'):edited);
  const files=[...authoredPaths,plot.input,plot.csv,plot.chart,'.mat-local/thermochemistry-plot-input.json'],before=files.map(f.read);
  assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(edited or changed curated|changed curated manifest|missing or duplicated)/);
  assert.deepEqual(files.map(f.read),before);
 }
});

test('curated legacy manifest owners and unregistered physical numeric slots are protected before writes',t=>{
 for(const collision of [
  {file:tableManifest,key:'tables',entry:{id:'MAT:0001:TABLE:010',file:'authored-evidence.md'}},
  {file:graphManifest,key:'graphs',entry:{graph_id:'MAT:0001:GRAPH:009',filename:'authored-chart.svg'}},
  {asset:`${folder}/tables/${stem}-TABLE-010-Evidence.md`},
  {asset:`${folder}/graphs/${stem}-GRAPH-009-Other.svg`},
  {file:graphManifest,key:'graphs',entry:{id:'MAT:0001:GRAPH:008',file:`./${stem}-GRAPH-009-Heat-Capacity.svg`}},
 ]){
  const f=fixture(t);
  if(collision.file){const manifest=YAML.parse(f.read(collision.file).toString('utf8'));manifest[collision.key].push(collision.entry);f.write(collision.file,YAML.stringify(manifest));}
  if(collision.asset)f.write(collision.asset,'Existing authored scientific asset.');
  const files=[...authoredPaths,...(collision.asset?[collision.asset]:[])],before=files.map(f.read);
  assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(slot already owned|physical target already owned)/);
  assert.deepEqual(files.map(f.read),before);assertNoOutputs(f);
 }
});

test('curated evaluation schema requires paired integration/subject metadata and retains legacy acceptance',t=>{
 const f=fixture(t);syncThermochemistry({repoRoot:f.repoRoot});const model=YAML.parse(f.read(`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`).toString('utf8'));
 for(const mutate of [m=>delete m.subject,m=>delete m.parent_integration,m=>{m.subject.owner.sha256='stale';},m=>{delete m.subject.spin_isomer_scope;},m=>{m.parent_integration='REWRITE';}]){
  const bad=structuredClone(model);mutate(bad);assert.equal(validateSchema(bad),false);
 }
 const legacy=structuredClone(model);delete legacy.subject;delete legacy.parent_integration;
 assert.equal(validateSchema(legacy),true);assert.equal(validateThermochemistryContext(legacy),null);
});

test('the retained canonical Hydrogen package regenerates byte-identically with omitted slot defaults',t=>{
 const f=fixture(t),catalogue=JSON.parse(readOriginal('data/catalog/thermochemistry-evaluation-index.json'));
 const item=catalogue.elements.find(e=>e.z===1);
 assert.equal(item.parent_integration,'CURATED-APPEND-ONLY');assert.equal(item.asset_slots,undefined);
 const receipt=JSON.parse(readOriginal('data/quality/thermochemistry-chart-manifest.json')).elements.find(e=>e.record_id==='MAT:0001');
 const files=[...authoredPaths,receipt.input,receipt.csv,receipt.chart,`${folder}/${stem}-Thermochemistry.md`,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.md`];
 for(const file of files)f.write(file,readOriginal(file));
 for(const snapshot of [item.snapshot,item.publisher_table_snapshot])f.write(snapshot.path,readOriginal(snapshot.path));
 f.write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[item],source_gaps:[]}));
 f.write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[receipt]}));
 const before=files.map(f.read);syncThermochemistry({repoRoot:f.repoRoot,elements:[1]});assert.deepEqual(files.map(f.read),before);
 const plot=JSON.parse(f.read('.mat-local/thermochemistry-plot-input.json'))[0];assert.equal(plot.asset_slots,undefined);assert.equal(plot.parent_integration,undefined);assert.equal(plot.chart,receipt.chart);
});

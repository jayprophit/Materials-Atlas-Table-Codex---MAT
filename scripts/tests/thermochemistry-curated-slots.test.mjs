import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import Ajv from 'ajv';
import {syncThermochemistry} from '../sync-thermochemistry.mjs';
import {validateThermochemistryContext,resolveThermochemistryAssetSlots} from '../thermochemistry-context.mjs';

const root=path.resolve(import.meta.dirname,'../..'),stem='0002-Helium-He',folder='records/'+stem;
const identityPath=`${folder}/data/structured/${stem}.yaml`,mainPath=`${folder}/${stem}.md`;
const tableManifest=`${folder}/data/structured/${stem}-Table-Manifest.yaml`,graphManifest=`${folder}/data/structured/${stem}-Graph-Manifest.yaml`;
const dimerPath=`${folder}/graphs/${stem}-GRAPH-009-He2-Dimer-Potential.svg`;
const authoredPaths=[identityPath,mainPath,tableManifest,graphManifest,dimerPath];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const schema=new Ajv({allErrors:true}).compile(JSON.parse(fs.readFileSync(path.join(root,'data/schema/1.0.0/thermochemistry-evaluation.schema.json'),'utf8')));

function withoutCuratedBlock(bytes,file){
 const parent=file===mainPath,suffix=file===tableManifest?'MAT:0002:TABLE:010':'MAT:0002:GRAPH:010';
 const start=parent?'<!-- NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->':`# NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`;
 const end=parent?'<!-- /NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->':`# /NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`;
 const text=bytes.toString('utf8');
 if(!text.includes(start)&&!text.includes(end))return bytes;
 assert.equal(text.split(start).length,2);assert.equal(text.split(end).length,2);
 const from=bytes.indexOf(Buffer.from(start)),to=bytes.indexOf(Buffer.from(end),from);assert.ok(to>from);
 let after=to+Buffer.byteLength(end);if(bytes.subarray(after,after+2).toString()==='\r\n')after+=2;else if(bytes[after]===10)after++;
 return Buffer.concat([bytes.subarray(0,from),bytes.subarray(after)]);
}
function fixture(t){
 const repoRoot=fs.mkdtempSync(path.join(tmpdir(),'mat-curated-slots-')),relative=path.relative(path.resolve(tmpdir()),repoRoot);
 assert.ok(!path.isAbsolute(relative)&&/^mat-curated-slots-[^\\/]+$/.test(relative));
 t.after(()=>fs.rmSync(repoRoot,{recursive:true,force:true}));
 const write=(file,body)=>{fs.mkdirSync(path.dirname(path.join(repoRoot,file)),{recursive:true});fs.writeFileSync(path.join(repoRoot,file),body);};
 const read=file=>fs.readFileSync(path.join(repoRoot,file));
 for(const file of [identityPath,mainPath,graphManifest]){
  const bytes=fs.readFileSync(path.join(root,file));write(file,file===identityPath?bytes:withoutCuratedBlock(bytes,file));
 }
 if(fs.existsSync(path.join(root,tableManifest)))write(tableManifest,withoutCuratedBlock(fs.readFileSync(path.join(root,tableManifest)),tableManifest));
 else write(tableManifest,'# Synthetic manifest fixture; the generator must never create a missing canonical manifest.\r\n'+YAML.stringify({record_id:'MAT:0002',manifest_id:'MAT:0002:REG:TABLES',version:'1.0.0',tables:Array.from({length:9},(_,i)=>({table_id:'MAT:0002:TABLE:'+String(i+1).padStart(3,'0'),filename:'authored-fixture-'+(i+1)+'.md',status:'EXISTS'}))}).replace(/\n/g,'\r\n'));
 write(dimerPath,'<svg xmlns="http://www.w3.org/2000/svg"><title>Reserved authored He2 dimer fixture, no scientific values</title></svg>');
 const originals=Object.fromEntries(authoredPaths.map(file=>[file,read(file)]));
 const source_id='SRC-000999';
 const snapshot=(name,body)=>{const file='data/catalog/sources/'+name+'.txt';write(file,body);return {path:file,url:'https://fixture.invalid/'+name,bytes:Buffer.byteLength(body),sha256:hash(body)};};
 const item={record_id:'MAT:0002',z:2,name:'Helium',source_id,source_formula:'He',molar_basis:'mol He',atoms_per_source_formula:1,retrieved:'2026-10-05',parent_integration:'CURATED-APPEND-ONLY',asset_slots:{table:10,graph:10},
  subject:{object_ref:'MAT:0002:ATOM:He',object_class:'ATOM',owner:{path:identityPath,pointer:'/atomic_states/0',sha256:hash(read(identityPath))},spin_isomer_scope:'NOT-APPLICABLE-TO-MONATOMIC-SPECIES',isotopic_composition:'UNSPECIFIED-IN-RETAINED-FIT'},
  snapshot:snapshot('helium','Synthetic atomic He fixture, not scientific source data.'),publisher_table_snapshot:snapshot('helium-table','Synthetic arithmetic fixture only.'),
  heat_capacity_fits:[{fit_id:'MAT:0002:THERMO:SHOMATE:GAS:01',source_id,source_locator:'data/catalog/sources/helium.txt#line=1',source_column:1,phase:'GAS',phase_label_as_reported:'TEST-FIXTURE-GAS',temperature_range:{min:300,max:600,unit:'K',raw:'300 to 600'},coefficients:Object.fromEntries([...'ABCDEFGH'].map(k=>[k,{raw:k==='A'?'30':'0',value:k==='A'?30:0}])),coefficient_uncertainty:'UNKNOWN',coefficient_covariance:'UNKNOWN',reference_as_reported:'Synthetic fixture',comment_as_reported:'No scientific claim',evidence_status:'PUBLISHED-EVALUATED-FIT'}]};
 const save=()=>write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[item],source_gaps:[]}));
 write('data/catalog/elements-baseline.json',JSON.stringify({elements:[{z:2,name:'Helium',symbol:'He',chapterPath:mainPath}]}));
 write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[]}));save();
 const context=()=>({identityDocument:YAML.parse(read(identityPath).toString('utf8')),identityPath,identitySha256:hash(read(identityPath))});
 return {repoRoot,write,read,item,save,context,originals};
}
function assertNoWrites(f,before=Object.values(f.originals)){
 assert.deepEqual(authoredPaths.map(f.read),before);
 assert.ok(!fs.existsSync(path.join(f.repoRoot,`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`)));
 assert.ok(!fs.existsSync(path.join(f.repoRoot,'.mat-local/thermochemistry-plot-input.json')));
}

test('reviewed slot resolution defaults exactly and rejects invalid, partial or non-curated allocations',()=>{
 assert.deepEqual(resolveThermochemistryAssetSlots({}),{table:10,graph:9});
 assert.deepEqual(resolveThermochemistryAssetSlots({parent_integration:'CURATED-APPEND-ONLY'}),{table:10,graph:9});
 assert.deepEqual(resolveThermochemistryAssetSlots({parent_integration:'CURATED-APPEND-ONLY',asset_slots:{table:10,graph:10}}),{table:10,graph:10});
 assert.deepEqual(resolveThermochemistryAssetSlots({parent_integration:'CURATED-APPEND-ONLY',asset_slots:{table:1,graph:Number.MAX_SAFE_INTEGER}}),{table:1,graph:Number.MAX_SAFE_INTEGER});
 for(const slots of [null,[],{}, {table:10}, {graph:10}, {table:10,graph:10,extra:1}, ...[0,-1,1.5,'10',true,NaN,Infinity,Number.MAX_SAFE_INTEGER+1].map(graph=>({table:10,graph}))])assert.throws(()=>resolveThermochemistryAssetSlots({parent_integration:'CURATED-APPEND-ONLY',asset_slots:slots}),/asset slot/i);
 assert.throws(()=>resolveThermochemistryAssetSlots({asset_slots:{table:10,graph:10}}),/reviewed curated/);
});

test('curated monatomic Helium uses reviewed graph 10 and retains the dimer slot, master and authored prefixes',t=>{
 const f=fixture(t);assert.deepEqual(validateThermochemistryContext(f.item,f.context()),f.item.subject);
 assert.deepEqual(syncThermochemistry({repoRoot:f.repoRoot,elements:[2]}),{elements:1,source_gaps:0,fits:1,calculated_rows:101});
 assert.deepEqual(f.read(identityPath),f.originals[identityPath]);assert.deepEqual(f.read(dimerPath),f.originals[dimerPath]);
 for(const file of [mainPath,tableManifest,graphManifest])assert.deepEqual(f.read(file).subarray(0,f.originals[file].length),f.originals[file]);
 const graphs=YAML.parse(f.read(graphManifest).toString('utf8')).graphs;
 assert.deepEqual(graphs.slice(0,-1),YAML.parse(f.originals[graphManifest].toString('utf8')).graphs);
 assert.equal(graphs.at(-1).graph_id,'MAT:0002:GRAPH:010');assert.equal(graphs.at(-1).filename,stem+'-GRAPH-010-Heat-Capacity.svg');
 const model=YAML.parse(f.read(`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`).toString('utf8'));
 assert.ok(schema(model),JSON.stringify(schema.errors));assert.deepEqual(model.asset_slots,{table:10,graph:10});assert.equal(model.species.gas_species,'ISOLATED-ATOMIC-SPECIES');
 assert.equal(model.graph.path,`${folder}/graphs/${stem}-GRAPH-010-Heat-Capacity.svg`);assert.equal(model.table.path,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.md`);
 const chapter=f.read(`${folder}/${stem}-Thermochemistry.md`).toString('utf8'),parent=f.read(mainPath).toString('utf8').slice(f.originals[mainPath].length);
 for(const text of [chapter,parent]){assert.ok(text.includes('MAT:0002:ATOM:He'));assert.ok(text.includes('NOT-APPLICABLE-TO-MONATOMIC-SPECIES'));assert.ok(text.includes('Isotopic composition is **UNSPECIFIED-IN-RETAINED-FIT**'));assert.ok(!text.includes('normal/para/ortho'));}
 assert.ok(chapter.includes('one mole of neutral He atoms'));assert.ok(parent.includes('1 atom per source formula'));
 const plot=JSON.parse(f.read('.mat-local/thermochemistry-plot-input.json'))[0];assert.deepEqual(plot.asset_slots,{table:10,graph:10});assert.equal(plot.parent_integration,'CURATED-APPEND-ONLY');
 f.write(plot.chart,'<svg xmlns="http://www.w3.org/2000/svg"><title>Synthetic chart receipt fixture</title></svg>');
 f.write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[{record_id:'MAT:0002',input:plot.input,input_sha256:hash(f.read(plot.input)),csv:plot.csv,csv_sha256:hash(f.read(plot.csv)),chart:plot.chart,chart_sha256:hash(f.read(plot.chart))}]}));
 const files=[...authoredPaths,plot.input,plot.csv,plot.chart,'.mat-local/thermochemistry-plot-input.json'],before=files.map(f.read);
 syncThermochemistry({repoRoot:f.repoRoot});assert.deepEqual(files.map(f.read),before);
 f.item.asset_slots={table:11,graph:11};f.save();assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/edited or changed curated append/);assert.deepEqual(files.map(f.read),before);
});

test('monatomic context rejects molecular spin claims, dimer substitution, stale identities and invalid allocations before writes',t=>{
 for(const mutate of [i=>{i.subject.spin_isomer_scope='UNSPECIFIED-IN-RETAINED-FIT';},i=>{i.subject.isotopic_composition='He-4';},i=>{i.subject.owner.pointer='/atomic_states/1';},i=>{i.subject.owner.sha256='0'.repeat(64);},i=>{i.source_formula='He2';i.molar_basis='mol He2';i.atoms_per_source_formula=2;},i=>{i.asset_slots.graph=0;},i=>{i.asset_slots.graph='10';},i=>{delete i.asset_slots.table;}]){
  const f=fixture(t);mutate(f.item);f.save();assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(Thermochemistry|thermochemistry)/);assertNoWrites(f);
 }
});

test('resolved slots reject occupied manifests, alternative physical filenames and absent authored manifests before writes',t=>{
 for(const collision of [
  {useDefault:true},
  {key:'graphs',file:graphManifest,entry:{id:'MAT:0002:GRAPH:010',file:'authored-other.svg'}},
  {key:'tables',file:tableManifest,entry:{table_id:'MAT:0002:TABLE:010',filename:'authored-other.md'}},
  {asset:`${folder}/graphs/${stem}-GRAPH-010-Other.svg`},
  {asset:`${folder}/tables/${stem}-TABLE-010-Other.md`},
 ]){
  const f=fixture(t);
  if(collision.useDefault){delete f.item.asset_slots;f.save();}
  if(collision.file){const manifest=YAML.parse(f.read(collision.file).toString('utf8'));manifest[collision.key].push(collision.entry);f.write(collision.file,YAML.stringify(manifest));}
  if(collision.asset)f.write(collision.asset,'Authored asset fixture.');
  const before=authoredPaths.map(f.read),assetBefore=collision.asset?f.read(collision.asset):null;
  assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(slot already owned|physical target already owned)/);assertNoWrites(f,before);
  if(collision.asset)assert.deepEqual(f.read(collision.asset),assetBefore);
 }
 const missing=fixture(t);fs.unlinkSync(path.join(missing.repoRoot,tableManifest));
 assert.throws(()=>syncThermochemistry({repoRoot:missing.repoRoot}),/ENOENT/);
 assert.ok(!fs.existsSync(path.join(missing.repoRoot,tableManifest)));assert.ok(!fs.existsSync(path.join(missing.repoRoot,'.mat-local/thermochemistry-plot-input.json')));
 for(const file of authoredPaths.filter(p=>p!==tableManifest))assert.deepEqual(missing.read(file),missing.originals[file]);
});

test('curated slot and atom-specific schema gates require reviewed allocation and distinguish molecular spin scope',t=>{
 const f=fixture(t);syncThermochemistry({repoRoot:f.repoRoot});const model=YAML.parse(f.read(`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`).toString('utf8'));
 for(const mutate of [m=>{m.asset_slots.graph=0;},m=>{m.asset_slots.table=1.5;},m=>{m.asset_slots.graph=Number.MAX_SAFE_INTEGER+1;},m=>{delete m.asset_slots.table;},m=>{m.asset_slots.extra=1;},m=>{delete m.parent_integration;delete m.subject;},m=>{m.subject.spin_isomer_scope='UNSPECIFIED-IN-RETAINED-FIT';}]){
  const bad=structuredClone(model);mutate(bad);assert.equal(schema(bad),false);
 }
 const defaulted=structuredClone(model);delete defaulted.asset_slots;assert.equal(schema(defaulted),true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import Ajv from 'ajv';
import {loadThermochemistryContext,validateThermochemistryContext} from '../thermochemistry-context.mjs';
import {syncThermochemistry} from '../sync-thermochemistry.mjs';
import {buildChartProjection,chartInputs} from '../mat-chart-projection.mjs';

const root=path.resolve(import.meta.dirname,'../..'),stem='0010-Neon-Ne',folder='records/'+stem;
const master=`${folder}/data/structured/${stem}.yaml`,definition=master.replace(/\.yaml$/,'-Neutral-Atom.yaml');
const main=`${folder}/${stem}.md`,tableManifest=`${folder}/data/structured/${stem}-Table-Manifest.yaml`,graphManifest=`${folder}/data/structured/${stem}-Graph-Manifest.yaml`;
const authored=[master,definition,main,tableManifest,graphManifest];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),original=file=>fs.readFileSync(path.join(root,file));
const schema=JSON.parse(original('data/schema/1.0.0/thermochemistry-evaluation.schema.json'));
const validateSchema=new Ajv({allErrors:true}).compile(schema);
const validateSubject=new Ajv({allErrors:true}).compile({$ref:'#/definitions/subject',definitions:schema.definitions});

function authoredFixtureBytes(bytes,file){
 if(file===master||file===definition)return bytes;
 assert([main,tableManifest,graphManifest].includes(file),'Only known authored fixture paths may remove a curated block');
 const parent=file===main,suffix=file===tableManifest?'MAT:0010:TABLE:010':'MAT:0010:GRAPH:009';
 const start=parent?'<!-- NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->':`# NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`;
 const end=parent?'<!-- /NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->':`# /NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`;
 const text=bytes.toString('utf8');
 if(!text.includes(start)&&!text.includes(end))return bytes;
 assert.equal(text.split(start).length,2);assert.equal(text.split(end).length,2);
 const from=bytes.indexOf(Buffer.from(start)),to=bytes.indexOf(Buffer.from(end),from);assert.ok(to>from);
 // Only temporary fixture copies lose this exact generated block. Real owner
 // bytes and every authored prefix/tail byte, including line endings, survive.
 let after=to+Buffer.byteLength(end);if(bytes.subarray(after,after+2).toString()==='\r\n')after+=2;else if(bytes[after]===10)after++;
 return Buffer.concat([bytes.subarray(0,from),bytes.subarray(after)]);
}

// Only the identity bytes are real. Coefficients, sources and charts below are
// synthetic software fixtures in a disposable directory, never MAT science.
function fixture(t){
 const temporaryRoot=path.resolve(tmpdir()),repoRoot=fs.mkdtempSync(path.join(temporaryRoot,'mat-neutral-owner-'));
 const relative=path.relative(temporaryRoot,repoRoot);assert(!path.isAbsolute(relative)&&/^mat-neutral-owner-[^\\/]+$/.test(relative));
 t.after(()=>fs.rmSync(repoRoot,{recursive:true,force:true}));
 const write=(file,bytes)=>{fs.mkdirSync(path.dirname(path.join(repoRoot,file)),{recursive:true});fs.writeFileSync(path.join(repoRoot,file),bytes);};
 const read=file=>fs.readFileSync(path.join(repoRoot,file));
 const originals=Object.fromEntries(authored.map(file=>[file,authoredFixtureBytes(original(file),file)]));for(const [file,bytes]of Object.entries(originals))write(file,bytes);
 const subject={object_ref:'MAT:0010:ATOM:Ne',object_class:'ATOM',owner:{path:definition,pointer:'/entity',sha256:hash(read(definition))},identity_owner:{path:master,pointer:'/identity',sha256:hash(read(master))},spin_isomer_scope:'NOT-APPLICABLE-TO-MONATOMIC-SPECIES',isotopic_composition:'UNSPECIFIED-IN-RETAINED-FIT'};
 const snapshot=name=>{const file=`data/catalog/sources/${name}.txt`,bytes='SYNTHETIC SOFTWARE FIXTURE ONLY; NOT A SCIENTIFIC SOURCE.\n';write(file,bytes);return{path:file,url:'https://fixture.invalid/'+name,bytes:Buffer.byteLength(bytes),sha256:hash(bytes)};};
 const item={record_id:'MAT:0010',z:10,name:'Neon',source_id:'SRC-000999',source_formula:'Ne',molar_basis:'mol Ne',atoms_per_source_formula:1,retrieved:'2026-10-08',parent_integration:'CURATED-APPEND-ONLY',subject,snapshot:snapshot('neutral-owner'),publisher_table_snapshot:snapshot('neutral-owner-table'),heat_capacity_fits:[{fit_id:'MAT:0010:THERMO:SHOMATE:GAS:01',source_id:'SRC-000999',source_locator:'data/catalog/sources/neutral-owner.txt#line=1',source_column:1,phase:'GAS',phase_label_as_reported:'SYNTHETIC SOFTWARE FIXTURE',temperature_range:{min:300,max:600,unit:'K',raw:'300 to 600'},coefficients:Object.fromEntries([...'ABCDEFGH'].map(key=>[key,{raw:key==='A'?'30':'0',value:key==='A'?30:0}])),coefficient_uncertainty:'UNKNOWN',coefficient_covariance:'UNKNOWN',reference_as_reported:'Synthetic fixture',comment_as_reported:'Synthetic fixture; not a scientific assertion',evidence_status:'PUBLISHED-EVALUATED-FIT'}]};
 const save=()=>write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[item],source_gaps:[]}));
 const rewrite=(file,change)=>{const value=YAML.parse(read(file).toString());change(value);write(file,YAML.stringify(value));subject[file===master?'identity_owner':'owner'].sha256=hash(read(file));};
 write('data/catalog/elements-baseline.json',JSON.stringify({elements:[{z:10,name:'Neon',symbol:'Ne',chapterPath:main}]}));write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[]}));save();
 const context=()=>loadThermochemistryContext(item,{identityPath:master,readBytes:read});
 const noOutputs=()=>assert(!fs.existsSync(path.join(repoRoot,`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`))&&!fs.existsSync(path.join(repoRoot,'.mat-local/thermochemistry-plot-input.json')));
 return{repoRoot,write,read,originals,item,subject,save,rewrite,context,noOutputs};
}

test('temporary Neon fixtures remove only exact approved thermal blocks and preserve owner/prefix/tail bytes',()=>{
 for(const file of [master,definition]){const bytes=original(file);assert.equal(authoredFixtureBytes(bytes,file),bytes);}
 for(const[file,suffix]of[[main,null],[tableManifest,'MAT:0010:TABLE:010'],[graphManifest,'MAT:0010:GRAPH:009']]){
  const start=suffix?`# NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`:'<!-- NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->';
  const end=suffix?`# /NIST-THERMOCHEMISTRY-CURATED-ENTRY ${suffix}`:'<!-- /NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->';
  const prefix=Buffer.from('# Authored π prefix\r\n'),tail=Buffer.from('# Unrelated retained tail\r\n<!-- OTHER-GENERATED-BLOCK -->\r\n');
  const bytes=Buffer.concat([prefix,Buffer.from(start+'\r\nSynthetic thermal fixture only\r\n'+end+'\r\n'),tail]);
  assert.deepEqual(authoredFixtureBytes(bytes,file),Buffer.concat([prefix,tail]));
  assert.throws(()=>authoredFixtureBytes(Buffer.from(start+'\nIncomplete fixture'),file));
  assert.throws(()=>authoredFixtureBytes(Buffer.concat([bytes,Buffer.from(start+'\n'+end)]),file));
  const plain=Buffer.concat([prefix,tail]);assert.equal(authoredFixtureBytes(plain,file),plain);
 }
 for(const[file,key,id]of[[tableManifest,'tables','MAT:0010:TABLE:010'],[graphManifest,'graphs','MAT:0010:GRAPH:009']]){
  const production=original(file),fixture=authoredFixtureBytes(production,file);
  assert.deepEqual(YAML.parse(fixture.toString())[key],YAML.parse(production.toString())[key].filter(entry=>entry[key==='tables'?'table_id':'graph_id']!==id));
 }
});

test('explicit neutral definition resolves both exact owners without expanding scientific scope',t=>{
 const f=fixture(t),context=f.context();assert.deepEqual(context.owners,[{file:master,sha256:hash(f.originals[master])},{file:definition,sha256:hash(f.originals[definition])}]);
 assert.equal(validateThermochemistryContext(f.item,context),f.subject);assert(validateSubject(f.subject),JSON.stringify(validateSubject.errors));
 assert.equal(context.definitionDocument.entity.evidence,'DEFINITIONAL');assert.equal(context.identityDocument.status,'BASELINE');
 assert.equal(context.definitionDocument.entity.scope,'Neutral atomic identity only; no isotope, excitation, medium or measurement condition is implied.');
 for(const file of authored)assert.deepEqual(f.read(file),f.originals[file]);f.noOutputs();
});

test('separate branch refuses inconsistent bindings and states before writes, including freshly hashed semantic corruption',t=>{
 const mutations=[
  f=>delete f.subject.identity_owner,
  f=>f.subject.identity_owner=null,
  f=>f.subject.identity_owner.sha256='0'.repeat(64),
  f=>f.subject.owner.sha256='0'.repeat(64),
  f=>f.subject.identity_owner.pointer='/properties',
  f=>f.subject.owner.pointer='/entity/atom_id',
  f=>f.subject.owner.path='records/0011-Sodium-Na/data/structured/0011-Sodium-Na-Neutral-Atom.yaml',
  f=>f.subject.owner.path=definition.replace('data/structured/','../data/structured/'),
  f=>f.subject.object_class='MOLECULE',
  f=>{f.item.source_formula='Ne2';f.item.molar_basis='mol Ne2';f.item.atoms_per_source_formula=2;},
  f=>f.item.molar_basis='mol Ne2',
  f=>f.item.atoms_per_source_formula=2,
  f=>f.item.species={source_formula:'Ne2',molar_basis:'mol Ne2',atoms_per_source_formula:2},
  f=>f.subject.spin_isomer_scope='UNSPECIFIED-IN-RETAINED-FIT',
  f=>f.subject.isotopic_composition='Ne-20',
  f=>f.subject.measurement_conditions={temperature_K:300},
  f=>f.subject.evidence='MEASURED',
  f=>f.item.heat_capacity_fits.push({...f.item.heat_capacity_fits[0],phase:'SOLID'}),
  f=>f.item.heat_capacity_fits=[],
  f=>f.rewrite(master,d=>d.registry_id='MAT:0011:REG:MASTER'),
  f=>f.rewrite(master,d=>d.record_id='MAT:0011'),
  f=>f.rewrite(master,d=>d.identity.mat_id='MAT:0011'),
  f=>f.rewrite(master,d=>d.identity.atomic_number=11),
  f=>f.rewrite(master,d=>d.identity.symbol='Na'),
  f=>f.rewrite(master,d=>d.atomic_number=11),
  f=>f.rewrite(master,d=>d.symbol='Na'),
  f=>f.rewrite(definition,d=>d.registry_id='MAT:0010:REG:OTHER'),
  f=>f.rewrite(definition,d=>d.record_id='MAT:0011'),
  f=>f.rewrite(definition,d=>d.provenance.parent_identity='MAT:0011'),
  f=>f.rewrite(definition,d=>d.entity.atom_id='MAT:0010:ATOM:Ne-20'),
  f=>f.rewrite(definition,d=>d.entity.atomic_number=11),
  f=>f.rewrite(definition,d=>d.entity.charge_in_elementary_charge_units=1),
  f=>f.rewrite(definition,d=>d.entity.electron_count=9),
  f=>f.rewrite(definition,d=>d.entity.evidence='MEASURED'),
  f=>f.rewrite(definition,d=>d.entity.scope='Measured gas at a specified temperature'),
  f=>f.rewrite(definition,d=>d.entity.temperature_K=300),
 ];
 for(const mutate of mutations){const f=fixture(t);mutate(f);f.save();const before=authored.map(f.read);assert.throws(f.context,/(Thermochemistry|thermochemistry)/);assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(Thermochemistry|thermochemistry|Curated|Elemental species molar basis mismatch)/);assert.deepEqual(authored.map(f.read),before);f.noOutputs();}
 const missing=fixture(t);fs.unlinkSync(path.join(missing.repoRoot,definition));assert.throws(missing.context,/ENOENT/);assert.throws(()=>syncThermochemistry({repoRoot:missing.repoRoot}),/ENOENT/);missing.noOutputs();
});

test('schema requires exclusive complete bindings and refuses definition aliases and molecular substitution',t=>{
 const f=fixture(t);for(const change of [s=>delete s.identity_owner,s=>s.identity_owner=null,s=>s.owner.path=master,s=>s.owner.pointer='/other',s=>s.identity_owner.pointer='/entity',s=>s.object_class='MOLECULE',s=>s.identity_owner.extra='alias',s=>s.owner.sha256='bad',s=>s.extra='mapping']){const subject=structuredClone(f.subject);change(subject);assert.equal(validateSubject(subject),false);}
});

test('synthetic import preserves actual identity bytes, links both owners and reruns byte-identically',t=>{
 const f=fixture(t);syncThermochemistry({repoRoot:f.repoRoot});
 const plot=JSON.parse(f.read('.mat-local/thermochemistry-plot-input.json'))[0],model=YAML.parse(f.read(plot.input).toString());
 assert(validateSchema(model),JSON.stringify(validateSchema.errors));assert.deepEqual(model.subject,f.subject);assert.deepEqual(plot.subject,f.subject);assert.equal(model.species.pressure.value,null);assert.equal(model.heat_capacity_fits[0].coefficient_uncertainty,'UNKNOWN');
 for(const file of [master,definition])assert.deepEqual(f.read(file),f.originals[file]);
 for(const file of [main,tableManifest,graphManifest])assert.deepEqual(f.read(file).subarray(0,f.originals[file].length),f.originals[file]);
 for(const file of [main,`${folder}/${stem}-Thermochemistry.md`]){const text=f.read(file).toString();assert(text.includes(`(data/structured/${stem}-Neutral-Atom.yaml)`));assert(text.includes(`(data/structured/${stem}.yaml)`));assert(text.includes('DEFINITIONAL'));assert(text.includes('no measured state'));}
 f.write(plot.chart,'<svg xmlns="http://www.w3.org/2000/svg"><title>Synthetic software chart only</title></svg>');
 const receipt={record_id:'MAT:0010',input:plot.input,input_sha256:hash(f.read(plot.input)),csv:plot.csv,csv_sha256:hash(f.read(plot.csv)),chart:plot.chart,chart_sha256:hash(f.read(plot.chart))};
 f.write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[receipt]}));
 const files=[...authored,plot.input,plot.csv,plot.chart,`${folder}/${stem}-Thermochemistry.md`,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.md`,'.mat-local/thermochemistry-plot-input.json'];
 const before=files.map(f.read);syncThermochemistry({repoRoot:f.repoRoot});assert.deepEqual(files.map(f.read),before);
});

test('both loaded owners are rechecked before writes if they change during planning',t=>{
 for(const owner of [master,definition]){
  const f=fixture(t),readFileSync=fs.readFileSync;let changed=false;
  const mocked=t.mock.method(fs,'readFileSync',(file,...args)=>{if(file===main&&!changed){changed=true;fs.appendFileSync(owner,'\n# Concurrent edit in software fixture only\n');}return readFileSync(file,...args);});
  try{assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/canonical owner changed during planning/);}finally{mocked.mock.restore();}
  assert(changed);f.noOutputs();for(const file of authored.filter(file=>file!==owner))assert.deepEqual(f.read(file),f.originals[file]);
 }
});

test('chart projection includes both exact owner dependencies and invalidates a changed definition',t=>{
 const f=fixture(t);syncThermochemistry({repoRoot:f.repoRoot});const plot=JSON.parse(f.read('.mat-local/thermochemistry-plot-input.json'))[0];
 f.write(plot.chart,'<svg xmlns="http://www.w3.org/2000/svg"><title>Synthetic software chart only</title></svg>');
 const bytes=new Map(),read=file=>bytes.get(file)??(fs.existsSync(path.join(f.repoRoot,file))?f.read(file):original(file));
 const set=(file,value)=>bytes.set(file,Buffer.from(JSON.stringify(value))),json=file=>JSON.parse(original(file));
 set(chartInputs.catalog,{elements:json(chartInputs.catalog).elements.filter(e=>e.z===10)});
 for(const file of [chartInputs.ame,chartInputs.ionisation,chartInputs.ameIndex,chartInputs.ionisationIndex]){const data=json(file);data.elements=data.elements.filter(e=>(e.record_id??e.mat_id)==='MAT:0010');set(file,data);}
 const receipt={record_id:'MAT:0010',input:plot.input,input_sha256:hash(f.read(plot.input)),csv:plot.csv,csv_sha256:hash(f.read(plot.csv)),chart:plot.chart,chart_sha256:hash(f.read(plot.chart)),source_id:f.item.source_id,status:'CALCULATED-FROM-PUBLISHED-FIT',calculated_rows:101,fit_count:1};
 set(chartInputs.thermal,{elements:[receipt]});set(chartInputs.thermalIndex,{elements:[f.item],source_gaps:[]});set(chartInputs.thermalAccessions,{accessions:[{z:10,source_id:f.item.source_id,retrieved:f.item.retrieved,formula:'Ne',subject:f.subject,parent_integration:f.item.parent_integration}]});
 const sources=YAML.parse(original(chartInputs.sources).toString());sources.sources.push({source_id:f.item.source_id,title:'Synthetic software fixture',url:'https://fixture.invalid/neutral-owner',retrieved:f.item.retrieved});bytes.set(chartInputs.sources,Buffer.from(YAML.stringify(sources)));
 const project=()=>buildChartProjection(root,{readBytes:absolute=>read(path.relative(root,absolute).replaceAll('\\','/'))});
 const result=project(),thermal=result.records.find(r=>r.record_id==='MAT:0010').charts.find(c=>c.family==='NIST-THERMOCHEMISTRY');assert.deepEqual(thermal.context.subject,f.subject);
 for(const file of [master,definition])assert(result.inputs.some(input=>input.path===file&&input.sha256===hash(f.read(file))));
 bytes.set(definition,Buffer.concat([f.read(definition),Buffer.from('\n# Changed fixture definition\n')]));assert.throws(project,/definition hash mismatch/);
});

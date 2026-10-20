import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync,existsSync,cpSync} from 'node:fs';
import {join,dirname,resolve,relative,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {elementalFormulaAtoms,syncThermochemistry} from '../sync-thermochemistry.mjs';

test('elemental species parsing retains molecular atom counts and rejects compounds and invalid formulae',()=>{
 for(const [formula,symbol,count]of [['Cl2','Cl',2],['Br2','Br',2],['I2','I',2],['P4','P',4],['Kr','Kr',1]])assert.equal(elementalFormulaAtoms(formula,symbol),count);
 for(const [formula,symbol]of [['H2O','H'],['NaCl','Na'],['Br','I'],['br2','Br'],['Br02','Br'],['Br0','Br'],['Br1','Br'],['Br2+','Br'],['79Br','Br'],['Br9007199254740992','Br'],[null,'Br']])assert.throws(()=>elementalFormulaAtoms(formula,symbol));
});

function fixture(t,elements){
 const repoRoot=mkdtempSync(join(tmpdir(),'mat-species-thermal-'));
 const within=relative(resolve(tmpdir()),resolve(repoRoot));
 assert.ok(!isAbsolute(within)&&/^mat-species-thermal-[^\\/]+$/.test(within));
 t.after(()=>rmSync(repoRoot,{recursive:true,force:true}));
 const write=(file,body)=>{mkdirSync(dirname(join(repoRoot,file)),{recursive:true});writeFileSync(join(repoRoot,file),body);};
 const snapshot=(stem,body)=>{const path='data/catalog/sources/'+stem+'.txt';write(path,body);return {path,url:'https://fixture.invalid/'+stem,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')};};
 write('data/catalog/elements-baseline.json',JSON.stringify({elements}));
 write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[]}));
 for(const element of elements){
  const stem=element.chapterPath.split('/')[1],folder='records/'+stem;
  write(`${folder}/data/structured/${stem}.yaml`,YAML.stringify({record_version:'1.1.1',updated:'2026-09-01',thermal:{status:'PLANNED'},completeness:{thermal:'PLANNED'}}));
  write(`${folder}/${stem}.md`,'---\nrecord_version: "1.1.1"\nupdated: "2026-09-01"\n---\n\n# 12. Thermal and Thermodynamic Properties\n\n| 1.1.0 | 2026-09-01 | Synthetic fixture parent. |\n');
  for(const [kind,key]of [['Table','tables'],['Graph','graphs']])write(`${folder}/data/structured/${stem}-${kind}-Manifest.yaml`,YAML.stringify({[key]:[]}));
 }
 return {repoRoot,write,snapshot};
}
const element=(z,name,symbol)=>({z,name,symbol,chapterPath:`records/${String(z).padStart(4,'0')}-${name}-${symbol}/${String(z).padStart(4,'0')}-${name}-${symbol}.md`});

test('molecular bromine and iodine fixtures retain the source molar basis without dividing coefficients',t=>{
 const elements=[element(35,'Bromine','Br'),element(53,'Iodine','I')],f=fixture(t,elements);
 const items=elements.map(e=>{
  const record_id='MAT:'+String(e.z).padStart(4,'0'),source_id='SRC-000999';
  return {z:e.z,name:e.name,record_id,source_id,source_formula:e.symbol+'2',molar_basis:'mol '+e.symbol+'2',atoms_per_source_formula:2,retrieved:'2026-10-05',
   snapshot:f.snapshot(e.symbol,'Synthetic coefficient fixture; not scientific data.'),publisher_table_snapshot:f.snapshot(e.symbol+'-table','Synthetic publisher-check fixture.'),
   heat_capacity_fits:[{fit_id:record_id+':THERMO:SHOMATE:GAS:01',source_id,source_locator:'synthetic-fixture',phase:'GAS',phase_label_as_reported:'TEST-FIXTURE',source_column:1,temperature_range:{min:300,max:600,unit:'K'},coefficients:Object.fromEntries([...'ABCDEFGH'].map(k=>[k,{raw:k==='A'?'30':'0',value:k==='A'?30:0}])),comment_as_reported:'Synthetic test fit'}]};
 });
 f.write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:items,source_gaps:[]}));
 const result=syncThermochemistry({repoRoot:f.repoRoot,elements:[35,53]});assert.equal(result.calculated_rows,202);
 for(const e of elements){
  const stem=e.chapterPath.split('/')[1],folder='records/'+stem;
  const data=YAML.parse(readFileSync(join(f.repoRoot,`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`),'utf8'));
  assert.equal(data.species.atoms_per_source_formula,2);assert.equal(data.species.molar_basis,'mol '+e.symbol+'2');assert.equal(data.species.gas_species,'ISOLATED-MOLECULAR-SPECIES');
  assert.equal(data.heat_capacity_fits[0].coefficients.A.value,30);
  const chapter=readFileSync(join(f.repoRoot,`${folder}/${stem}-Thermochemistry.md`),'utf8');
  assert.ok(chapter.includes(e.symbol+'₂ molecules, containing two moles'));assert.ok(chapter.includes('No factor-of-two conversion'));
  const csv=readFileSync(join(f.repoRoot,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.csv`),'utf8');assert.ok(csv.includes('"30"'));
 }
 const bad=structuredClone(items);bad[0].atoms_per_source_formula=1;f.write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:bad,source_gaps:[]}));
 assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot,elements:[35]}),/molar basis mismatch/);
});

test('linked, absent, no-match and unretrieved gaps preserve their distinct retrieval limits without numerical output',t=>{
 const elements=[element(35,'Bromine','Br'),element(108,'Hassium','Hs'),element(109,'Meitnerium','Mt')],f=fixture(t,elements);
 const indexSnapshot=f.snapshot('index','<html>NIST synthetic index <td><a href="Br.pdf">35<br>Br</a></td></html>');
 const gaps=elements.map((e,i)=>({record_id:'MAT:'+String(e.z).padStart(4,'0'),z:e.z,name:e.name,
  source_formula:i===0?'Br2':null,requested_formula:i===0?undefined:e.symbol,species_identity_status:i===0?undefined:'UNRESOLVED',
  source_id:i===2?null:'SRC-000999',retrieved:i===2?null:'2026-10-05',reviewed:i===2?'2026-10-05':undefined,retrieval_status:i===2?'NOT-RETRIEVED':undefined,
  snapshot:i===2?null:f.snapshot(e.symbol,i===1?'<html>NIST Species not found</html>':'<html>NIST synthetic elemental Br2 page without heat capacity fit</html>'),
  coverage_index:{source_id:'SRC-000341',retrieved:'2026-09-29',snapshot:indexSnapshot,element_cell_as_reported:i===0?'<td><a href="Br.pdf">35<br>Br</a></td>':null,element_cell_status:i===0?'LINKED-REQUIRES-SEPARATE-REVIEW':'ABSENT'},
  heat_capacity_status:'INSUFFICIENT DATA',fit_count:0,source_review_result:['NO-SHOMATE-IN-RETAINED-PAGE','NO-MATCH-IN-RETAINED-PAGE','LOOKUP-NOT-RETRIEVED'][i],
  scope:'Synthetic source-review fixture; no scientific measurements.',next_action:'Review an applicable primary source.'}));
 f.write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[],source_gaps:gaps}));
 assert.deepEqual(syncThermochemistry({repoRoot:f.repoRoot}),{elements:0,source_gaps:3,fits:0,calculated_rows:0});
 assert.deepEqual(JSON.parse(readFileSync(join(f.repoRoot,'.mat-local/thermochemistry-plot-input.json'),'utf8')),[]);
 for(const e of elements){
  const stem=e.chapterPath.split('/')[1],folder='records/'+stem;
  const review=YAML.parse(readFileSync(join(f.repoRoot,`${folder}/data/structured/${stem}-Thermochemistry-Source-Review.yaml`),'utf8'));
  assert.equal(review.heat_capacity.value,null);assert.equal(review.heat_capacity.uncertainty,'UNKNOWN');
  assert.ok(!existsSync(join(f.repoRoot,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.csv`)));
  const chapter=readFileSync(join(f.repoRoot,`${folder}/${stem}-Thermochemistry-Source-Review.md`),'utf8');assert.ok(!chapter.includes('undefined'));assert.ok(!chapter.includes('elemental null'));
  if(e.z===35){assert.ok(chapter.includes('requires a separate species, phase and molar-basis review'));assert.ok(!chapter.includes('marked inactive'));}
  if(e.z===108){assert.ok(chapter.includes('returned no matching species'));assert.equal(review.source_review.source_formula,null);}
  if(e.z===109){assert.ok(chapter.includes('NOT-RETRIEVED'));assert.equal(review.source_review.snapshot,null);assert.deepEqual(review.source_ids,['SRC-000341']);}
 }
 const editedPath='records/0108-Hassium-Hs/0108-Hassium-Hs-Thermochemistry-Source-Review.md';
 const before=readFileSync(join(f.repoRoot,editedPath),'utf8');f.write(editedPath,before+'Authored review correction.\n');
 assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/overwrite edited or changed source-gap output/);
 assert.equal(readFileSync(join(f.repoRoot,editedPath),'utf8'),before+'Authored review correction.\n');
});

test('atomic and molecular species owners and the four original gap records regenerate byte-identically',t=>{
 const root=join(import.meta.dirname,'../..'),read=file=>JSON.parse(readFileSync(join(root,file),'utf8'));
 const catalogue=read('data/catalog/thermochemistry-evaluation-index.json'),baseline=read('data/catalog/elements-baseline.json').elements;
 const selected=[13,17,21,32,33,34],items=catalogue.elements.filter(e=>selected.includes(e.z)),gaps=catalogue.source_gaps.filter(e=>selected.includes(e.z));
 assert.equal(items.length,2);assert.equal(gaps.length,4);
 const f=fixture(t,baseline.filter(e=>selected.includes(e.z)));
 const paths=[],copy=file=>{mkdirSync(dirname(join(f.repoRoot,file)),{recursive:true});cpSync(join(root,file),join(f.repoRoot,file));paths.push(join(f.repoRoot,file));};
 for(const item of [...items,...gaps]){
  const stem=baseline.find(e=>e.z===item.z).chapterPath.split('/')[1],folder='records/'+stem;
  for(const file of [`${folder}/${stem}.md`,`${folder}/data/structured/${stem}.yaml`])copy(file);
  if(item.heat_capacity_fits){
   for(const file of [`${folder}/${stem}-Thermochemistry.md`,`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.csv`,`${folder}/data/structured/${stem}-Table-Manifest.yaml`,`${folder}/data/structured/${stem}-Graph-Manifest.yaml`])copy(file);
   copy(read('data/quality/thermochemistry-chart-manifest.json').elements.find(receipt=>receipt.record_id===item.record_id).chart);
  }else for(const file of [`${folder}/${stem}-Thermochemistry-Source-Review.md`,`${folder}/data/structured/${stem}-Thermochemistry-Source-Review.yaml`])copy(file);
  for(const snapshot of [item.snapshot,item.publisher_table_snapshot,item.coverage_index?.snapshot].filter(Boolean)){
   mkdirSync(dirname(join(f.repoRoot,snapshot.path)),{recursive:true});cpSync(join(root,snapshot.path),join(f.repoRoot,snapshot.path));
  }
 }
 f.write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:items,source_gaps:gaps}));
 cpSync(join(root,'data/quality/thermochemistry-chart-manifest.json'),join(f.repoRoot,'data/quality/thermochemistry-chart-manifest.json'));
 const before=paths.map(p=>readFileSync(p));
 syncThermochemistry({repoRoot:f.repoRoot,elements:selected});
 assert.deepEqual(paths.map(p=>readFileSync(p)),before);
});

test('canonical thermal slots detect both manifest layouts and physical collisions before any writes',t=>{
 const cases=[
  {kind:'Graph',key:'graphs',identityKey:'id',id:'MAT:0035:GRAPH:009',file:'authored-graph.svg'},
  {kind:'Graph',key:'graphs',identityKey:'graph_id',id:'MAT:0035:GRAPH:009',file:'authored-graph.svg'},
  {kind:'Table',key:'tables',identityKey:'id',id:'MAT:0035:TABLE:010',file:'authored-table.md'},
  {kind:'Table',key:'tables',identityKey:'table_id',id:'MAT:0035:TABLE:010',file:'authored-table.md'},
  {kind:'Graph',key:'graphs',identityKey:'id',id:'MAT:0035:GRAPH:008',file:'./0035-Bromine-Br-GRAPH-009-Heat-Capacity.svg'},
  {kind:'Graph',key:'graphs',identityKey:'id',id:'MAT:0035:GRAPH:009',file:'0035-Bromine-Br-GRAPH-009-Heat-Capacity.svg',physical:true},
  {kind:'Graph',key:'graphs',identityKey:'id',id:'MAT:0035:GRAPH:009',file:'0035-Bromine-Br-GRAPH-009-Existing-Science.svg',physical:true,noManifest:true},
  {kind:'Table',key:'tables',identityKey:'id',id:'MAT:0035:TABLE:010',file:'0035-Bromine-Br-TABLE-010-Evidence.md',physical:true,noManifest:true},
  {kind:'Table',key:'tables',identityKey:'id',id:'MAT:0035:TABLE:010',file:'0035-Bromine-Br-TABLE-010-Thermodynamic-Functions.md',physical:true,noManifest:true},
  {kind:'Table',key:'tables',identityKey:'id',id:'MAT:0035:TABLE:010',file:'0035-Bromine-Br-TABLE-010-Thermodynamic-Functions.csv',physical:true,noManifest:true},
 ];
 for(const c of cases){
  const e=element(35,'Bromine','Br'),f=fixture(t,[e]),stem=e.chapterPath.split('/')[1],folder='records/'+stem,source_id='SRC-000999';
  const item={z:35,name:'Bromine',record_id:'MAT:0035',source_id,source_formula:'Br2',molar_basis:'mol Br2',atoms_per_source_formula:2,retrieved:'2026-10-05',
   snapshot:f.snapshot('Br','Synthetic slot-collision fixture.'),publisher_table_snapshot:f.snapshot('Br-table','Synthetic check fixture.'),
   heat_capacity_fits:[{fit_id:'MAT:0035:THERMO:SHOMATE:GAS:01',source_id,phase:'GAS',phase_label_as_reported:'TEST-FIXTURE',source_column:1,temperature_range:{min:300,max:600,unit:'K'},coefficients:Object.fromEntries([...'ABCDEFGH'].map(k=>[k,{raw:k==='A'?'30':'0',value:k==='A'?30:0}])),comment_as_reported:'Synthetic test fit'}]};
  f.write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[item],source_gaps:[]}));
  const manifestPath=`${folder}/data/structured/${stem}-${c.kind}-Manifest.yaml`;
  if(!c.noManifest)f.write(manifestPath,YAML.stringify({[c.key]:[{[c.identityKey]:c.id,[c.identityKey==='id'?'file':'filename']:c.file,status:'AUTHORED'}]}));
  const preserved=[`${folder}/${stem}.md`,`${folder}/data/structured/${stem}.yaml`,manifestPath];
  if(c.physical){const assetPath=`${folder}/${c.key}/${c.file}`;f.write(assetPath,'Existing authored scientific asset.');preserved.push(assetPath);}
  const before=preserved.map(file=>readFileSync(join(f.repoRoot,file))),beforeDirectory=process.cwd();
  assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(slot already owned|physical target already owned|unrecognised.*(?:chart|slot) target)/);
  assert.deepEqual(preserved.map(file=>readFileSync(join(f.repoRoot,file))),before);assert.equal(process.cwd(),beforeDirectory);
  assert.ok(!existsSync(join(f.repoRoot,`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`)));
  assert.ok(!existsSync(join(f.repoRoot,'.mat-local/thermochemistry-plot-input.json')));
 }
});

test('duplicate canonical slots and conflicting identifier aliases require manual reconciliation',t=>{
 const e=element(35,'Bromine','Br'),f=fixture(t,[e]),stem=e.chapterPath.split('/')[1],folder='records/'+stem,source_id='SRC-000999';
 const item={z:35,name:'Bromine',record_id:'MAT:0035',source_id,source_formula:'Br2',molar_basis:'mol Br2',atoms_per_source_formula:2,retrieved:'2026-10-05',
  snapshot:f.snapshot('Br','Synthetic identity-alias fixture.'),publisher_table_snapshot:f.snapshot('Br-table','Synthetic check fixture.'),
  heat_capacity_fits:[{fit_id:'MAT:0035:THERMO:SHOMATE:GAS:01',source_id,phase:'GAS',phase_label_as_reported:'TEST-FIXTURE',source_column:1,temperature_range:{min:300,max:600,unit:'K'},coefficients:Object.fromEntries([...'ABCDEFGH'].map(k=>[k,{raw:k==='A'?'30':'0',value:k==='A'?30:0}])),comment_as_reported:'Synthetic test fit'}]};
 f.write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[item],source_gaps:[]}));
 const file=`${folder}/data/structured/${stem}-Graph-Manifest.yaml`,filename=stem+'-GRAPH-009-Heat-Capacity.svg';
 for(const graphs of [[{id:'MAT:0035:GRAPH:009',filename},{graph_id:'MAT:0035:GRAPH:009',filename}],
  [{id:'MAT:0035:GRAPH:009',graph_id:'MAT:0035:GRAPH:008',filename}]]){
  f.write(file,YAML.stringify({graphs}));const before=readFileSync(join(f.repoRoot,file));
  assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot}),/(Duplicate manifest slot owners|Conflicting manifest slot identities)/);
  assert.deepEqual(readFileSync(join(f.repoRoot,file)),before);
  assert.ok(!existsSync(join(f.repoRoot,`${folder}/data/structured/${stem}-NIST-Thermochemistry.yaml`)));
 }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,rmSync,existsSync} from 'node:fs';
import {join,dirname,resolve,relative,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';
import YAML from 'yaml';
import {parseThermochemistryArgs,selectThermochemistryOwners} from '../thermochemistry-selection.mjs';
import {syncThermochemistry} from '../sync-thermochemistry.mjs';

const root=join(import.meta.dirname,'../..');
const json=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
const catalogue={elements:[{z:13,record_id:'MAT:0013'},{z:29,record_id:'MAT:0029'}],source_gaps:[{z:21,record_id:'MAT:0021'}]};

test('explicit thermal selections reject malformed, duplicate and unknown accessions',()=>{
 assert.equal(parseThermochemistryArgs([]),null);
 assert.deepEqual(parseThermochemistryArgs(['--elements','29,13']),[29,13]);
 assert.deepEqual(parseThermochemistryArgs(['--elements=29,13']),[29,13]);
 for(const raw of ['', '0','029','29,','29, 13','29.5','NaN','-1'])assert.throws(()=>parseThermochemistryArgs(['--elements',raw]));
 for(const args of [['--unknown'],['--elements'],['--elements','29','--elements','13']])assert.throws(()=>parseThermochemistryArgs(args));
 for(const selected of [[],[29,29],[30],[13,NaN],[13,Infinity]])assert.throws(()=>selectThermochemistryOwners(catalogue,selected));
 assert.deepEqual(selectThermochemistryOwners(catalogue),catalogue);
 assert.deepEqual(selectThermochemistryOwners(catalogue,[29]),{elements:[catalogue.elements[1]],source_gaps:[]});
 assert.deepEqual(selectThermochemistryOwners(catalogue,[21]),{elements:[],source_gaps:catalogue.source_gaps});
 assert.throws(()=>selectThermochemistryOwners({...catalogue,source_gaps:[{z:13,record_id:'MAT:0013'}]}),/identity/);
});

function fixture(t){
 const repoRoot=mkdtempSync(join(tmpdir(),'mat-scoped-thermal-'));
 t.after(()=>rmSync(repoRoot,{recursive:true,force:true}));
 const copy=path=>{mkdirSync(dirname(join(repoRoot,path)),{recursive:true});cpSync(join(root,path),join(repoRoot,path));};
 const write=(path,text)=>{mkdirSync(dirname(join(repoRoot,path)),{recursive:true});writeFileSync(join(repoRoot,path),text);};
 const element=json('data/catalog/thermochemistry-evaluation-index.json').elements.find(e=>e.z===13);
 const receipt=json('data/quality/thermochemistry-chart-manifest.json').elements.find(e=>e.record_id===element.record_id);
 const stem='0013-Aluminium-Al',folder='records/'+stem;
 const paths=[receipt.input,receipt.csv,`${folder}/${stem}-Thermochemistry.md`,receipt.csv.replace('.csv','.md'),
  `${folder}/${stem}.md`,`${folder}/data/structured/${stem}.yaml`,
  `${folder}/data/structured/${stem}-Table-Manifest.yaml`,`${folder}/data/structured/${stem}-Graph-Manifest.yaml`];
 for(const path of [...paths,element.snapshot.path,element.publisher_table_snapshot.path])copy(path);
 copy('data/catalog/elements-baseline.json');
 write('data/catalog/thermochemistry-evaluation-index.json',JSON.stringify({elements:[element],source_gaps:[{z:21,record_id:'MAT:0021',name:'Scandium'}]}));
 write('data/quality/thermochemistry-chart-manifest.json',JSON.stringify({elements:[receipt]}));
 const untouched='records/0021-Scandium-Sc/untouched.txt';write(untouched,'Existing source-gap work must remain unchanged.');
 return {repoRoot,paths,receipt,untouched};
}

test('scoped sync generates only selected source owners and leaves the gap package alone',t=>{
 const f=fixture(t),beforeDirectory=process.cwd();
 const result=syncThermochemistry({repoRoot:f.repoRoot,elements:[13]});
 assert.equal(result.elements,1);assert.equal(result.source_gaps,0);assert.equal(result.fits,3);assert.equal(result.calculated_rows,303);
 const plots=JSON.parse(readFileSync(join(f.repoRoot,'.mat-local/thermochemistry-plot-input.json'),'utf8'));
 assert.deepEqual(plots.map(item=>item.record_id),['MAT:0013']);
 assert.equal(readFileSync(join(f.repoRoot,f.untouched),'utf8'),'Existing source-gap work must remain unchanged.');
 assert.equal(process.cwd(),beforeDirectory);
});

test('unknown selection and edited generated inputs fail before any output writes',t=>{
 const f=fixture(t),read=path=>readFileSync(join(f.repoRoot,path),'utf8');
 const before=f.paths.map(read),beforeDirectory=process.cwd();
 assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot,elements:[13,30]}),/No thermochemistry accession/);
 assert.deepEqual(f.paths.map(read),before);assert.equal(process.cwd(),beforeDirectory);
 writeFileSync(join(f.repoRoot,f.receipt.csv),before[f.paths.indexOf(f.receipt.csv)]+'Edited rows\n');
 const edited=f.paths.map(read);
 assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot,elements:[13]}),/edited output/);
 assert.deepEqual(f.paths.map(read),edited);assert.equal(process.cwd(),beforeDirectory);
 writeFileSync(join(f.repoRoot,f.receipt.input),read(f.receipt.input)+'# Unreviewed edit\n');
 const editedYaml=f.paths.map(read);
 assert.throws(()=>syncThermochemistry({repoRoot:f.repoRoot,elements:[13]}),/edited output/);
 assert.deepEqual(f.paths.map(read),editedYaml);
});

test('a gap-only scoped sync emits reviews and no numeric plots while preserving unselected fit owners',t=>{
 const f=fixture(t),temporaryRelative=relative(resolve(tmpdir()),resolve(f.repoRoot));
 // Verify the existing fixture cleanup target is inside its task-specific temporary directory.
 assert.ok(!isAbsolute(temporaryRelative)&&/^mat-scoped-thermal-[^\\/]+$/.test(temporaryRelative));
 const index=json('data/catalog/thermochemistry-evaluation-index.json'),gaps=[21,32].map(z=>index.source_gaps.find(gap=>gap.z===z));
 assert.ok(gaps.every(Boolean),'Reviewed Scandium/Germanium gap fixtures must exist.');
 const fit=index.elements.find(element=>element.z===13);
 const copy=path=>{mkdirSync(dirname(join(f.repoRoot,path)),{recursive:true});cpSync(join(root,path),join(f.repoRoot,path));};
 for(const gap of gaps){
  const stem=json('data/catalog/elements-baseline.json').elements.find(element=>element.z===gap.z).chapterPath.split('/')[1];
  // Leave review outputs absent so this exercises creating the gap package, not only refreshing it.
  for(const path of [`records/${stem}/${stem}.md`,`records/${stem}/data/structured/${stem}.yaml`,gap.snapshot.path,gap.coverage_index.snapshot.path])copy(path);
 }
 writeFileSync(join(f.repoRoot,'data/catalog/thermochemistry-evaluation-index.json'),JSON.stringify({elements:[fit],source_gaps:gaps}));
 const preserved=[...f.paths,'data/quality/thermochemistry-chart-manifest.json',f.untouched],before=preserved.map(path=>readFileSync(join(f.repoRoot,path))),beforeDirectory=process.cwd();
 const result=syncThermochemistry({repoRoot:f.repoRoot,elements:[21,32]});
 assert.deepEqual(result,{elements:0,source_gaps:2,fits:0,calculated_rows:0});
 assert.deepEqual(JSON.parse(readFileSync(join(f.repoRoot,'.mat-local/thermochemistry-plot-input.json'),'utf8')),[]);
 assert.deepEqual(preserved.map(path=>readFileSync(join(f.repoRoot,path))),before);assert.equal(process.cwd(),beforeDirectory);
 for(const gap of gaps){
  const stem=gap.record_id==='MAT:0021'?'0021-Scandium-Sc':'0032-Germanium-Ge',folder='records/'+stem;
  const review=YAML.parse(readFileSync(join(f.repoRoot,`${folder}/data/structured/${stem}-Thermochemistry-Source-Review.yaml`),'utf8'));
  assert.equal(review.record_id,gap.record_id);assert.deepEqual(review.source_review,gap);
  assert.equal(review.heat_capacity.value,null);assert.equal(review.heat_capacity.uncertainty,'UNKNOWN');assert.equal(review.derived_tables_and_charts,'NOT-GENERATED; NO-ACCEPTED-FIT');
  assert.ok(!existsSync(join(f.repoRoot,`${folder}/tables/${stem}-TABLE-010-Thermodynamic-Functions.csv`)));
  assert.ok(!existsSync(join(f.repoRoot,`${folder}/graphs/${stem}-GRAPH-009-Heat-Capacity.svg`)));
 }
});

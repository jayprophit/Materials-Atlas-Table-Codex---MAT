import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import Ajv from 'ajv';
import {fitSamples,shomate} from './thermochemistry.mjs';
import {frontMatter} from './lib.mjs';
process.chdir(path.resolve(import.meta.dirname,'..'));
const json=p=>JSON.parse(fs.readFileSync(p,'utf8')),yaml=p=>YAML.parse(fs.readFileSync(p,'utf8'));
const validate=new Ajv({allErrors:true}).compile(json('data/schema/1.0.0/thermochemistry-evaluation.schema.json'));
const validateGap=new Ajv({allErrors:true}).compile(json('data/schema/1.0.0/thermochemistry-source-review.schema.json'));
const catalogue=json('data/catalog/thermochemistry-evaluation-index.json');
const receipts=json('data/quality/thermochemistry-chart-manifest.json');
const sources=new Map(yaml('data/registries/sources.yaml').sources.map(s=>[s.source_id,s]));
const ids=new Set();let rows=0;
for(const item of catalogue.elements){
 const receipt=receipts.elements.find(r=>r.record_id===item.record_id);assert.ok(receipt);
 const data=yaml(receipt.input);assert.ok(validate(data),JSON.stringify(validate.errors));
 assert.equal(data.record_id,item.record_id);assert.equal(data.source_id,item.source_id);
 assert.equal(data.species.source_formula,item.source_formula);assert.equal(data.species.molar_basis,'mol '+item.source_formula);
 assert.equal(data.evaluation.retrieved,item.retrieved);
 assert.deepEqual(data.heat_capacity_fits,item.heat_capacity_fits);
 assert.deepEqual(data.review_notes??[],item.review_notes??[]);
 const source=sources.get(item.source_id);assert.ok(source,'Missing source '+item.source_id);assert.equal(source.sha256,item.snapshot.sha256);
 assert.equal(String(source.retrieved),item.retrieved);assert.equal(source.local_path,item.snapshot.path);
 assert.equal(source.comparison_table_sha256,item.publisher_table_snapshot.sha256);
 const recordFolder=receipt.input.split('/').slice(0,2).join('/'),stem=recordFolder.split('/')[1];
 const parent=yaml(`${recordFolder}/data/structured/${stem}.yaml`);
 const chapter=frontMatter(fs.readFileSync(`${recordFolder}/${stem}.md`,'utf8'));
 for(const note of item.review_notes??[])assert.ok(fs.readFileSync(`${recordFolder}/${stem}-Thermochemistry.md`,'utf8').includes(note.text),'Scientific fit review note missing from reader');
 assert.equal(chapter.record_version,parent.record_version,'Parent revision metadata must agree');
 assert.equal(String(chapter.updated),String(parent.updated),'Parent update dates must agree');
 const graph=yaml(`${recordFolder}/data/structured/${stem}-Graph-Manifest.yaml`).graphs.find(g=>g.graph_id===item.record_id+':GRAPH:009');
 const table=yaml(`${recordFolder}/data/structured/${stem}-Table-Manifest.yaml`).tables.find(t=>t.table_id===item.record_id+':TABLE:010');
 for(const asset of [graph,table]){assert.equal(asset.status,'GENERATED');assert.equal(asset.evidence_status,'CALCULATED-FROM-PUBLISHED-FIT');}
 assert.equal(path.resolve(recordFolder,'graphs','data',graph.data_filename),path.resolve(receipt.csv),'Graph must resolve to the single canonical CSV');
 assert.equal(path.resolve(recordFolder,'tables',table.data_filename),path.resolve(receipt.csv),'Table must resolve to the same CSV');
 for(const sourceFile of [item.snapshot,item.publisher_table_snapshot]){
  const bytes=fs.readFileSync(sourceFile.path);assert.equal(bytes.length,sourceFile.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),sourceFile.sha256);
 }
 for(const [file,hash]of [[receipt.input,receipt.input_sha256],[receipt.csv,receipt.csv_sha256],[receipt.chart,receipt.chart_sha256]])assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash);
 assert.ok(fs.readFileSync(receipt.chart,'utf8').includes('retrieved '+item.retrieved+'.'),'Chart must carry its own accession date');
 for(const fit of data.heat_capacity_fits){
  assert.ok(!ids.has(fit.fit_id),'Duplicate fit ID');ids.add(fit.fit_id);assert.ok(fit.fit_id.startsWith(item.record_id+':'));
  assert.equal(fit.source_id,item.source_id);assert.ok(fit.temperature_range.min<fit.temperature_range.max);
  assert.ok(fs.existsSync(fit.source_locator.split('#')[0]));
  for(const p of fitSamples(fit)){
   assert.ok(p.heat_capacity_J_mol_K>0&&Number.isFinite(p.entropy_J_mol_K)&&Number.isFinite(p.enthalpy_increment_kJ_mol));
   assert.equal(p.uncertainty,'UNKNOWN');rows++;
  }
 }
 for(const check of item.publisher_calculation_checks){
  const fit=item.heat_capacity_fits.find(f=>f.fit_id===check.candidate_fit_ids[0]);assert.ok(fit);
  const calculated=shomate(fit,check.temperature_K);
  for(const [field,index]of [['heat_capacity_J_mol_K',1],['entropy_J_mol_K',2],['enthalpy_increment_kJ_mol',4]]){
   const decimals=check.raw[index].split('.')[1]?.length??0;
   const tolerance=.5*10**(-decimals)+1e-7;
   assert.ok(Math.abs(calculated[field]-check[field])<=tolerance,`${fit.fit_id} ${check.temperature_K} ${field}: ${calculated[field]} vs ${check[field]}`);
  }
 }
}
const baseline=json('data/catalog/elements-baseline.json').elements;
for(const gap of catalogue.source_gaps??[]){
 assert.ok(!catalogue.elements.some(e=>e.record_id===gap.record_id),'A no-fit accession must not also supply calculated data');
 assert.ok(!receipts.elements.some(e=>e.record_id===gap.record_id),'A source gap must not create a chart');
 assert.equal(gap.fit_count,0);assert.equal(gap.heat_capacity_status,'INSUFFICIENT DATA');
 const stem=baseline.find(e=>e.z===gap.z).chapterPath.split('/')[1],folder='records/'+stem;
 const dataPath=`${folder}/data/structured/${stem}-Thermochemistry-Source-Review.yaml`;
 const data=yaml(dataPath);assert.ok(validateGap(data),JSON.stringify(validateGap.errors));
 assert.deepEqual(data.source_review,gap);assert.equal(data.record_id,gap.record_id);
 assert.equal(data.heat_capacity.value,null);assert.equal(data.scientific_completion,'PENDING');
 for(const [id,snapshot]of [[gap.source_id,gap.snapshot],[gap.coverage_index.source_id,gap.coverage_index.snapshot]]){
  const source=sources.get(id);assert.ok(source,'Missing gap source '+id);
  const bytes=fs.readFileSync(snapshot.path);assert.equal(bytes.length,snapshot.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),snapshot.sha256);
  assert.equal(source.sha256,snapshot.sha256);assert.equal(source.local_path,snapshot.path);
 }
 assert.ok(!fs.readFileSync(gap.snapshot.path,'utf8').includes('Heat Capacity (Shomate Equation)'));
 assert.ok(!gap.coverage_index.element_cell_as_reported.includes('<a '));
 assert.ok(fs.readFileSync(gap.coverage_index.snapshot.path,'utf8').includes(gap.coverage_index.element_cell_as_reported));
 const parent=yaml(`${folder}/data/structured/${stem}.yaml`),chapter=frontMatter(fs.readFileSync(`${folder}/${stem}.md`,'utf8'));
 assert.equal(parent.thermal.status,'PLANNED');assert.equal(parent.thermal.source_review_status,'INSUFFICIENT DATA');
 assert.equal(parent.thermal.source_review_file,dataPath);assert.equal(parent.completeness.thermal,'PLANNED');
 assert.equal(chapter.record_version,parent.record_version);assert.equal(String(chapter.updated),String(parent.updated));
}
assert.equal(catalogue.fit_count,ids.size);assert.equal(catalogue.element_count,catalogue.elements.length);
assert.equal(catalogue.source_gap_count,catalogue.source_gaps.length);
console.log(JSON.stringify({suite:'thermochemistry',elements:catalogue.elements.length,source_gaps:catalogue.source_gaps.length,unique_fits:ids.size,calculated_rows:rows,status:'PASS'}));

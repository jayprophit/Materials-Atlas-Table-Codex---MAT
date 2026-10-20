import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {buildChartProjection,chartInputs} from '../mat-chart-projection.mjs';
import {csvFields} from '../nist-ionisation.mjs';
const root=resolve(import.meta.dirname,'../..'),hash=bytes=>createHash('sha256').update(bytes).digest('hex');

// All mutations below exist only in memory; retained scientific files remain unchanged.
function fixture(wantedIds=['MAT:0001','MAT:0013','MAT:0118']){
 const bytes=new Map(),wanted=new Set(wantedIds);
 const read=path=>bytes.get(path)??readFileSync(resolve(root,path));
 const json=path=>JSON.parse(read(path).toString('utf8'));
 const set=(path,data)=>bytes.set(path,Buffer.from(JSON.stringify(data)));
 set(chartInputs.catalog,{elements:json(chartInputs.catalog).elements.filter(element=>wanted.has(element.matId))});
 for(const path of [chartInputs.ame,chartInputs.ionisation,chartInputs.thermal,chartInputs.ameIndex,chartInputs.ionisationIndex,chartInputs.thermalIndex]){
  const value=json(path);value.elements=value.elements.filter(element=>wanted.has(element.record_id??element.mat_id));if(value.source_gaps)value.source_gaps=value.source_gaps.filter(element=>wanted.has(element.record_id));set(path,value);
 }
 const project=()=>buildChartProjection(root,{readBytes:absolute=>read(relative(root,absolute).replaceAll('\\','/'))});
 return {bytes,read,json,set,project};
}

test('chart projection preserves source values, qualifiers, zero and explicit no-data across selected owners',()=>{
 const f=fixture(),report=f.project();assert.equal(report.records.length,4);
 assert(report.records[0].charts.every(chart=>chart.status==='NOT-APPLICABLE'&&chart.svg===null&&chart.rows.length===0));
 const hydrogen=report.records.find(record=>record.record_id==='MAT:0001');
 const binding=hydrogen.charts.find(chart=>chart.family==='AME2020');
 assert.equal(binding.rows.find(row=>row[0]===1)[1],0);assert.equal(binding.rows.find(row=>row[0]===1)[2],0);
 assert.match(binding.context.reference_state,/atomic-mass convention/);
 const ionisation=hydrogen.charts.find(chart=>chart.family==='NIST-IONISATION');
 assert.equal(ionisation.rows[0][1],13.598434599702);assert.equal(ionisation.rows[0][3],'THEORETICAL');
 assert.equal(ionisation.context.scale,'LOGARITHMIC');assert.equal(ionisation.sources[0].source_id,'SRC-000005');
 const oganesson=report.records.find(record=>record.record_id==='MAT:0118');
 assert(oganesson.charts.find(chart=>chart.family==='AME2020').rows.every(row=>row[3]==='ESTIMATED-FROM-SYSTEMATICS'));
 const missing=oganesson.charts.find(chart=>chart.family==='NIST-IONISATION');
 assert.equal(missing.svg,null);assert.equal(missing.status,'INSUFFICIENT-DATA');assert.equal(missing.rows.length,0);
 assert.match(report.notice,/Legacy unsourced abundance/);assert(!JSON.stringify(report).includes('abundanceDatasets'));
 const thermal=report.records.find(record=>record.record_id==='MAT:0013').charts.find(chart=>chart.family==='NIST-THERMOCHEMISTRY');
 assert.equal(thermal.context.reference_state,'mol Al');assert.equal(thermal.context.evidence,'CALCULATED-FROM-PUBLISHED-FIT; not new measurement');
 assert(thermal.rows.every(row=>row[5]==='UNKNOWN'));assert(thermal.context.fit_intervals.every(fit=>fit.coefficient_uncertainty==='UNKNOWN'));
 assert(report.inputs.some(input=>input.path===thermal.csv));
});

test('all 84 remaining elements retain their actual thermal source outcome and species basis',()=>{
 const report=buildChartProjection(root),catalog=JSON.parse(readFileSync(resolve(root,chartInputs.catalog),'utf8'));
 const thermalIndex=JSON.parse(readFileSync(resolve(root,chartInputs.thermalIndex),'utf8'));
 const remaining=catalog.elements.filter(element=>element.z>=35&&element.z<=118);
 assert.equal(remaining.length,84);assert.equal(report.summary.available_by_family['NIST-THERMOCHEMISTRY'],thermalIndex.element_count);
 for(const element of remaining){
  const record=report.records.find(record=>record.record_id===element.matId),chart=record.charts.find(chart=>chart.family==='NIST-THERMOCHEMISTRY');
  const fit=thermalIndex.elements.find(owner=>owner.record_id===element.matId),gap=thermalIndex.source_gaps.find(owner=>owner.record_id===element.matId);
  assert.equal(Number(Boolean(fit))+Number(Boolean(gap)),1,element.matId+' must have one accepted fit owner or one source review');
  assert.equal(record.name,element.name);assert.equal(record.chapter,element.chapterPath);
  const stem=element.chapterPath.split('/')[1],folder='records/'+stem+'/';
  if(fit){
   assert.equal(chart.status,'AVAILABLE');assert(chart.rows.length>0);assert(chart.svg.startsWith(folder));assert(chart.csv.startsWith(folder));
   assert.equal(chart.owner,folder+'data/structured/'+stem+'-NIST-Thermochemistry.yaml');assert.equal(chart.chapter,folder+stem+'-Thermochemistry.md');
   assert.deepEqual(chart.sources.map(source=>source.source_id),[fit.source_id]);assert.equal(chart.sources[0].url,fit.snapshot.url);
   assert.equal(chart.context.reference_state,fit.molar_basis);assert.equal(chart.context.species.source_formula,fit.source_formula);
   assert.equal(chart.context.species.atoms_per_source_formula,fit.atoms_per_source_formula);
   assert.equal(chart.context.fit_intervals.length,fit.heat_capacity_fits.length);
   assert(chart.rows.every(row=>row[5]==='UNKNOWN'&&row[6]==='CALCULATED-FROM-PUBLISHED-FIT'));
  }else{
   assert.equal(chart.status,'INSUFFICIENT-DATA');assert.equal(chart.svg,null);assert.equal(chart.csv,null);assert.deepEqual(chart.rows,[]);assert.deepEqual(chart.columns,[]);
   assert.equal(chart.owner,folder+'data/structured/'+stem+'-Thermochemistry-Source-Review.yaml');assert.equal(chart.chapter,folder+stem+'-Thermochemistry-Source-Review.md');
   assert.deepEqual(chart.context.source_review,gap);assert.equal(gap.fit_count,0);assert.equal(gap.heat_capacity_status,'INSUFFICIENT DATA');
   assert.deepEqual(chart.sources.map(source=>source.source_id),[gap.source_id,gap.coverage_index.source_id].filter(Boolean));
   assert.equal(chart.sources.find(source=>source.source_id===gap.source_id).url,gap.snapshot.url);
   const review=YAML.parse(readFileSync(resolve(root,chart.owner),'utf8'));
   assert.equal(review.heat_capacity.value,null);assert.equal(review.heat_capacity.uncertainty,'UNKNOWN');assert.equal(review.scientific_completion,'PENDING');
   assert.match(chart.reason,/not global absence of data/);
   if(element.z>=111){
    assert.equal(gap.source_review_result,'NO-MATCH-IN-RETAINED-PAGE');assert.equal(gap.source_formula,null);assert.equal(gap.requested_formula,element.symbol);
    assert.equal(gap.species_identity_status,'UNRESOLVED');assert.equal(new URL(gap.snapshot.url).searchParams.get('Name'),element.name);
    assert.equal(gap.coverage_index.element_cell_status,'UNLINKED');assert.equal(gap.coverage_index.source_id,'SRC-000341');
   }
  }
 }
 for(const [id,formula] of [['MAT:0035','Br2'],['MAT:0053','I2']]){
  const chart=report.records.find(record=>record.record_id===id).charts.find(chart=>chart.family==='NIST-THERMOCHEMISTRY');
  assert.equal(chart.context.reference_state,'mol '+formula);assert.equal(chart.context.species.source_formula,formula);
  assert.equal(chart.context.species.atoms_per_source_formula,2);assert.equal(chart.context.species.gas_species,'ISOLATED-MOLECULAR-SPECIES');
  assert.match(chart.context.interpretation.gas,/do not compute.+dissociation/);
  assert.match(readFileSync(resolve(root,chart.chapter),'utf8'),/two moles of.+atoms/);
 }
});

test('corrupted source-review owners cannot publish a gap as a numeric value or completed science',()=>{
 const stem='0039-Yttrium-Y',owner=`records/${stem}/data/structured/${stem}-Thermochemistry-Source-Review.yaml`;
 for(const mutate of [review=>{review.heat_capacity.value=0;},review=>{review.heat_capacity.uncertainty=0;},review=>{review.scientific_completion='COMPLETE';},review=>{review.source_review.source_formula='Y2';}]){
  const f=fixture(['MAT:0039']),review=YAML.parse(f.read(owner).toString('utf8'));mutate(review);f.bytes.set(owner,Buffer.from(YAML.stringify(review)));
  assert.throws(f.project,/source-review owner\/index mismatch MAT:0039/);
 }
});

test('unknown uncertainty is preserved without being treated as zero',()=>{
 const f=fixture(),receipts=f.json(chartInputs.ionisation),entry=receipts.elements.find(element=>element.record_id==='MAT:0001');
 const model=YAML.parse(f.read(entry.input).toString('utf8'));model.entries[0].ionisation_energy.uncertainty=null;
 const text=YAML.stringify(model);f.bytes.set(entry.input,Buffer.from(text));entry.input_sha256=hash(text);f.set(chartInputs.ionisation,receipts);
 const chart=f.project().records.find(record=>record.record_id==='MAT:0001').charts.find(chart=>chart.family==='NIST-IONISATION');
 assert.equal(chart.rows[0][2],null);assert.match(chart.context.uncertainty,/UNKNOWN/);
});

test('stale SVG/data hashes and absent receipt hashes block publication',()=>{
 let f=fixture(),entry=f.json(chartInputs.ame).elements[0];f.bytes.set(entry.chart,Buffer.from(f.read(entry.chart).toString('utf8')+'\n<!-- test mutation -->'));
 assert.throws(f.project,/stale owner hash/);
 f=fixture();entry=f.json(chartInputs.ionisation).elements[0];f.bytes.set(entry.input,Buffer.from(f.read(entry.input).toString('utf8')+'\n# test mutation'));
 assert.throws(f.project,/stale owner hash/);
 f=fixture();const receipts=f.json(chartInputs.ame);delete receipts.elements[0].sha256;f.set(chartInputs.ame,receipts);
 assert.throws(f.project,/missing chart hash/);
});

test('source attribution, identity and repository path mismatches block projection',()=>{
 let f=fixture(),receipts=f.json(chartInputs.ame);receipts.elements[0].source_ids=['SRC-000008'];f.set(chartInputs.ame,receipts);
 assert.throws(f.project,/point\/source mismatch/);
 f=fixture();const catalogue=f.json(chartInputs.catalog);catalogue.elements.push(catalogue.elements[0]);f.set(chartInputs.catalog,catalogue);
 assert.throws(f.project,/catalogue coverage/);
 f=fixture();const index=f.json(chartInputs.ameIndex);index.elements[0].chapter='records/0001-Hydrogen-H/../../../../outside.md';f.set(chartInputs.ameIndex,index);
 assert.throws(f.project,/leaves repository/);
});

test('thermal CSV retains valid fit/phase/basis boundaries and fails out-of-range rows',()=>{
 const f=fixture(),receipts=f.json(chartInputs.thermal),entry=receipts.elements[0];
 const model=YAML.parse(f.read(entry.input).toString('utf8')),lines=f.read(entry.csv).toString('utf8').trimEnd().split(/\r?\n/);
 const row=csvFields(lines[1]),fit=model.heat_capacity_fits.find(fit=>fit.fit_id===row[0]);row[5]=String(fit.temperature_range.max+1);
 lines[1]=row.map(value=>'"'+value.replaceAll('"','""')+'"').join(',');const csv=lines.join('\n')+'\n';
 f.bytes.set(entry.csv,Buffer.from(csv));entry.csv_sha256=hash(csv);f.set(chartInputs.thermal,receipts);
 assert.throws(f.project,/invalid thermal CSV row\/state/);
});

test('chart projection does not accept incomplete or duplicate receipt coverage',()=>{
 let f=fixture(),receipts=f.json(chartInputs.ame);receipts.elements.pop();f.set(chartInputs.ame,receipts);assert.throws(f.project,/incomplete AME2020 coverage/);
 f=fixture();receipts=f.json(chartInputs.thermal);receipts.elements.push(receipts.elements[0]);f.set(chartInputs.thermal,receipts);assert.throws(f.project,/duplicate or unknown/);
});

test('thermal CSV rejects missing numeric values, nonphysical Cp, and forged evidence despite refreshed hashes',()=>{
 for(const [column,value] of [[5,''],[6,' '],[7,''],[8,'not available'],[6,'0'],[6,'-1'],[9,'0'],[10,'MEASURED']]){
  const f=fixture(),receipts=f.json(chartInputs.thermal),entry=receipts.elements[0];
  const lines=f.read(entry.csv).toString('utf8').trimEnd().split(/\r?\n/),row=csvFields(lines[1]);row[column]=value;
  lines[1]=row.map(value=>'"'+value.replaceAll('"','""')+'"').join(',');const csv=lines.join('\n')+'\n';
  f.bytes.set(entry.csv,Buffer.from(csv));entry.csv_sha256=hash(csv);f.set(chartInputs.thermal,receipts);
  assert.throws(f.project,/invalid thermal CSV row\/state/,`column ${column}, value ${JSON.stringify(value)}`);
 }
});

test('a hash-consistent finite thermal value cannot diverge from the retained fit and SVG owner',()=>{
 const f=fixture(),receipts=f.json(chartInputs.thermal),entry=receipts.elements[0];
 const lines=f.read(entry.csv).toString('utf8').trimEnd().split(/\r?\n/),row=csvFields(lines[1]);row[6]='999';
 lines[1]=row.map(value=>'"'+value.replaceAll('"','""')+'"').join(',');const csv=lines.join('\n')+'\n';
 f.bytes.set(entry.csv,Buffer.from(csv));entry.csv_sha256=hash(csv);f.set(chartInputs.thermal,receipts);
 assert.throws(f.project,/thermal CSV\/fit calculation mismatch/);
});

test('live read-only projection covers the canonical catalogue with explicit missing states',()=>{
 const report=buildChartProjection(root),catalog=JSON.parse(readFileSync(resolve(root,chartInputs.catalog),'utf8'));
 assert.equal(report.records.length,catalog.elements.length+1);
 assert.equal(report.summary.available_by_family.AME2020,catalog.elements.length);
 assert.equal(report.summary.available_by_family['NIST-IONISATION'],110);
 assert(report.summary.available_by_family['NIST-THERMOCHEMISTRY']>=18);
 assert(report.records.every(record=>record.charts.length===3));
 assert(report.records.filter(record=>record.kind==='CONFIRMED-ELEMENT').every(record=>record.charts[0].status==='AVAILABLE'));
 const material=report.records.find(record=>record.record_id==='MAT:0026').material_charts[0];
 assert.equal(report.summary.material_composition_charts,1);assert.equal(material.material_ref,'MAT:0026:MATERIAL:NIST-SRM-126c');
 assert.equal(material.chart.context.coverage,'PARTIAL');assert.equal(material.chart.context.reported_sum_wt_percent,36.872);
 assert.equal(material.chart.context.unassigned_identity,'UNKNOWN');assert.equal(material.chart.context.combined_uncertainty,null);
 assert.equal(material.chart.rows.length,11);assert.equal(material.steps.length,4);assert.equal(material.chart.sources[0].source_id,'SRC-000346');
 assert.equal(material.chart.rows.find(row=>row[5]==='INFORMATION')[3],null);assert.equal(material.chart.context.standalone_panel_credit,0);
 assert(report.inputs.some(input=>input.path==='data/quality/material-visuals-srm126c.json'));
 const gallium=report.records.find(record=>record.record_id==='MAT:0031').charts.find(chart=>chart.family==='NIST-THERMOCHEMISTRY');
 assert.equal(gallium.status,'AVAILABLE');assert.equal(gallium.sources[0].source_id,'SRC-000349');
 assert.equal(gallium.context.reference_state,'mol Ga');assert.equal(gallium.context.species.source_formula,'Ga');
 assert.equal(gallium.context.x_unit,'K');assert.equal(gallium.context.y_unit,'J mol⁻¹ K⁻¹');
 assert.equal(gallium.context.fit_intervals.length,3);assert.equal(gallium.rows.length,303);
 assert.deepEqual(new Set(gallium.context.fit_intervals.map(fit=>fit.phase)),new Set(['SOLID','LIQUID','GAS']));
 assert(gallium.context.fit_intervals.every(fit=>fit.coefficient_uncertainty==='UNKNOWN'&&fit.coefficient_covariance==='UNKNOWN'));
 assert(gallium.rows.every(row=>Number(row[3])>0&&Number(row[4])>0&&row[5]==='UNKNOWN'&&row[6]==='CALCULATED-FROM-PUBLISHED-FIT'));
 assert.equal(gallium.owner,'records/0031-Gallium-Ga/data/structured/0031-Gallium-Ga-NIST-Thermochemistry.yaml');
 assert.equal(gallium.chapter,'records/0031-Gallium-Ga/0031-Gallium-Ga-Thermochemistry.md');
 assert.match(gallium.csv,/^records\/0031-Gallium-Ga\/tables\/0031-Gallium-Ga-.+\.csv$/);
 assert.match(gallium.svg,/^records\/0031-Gallium-Ga\/graphs\/0031-Gallium-Ga-.+\.svg$/);
 for(const [id,stem,formula,sourceId] of [['MAT:0032','0032-Germanium-Ge','Ge','SRC-000350'],['MAT:0033','0033-Arsenic-As','As','SRC-000351'],['MAT:0034','0034-Selenium-Se','Se','SRC-000352']]){
  const gap=report.records.find(record=>record.record_id===id).charts.find(chart=>chart.family==='NIST-THERMOCHEMISTRY');
  assert.equal(gap.status,'INSUFFICIENT-DATA');assert.equal(gap.svg,null);assert.equal(gap.csv,null);assert.equal(gap.rows.length,0);
  assert.equal(gap.owner,`records/${stem}/data/structured/${stem}-Thermochemistry-Source-Review.yaml`);
  assert.equal(gap.chapter,`records/${stem}/${stem}-Thermochemistry-Source-Review.md`);
  assert.deepEqual(new Set(gap.sources.map(source=>source.source_id)),new Set([sourceId,'SRC-000341']));assert.equal(gap.context.source_review.record_id,id);
  assert.equal(gap.context.source_review.source_formula,formula);
  assert.equal(gap.context.source_review.fit_count,0);assert.equal(gap.context.source_review.source_review_result,'NO-SHOMATE-IN-RETAINED-PAGE');
  assert.match(gap.reason,/not global absence of data/);
 }
});

test('Hydrogen thermal chart binds molecular H2, preserves gas scope and rejects stale or substituted subjects',()=>{
 const f=fixture(['MAT:0001']),report=f.project(),chart=report.records.find(r=>r.record_id==='MAT:0001').charts.find(c=>c.family==='NIST-THERMOCHEMISTRY');
 assert.equal(chart.status,'AVAILABLE');assert.equal(chart.context.reference_state,'mol H2');assert.equal(chart.context.species.atoms_per_source_formula,2);
 assert.equal(chart.context.subject.object_ref,'MAT:0001:MOL:H2');assert.equal(chart.context.subject.object_class,'MOLECULE');
 assert.equal(chart.context.subject.spin_isomer_scope,'UNSPECIFIED-IN-RETAINED-FIT');assert.equal(chart.context.subject.isotopic_composition,'UNSPECIFIED-IN-RETAINED-FIT');
 assert.equal(chart.rows.length,303);assert.deepEqual(chart.context.fit_intervals.map(f=>[f.phase,f.temperature_range.min,f.temperature_range.max]),[['GAS',298,1000],['GAS',1000,2500],['GAS',2500,6000]]);
 assert.equal(chart.sources[0].source_id,'SRC-000508');assert.equal(chart.sources[0].url,'https://webbook.nist.gov/cgi/cbook.cgi?ID=C1333740&Mask=1');
 const identityPath=chart.context.subject.owner.path;assert(report.inputs.some(i=>i.path===identityPath));
 f.bytes.set(identityPath,Buffer.from(f.read(identityPath).toString('utf8')+'\n# stale canonical identity\n'));assert.throws(f.project,/hash/i);
 for(const mutate of [model=>{model.subject.object_ref='MAT:0001:ATOM:H';},model=>{model.subject.owner.pointer='/atomic_properties';},model=>{model.subject.owner.path='records/0002-Helium-He/data/structured/0002-Helium-He.yaml';},model=>{delete model.subject;},model=>{delete model.parent_integration;},model=>{delete model.parent_integration;delete model.subject;}]){
  const g=fixture(['MAT:0001']),receipts=g.json(chartInputs.thermal),receipt=receipts.elements[0],model=YAML.parse(g.read(receipt.input).toString('utf8'));mutate(model);
  const text=YAML.stringify(model);g.bytes.set(receipt.input,Buffer.from(text));receipt.input_sha256=hash(text);g.set(chartInputs.thermal,receipts);
  // Even agreeing catalogue/data metadata cannot bypass the actual canonical object binding.
  const index=g.json(chartInputs.thermalIndex),item=index.elements[0];item.subject=model.subject;item.parent_integration=model.parent_integration;g.set(chartInputs.thermalIndex,index);
  assert.throws(g.project,/subject|curated|identity|owner|binding|molecular|integration|object/i);
 }
});

test('Helium thermal chart binds monatomic gas and reviewed spare slots without changing dimer ownership',()=>{
 const f=fixture(['MAT:0002']),report=f.project(),chart=report.records.find(r=>r.record_id==='MAT:0002').charts.find(c=>c.family==='NIST-THERMOCHEMISTRY');
 assert.equal(chart.status,'AVAILABLE');assert.equal(chart.context.reference_state,'mol He');assert.equal(chart.context.species.atoms_per_source_formula,1);assert.equal(chart.context.subject.object_ref,'MAT:0002:ATOM:He');assert.equal(chart.context.subject.object_class,'ATOM');assert.equal(chart.context.subject.spin_isomer_scope,'NOT-APPLICABLE-TO-MONATOMIC-SPECIES');assert.equal(chart.context.subject.isotopic_composition,'UNSPECIFIED-IN-RETAINED-FIT');assert.deepEqual(chart.context.asset_slots,{table:10,graph:10});assert.equal(chart.rows.length,101);assert.deepEqual(chart.context.fit_intervals.map(f=>[f.phase,f.temperature_range.min,f.temperature_range.max]),[['GAS',298,6000]]);assert.equal(chart.sources[0].source_id,'SRC-000509');assert.match(chart.svg,/GRAPH-010-Heat-Capacity.svg$/);
 for(const allocation of [{table:10,graph:9},null,{table:10,graph:10,extra:1}]){
  const g=fixture(['MAT:0002']),receipts=g.json(chartInputs.thermal),receipt=receipts.elements[0],model=YAML.parse(g.read(receipt.input).toString('utf8'));model.asset_slots=allocation;const text=YAML.stringify(model);g.bytes.set(receipt.input,Buffer.from(text));receipt.input_sha256=hash(text);g.set(chartInputs.thermal,receipts);const index=g.json(chartInputs.thermalIndex);index.elements[0].asset_slots=allocation;g.set(chartInputs.thermalIndex,index);assert.throws(g.project,/asset.slot/i);
 }
});

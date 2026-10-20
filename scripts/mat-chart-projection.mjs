// Read-only publication projection of retained chart/data owners. No science is generated here.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {csvFields} from './nist-ionisation.mjs';
import {shomate} from './thermochemistry.mjs';
import {loadThermochemistryContext,validateThermochemistryContext,resolveThermochemistryAssetSlots} from './thermochemistry-context.mjs';
import {compileMaterialVisualData,checkMaterialVisuals,materialVisualPaths} from './material-visuals.mjs';

export const chartInputs={catalog:'data/catalog/elements-baseline.json',sources:'data/registries/sources.yaml',ame:'data/quality/ame2020-chart-manifest.json',ionisation:'data/quality/ionisation-chart-manifest.json',thermal:'data/quality/thermochemistry-chart-manifest.json',ameIndex:'data/catalog/ame2020-evaluation-index.json',ionisationIndex:'data/catalog/ionisation-evaluation-index.json',thermalIndex:'data/catalog/thermochemistry-evaluation-index.json',thermalAccessions:'data/catalog/nist-thermochemistry-accessions.json'};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const families=['AME2020','NIST-IONISATION','NIST-THERMOCHEMISTRY'];
const titles={'AME2020':'Ground-state binding energy per nucleon','NIST-IONISATION':'Ground-state ionisation thresholds','NIST-THERMOCHEMISTRY':'Phase-specific molar heat capacity'};
const fail=message=>{throw Error('Chart projection: '+message)};
const finite=value=>typeof value==='number'&&Number.isFinite(value);

export function buildChartProjection(repoRoot,{readBytes=path=>readFileSync(path)}={}){
 const absoluteRoot=resolve(repoRoot),provenance=new Map();
 function read(path,expected,normalise=false,returnBytes=false){
  if(typeof path!=='string'||!path||path.includes('\\')||path.startsWith('/')||/^[a-z][a-z0-9+.-]*:/i.test(path))fail('unsafe owner path '+path);
  const absolute=resolve(absoluteRoot,path);if(!absolute.startsWith(absoluteRoot+sep))fail('owner leaves repository '+path);
  const bytes=Buffer.from(readBytes(absolute)),digest=hash(normalise?bytes.toString('utf8').replace(/\r\n/g,'\n'):bytes);
  if(expected&&digest!==expected)fail('stale owner hash '+path);
  provenance.set(path,{path,sha256:hash(bytes)});return returnBytes?bytes:bytes.toString('utf8');
 }
 const json=path=>JSON.parse(read(path)),yaml=(path,expected,normalise)=>YAML.parse(read(path,expected,normalise));
 const catalog=json(chartInputs.catalog).elements,sourceRows=yaml(chartInputs.sources).sources,sources=new Map(sourceRows.map(source=>[source.source_id,source]));
 if(sources.size!==sourceRows.length)fail('duplicate source identity');
 const manifests=[json(chartInputs.ame),json(chartInputs.ionisation),json(chartInputs.thermal)];
 const indexes=[json(chartInputs.ameIndex),json(chartInputs.ionisationIndex),json(chartInputs.thermalIndex)];
 const thermalAccessions=json(chartInputs.thermalAccessions).accessions;
 if(!Array.isArray(catalog)||!catalog.length||new Set(catalog.map(element=>element.matId)).size!==catalog.length)fail('confirmed catalogue coverage');
 const ids=new Set(catalog.map(element=>element.matId));
 function owners(values,label,identity){
  const map=new Map();for(const value of values??[]){const id=value[identity];if(!ids.has(id)||map.has(id))fail('duplicate or unknown '+label+' owner '+id);map.set(id,value)}return map;
 }
 const manifestMaps=manifests.map((manifest,index)=>owners(manifest.elements,families[index],'record_id'));
 const indexMaps=indexes.map((index,i)=>owners(index.elements,families[i]+' index',i===2?'record_id':'mat_id'));
 for(let i=0;i<2;i++)if(manifestMaps[i].size!==ids.size||indexMaps[i].size!==ids.size)fail('incomplete '+families[i]+' coverage');
 if(manifestMaps[2].size!==indexMaps[2].size)fail('thermal receipt/index coverage mismatch');
 const sourceGaps=owners(indexes[2].source_gaps,'thermal source gap','record_id');
 function sourceDetails(sourceIds){
  return [...new Set(sourceIds)].map(id=>{const source=sources.get(id);if(!source)fail('unresolved chart source '+id);return {source_id:id,title:source.title??null,url:source.url??null,doi:source.doi??null,review:source.verification_status??null,registry_path:chartInputs.sources}});
 }
 read('records/0000-Origin-State/0000-Origin-State.md');
 const records=[{record_id:'MAT:0000',name:'Origin / Foundation Reference',kind:'FOUNDATION',chapter:'records/0000-Origin-State/0000-Origin-State.md',material_charts:[],charts:families.map(family=>({family,title:titles[family],status:'NOT-APPLICABLE',reason:'Origin is a coordinate/reference record, not a chemical element or material specimen.',svg:null,owner:null,csv:null,chapter:'records/0000-Origin-State/0000-Origin-State.md',sources:[],rows:[],columns:[],context:{scope:'MAT foundation reference; no elemental scientific values assigned.'}}))}];
 for(const element of catalog){
  if(!Number.isSafeInteger(element.z)||element.z<1||element.matId!=='MAT:'+String(element.z).padStart(4,'0'))fail('canonical atomic-number identity mismatch');
  const stem=element.chapterPath?.split('/')[1];if(!stem)fail('missing parent chapter '+element.matId);
  const parent='records/'+stem+'/',charts=[];
  read(element.chapterPath);
  for(let i=0;i<families.length;i++){
   const family=families[i],receipt=manifestMaps[i].get(element.matId),index=indexMaps[i].get(element.matId);
   if(!receipt){
    if(i!==2)fail('missing chart receipt '+element.matId);
    const gap=sourceGaps.get(element.matId);
    if(gap){const review=yaml(parent+'data/structured/'+stem+'-Thermochemistry-Source-Review.yaml');read(parent+stem+'-Thermochemistry-Source-Review.md');if(review.record_id!==element.matId||JSON.stringify(review.source_review)!==JSON.stringify(gap)||review.heat_capacity?.value!==null||review.heat_capacity?.uncertainty!=='UNKNOWN'||review.scientific_completion!=='PENDING')fail('source-review owner/index mismatch '+element.matId)}
    charts.push({family,title:titles[family],status:'INSUFFICIENT-DATA',reason:gap?(gap.source_review_result==='NO-SHOMATE-IN-RETAINED-PAGE'?'No heat-capacity fit was found in the retained source review; this is not global absence of data.':'No elemental heat-capacity fit was accepted from this lookup review; unresolved identity or retrieval is not global absence of data.'):'No source-bound thermal chart has been accessioned for this record.',svg:null,owner:gap?parent+'data/structured/'+stem+'-Thermochemistry-Source-Review.yaml':null,csv:null,chapter:gap?parent+stem+'-Thermochemistry-Source-Review.md':element.chapterPath,sources:gap?sourceDetails([gap.source_id,gap.coverage_index.source_id].filter(Boolean)):[],columns:[],rows:[],context:gap?{source_review:gap}:{scope:'Pending source accession; unknown is not zero.'}});
    continue;
   }
   if(!index)fail('chart receipt has no matching index '+element.matId);
   const owner=i===2?receipt.input:index.data;
   if(receipt.input!==owner||!owner.startsWith(parent))fail('chart owner/record mismatch '+element.matId);
   // AME/NIST plotting inputs normalize YAML CRLF; thermal receipts hash original bytes.
   if(!/^[a-f0-9]{64}$/.test(receipt.input_sha256??''))fail('missing input hash '+owner);
   const data=yaml(owner,receipt.input_sha256,i!==2);
   if(data.record_id!==element.matId)fail('structured owner identity mismatch '+owner);
   const chapter=i===2?parent+stem+'-Thermochemistry.md':index.chapter;
   if(!chapter?.startsWith(parent))fail('chart chapter/record mismatch '+element.matId);
   read(chapter);
   const svg=receipt.chart??null;if(svg){if(!svg.startsWith(parent)||!svg.endsWith('.svg'))fail('chart asset/record mismatch');const digest=receipt.sha256??receipt.chart_sha256;if(!/^[a-f0-9]{64}$/.test(digest??''))fail('missing chart hash');read(svg,digest)}
   const chart={family,title:titles[family],status:svg?'AVAILABLE':'INSUFFICIENT-DATA',reason:svg?null:'This retained evaluation supplies no numeric ionisation values; no chart is drawn.',svg,owner,csv:receipt.csv??null,chapter,sources:[],columns:[],rows:[],context:{},numeric_points:receipt.numeric_points??receipt.calculated_rows??0};
   if(i===0){
    chart.sources=sourceDetails(receipt.source_ids);
    chart.columns=['Mass number A','Binding energy / keV per nucleon','Uncertainty / keV per nucleon','Evidence','Source locator'];
    if(receipt.status!=='GENERATED-DATA-CHART')fail('AME receipt status');
    chart.rows=data.entries.map(entry=>{const metric=entry.binding_energy_per_nucleon;if(metric.value!==null&&!finite(metric.value))fail('nonfinite binding value');if(!receipt.source_ids.includes(metric.source_id))fail('AME point/source mismatch');if(metric.uncertainty!==null&&(!finite(metric.uncertainty)||metric.uncertainty<0))fail('invalid binding uncertainty');return [entry.A,metric.value,metric.uncertainty,metric.value_status,metric.source_locator]});
    if(chart.rows.filter(row=>row[1]!==null).length!==receipt.numeric_points||data.entries.filter(entry=>entry.binding_energy_per_nucleon.value!==null&&entry.binding_energy_per_nucleon.estimated===true).length!==receipt.estimated_points)fail('AME point-count mismatch');
    chart.context={x_axis:'Mass number A',x_unit:'dimensionless',y_axis:'Binding energy per nucleon',y_unit:'keV',scale:'LINEAR',reference_state:'AME2020 ground-state atomic-mass convention',interpretation:data.interpretation,evaluation:data.evaluation,uncertainty:'Source-reported uncertainty; missing is UNKNOWN. Estimate markers do not establish observed decay.'};
   }else if(i===1){
    chart.sources=sourceDetails(receipt.source_ids);
    chart.columns=['Initial ionic charge q / elementary charge','Ionisation energy / eV','Uncertainty / eV','Evidence qualifier','Source locator'];
    if(receipt.status!==(svg?'GENERATED-DATA-CHART':'INSUFFICIENT DATA'))fail('ionisation receipt status');
    chart.rows=data.entries.map(entry=>{const metric=entry.ionisation_energy;if(metric.value!==null&&(!finite(metric.value)||metric.value<=0))fail('invalid log-axis ionisation value');if(!receipt.source_ids.includes(metric.source_id))fail('ionisation point/source mismatch');if(metric.uncertainty!==null&&(!finite(metric.uncertainty)||metric.uncertainty<0))fail('invalid ionisation uncertainty');return [entry.charge,metric.value,metric.uncertainty,metric.value_status,entry.source_locator]});
    const numeric=chart.rows.filter(row=>row[1]!==null).length;
    if(numeric!==receipt.numeric_points||Boolean(svg)!==Boolean(numeric))fail('ionisation no-data/point-count mismatch');
    chart.context={x_axis:'Initial ionic charge q',x_unit:'elementary charge',y_axis:'Ionisation energy',y_unit:'eV',scale:'LOGARITHMIC',reference_state:'Isolated ground-state atom/positive ion; q → q + 1',interpretation:data.interpretation,evaluation:data.evaluation,coverage:data.coverage,uncertainty:'Source-reported uncertainty; missing is UNKNOWN. Thresholds are not emission-spectrum lines.'};
   }else{
    if(!svg||receipt.status!=='CALCULATED-FROM-PUBLISHED-FIT'||receipt.source_id!==data.source_id||index.source_id!==data.source_id)fail('thermal source mismatch');
    if(JSON.stringify(data.heat_capacity_fits)!==JSON.stringify(index.heat_capacity_fits)||data.evaluation.retrieved!==index.retrieved)fail('thermal evaluation/index mismatch');
    if(JSON.stringify(data.subject??null)!==JSON.stringify(index.subject??null)||data.parent_integration!==index.parent_integration)fail('thermal subject/index mismatch');
    const accession=thermalAccessions.find(item=>item.z===element.z);
    if(!accession||accession.source_id!==index.source_id||accession.retrieved!==index.retrieved||accession.formula!==data.species.source_formula)fail('thermal accession/evaluation mismatch');
    if(JSON.stringify(accession.subject??null)!==JSON.stringify(index.subject??null)||accession.parent_integration!==index.parent_integration)fail('thermal curated accession subject mismatch');
    if(JSON.stringify(accession.asset_slots??null)!==JSON.stringify(index.asset_slots??null)||JSON.stringify(data.asset_slots??null)!==JSON.stringify(index.asset_slots??null))fail('thermal reviewed asset-slot mismatch');
    const slots=resolveThermochemistryAssetSlots(index);resolveThermochemistryAssetSlots(data);
    if(!chart.svg.endsWith(`${stem}-GRAPH-${String(slots.graph).padStart(3,'0')}-Heat-Capacity.svg`)||!chart.csv.endsWith(`${stem}-TABLE-${String(slots.table).padStart(3,'0')}-Thermodynamic-Functions.csv`))fail('thermal receipt asset-slot mismatch');
    if(data.subject||data.parent_integration||index.subject||index.parent_integration){
     const identityPath=parent+'data/structured/'+stem+'.yaml';
     const identity=loadThermochemistryContext(index,{identityPath,readBytes:path=>read(path,undefined,false,true)});
     validateThermochemistryContext(index,identity);validateThermochemistryContext(data,identity);
    }
    if(!chart.csv?.startsWith(parent))fail('thermal CSV/record mismatch');
    if(!/^[a-f0-9]{64}$/.test(receipt.csv_sha256??''))fail('missing CSV hash');
    const lines=read(chart.csv,receipt.csv_sha256).trimEnd().split(/\r?\n/),header=csvFields(lines.shift());
    const expected=['fit_id','source_id','source_formula','phase','phase_variant','temperature_K','heat_capacity_J_mol_K','entropy_J_mol_K','enthalpy_increment_kJ_mol','uncertainty','evidence_status'];
    if(JSON.stringify(header)!==JSON.stringify(expected))fail('unexpected thermal CSV columns');
    chart.sources=sourceDetails([data.source_id]);
    chart.columns=['Fit','Phase','Source phase variant','Temperature / K','Cp° / J mol⁻¹ K⁻¹','Uncertainty','Evidence'];
    const fits=new Map(data.heat_capacity_fits.map(fit=>[fit.fit_id,fit]));
    chart.rows=lines.map(line=>{const fields=csvFields(line),fit=fits.get(fields[0]);
     const numeric=fields.slice(5,9).map(value=>typeof value==='string'&&value.trim()!==''?Number(value):NaN),[temperature,cp]=numeric;
     if(fields.length!==header.length||fields[1]!==data.source_id||fields[2]!==data.species.source_formula||!fit||fields[3]!==fit.phase||fields[4]!==fit.phase_label_as_reported||!numeric.every(Number.isFinite)||temperature<=0||cp<=0||temperature<fit.temperature_range.min||temperature>fit.temperature_range.max||fields[9]!=='UNKNOWN'||fields[10]!=='CALCULATED-FROM-PUBLISHED-FIT')fail('invalid thermal CSV row/state');
     const calculated=shomate(fit,temperature),expectedValues=[calculated.heat_capacity_J_mol_K,calculated.entropy_J_mol_K,calculated.enthalpy_increment_kJ_mol];
     // sync-thermochemistry writes full JS numbers to CSV (only the Markdown table is rounded).
     // Re-evaluation uses the same helper and round-tripped temperature; no precision is inferred.
     if(expectedValues.some((value,index)=>value!==numeric[index+1]))fail('thermal CSV/fit calculation mismatch');
     return [fields[0],fields[3],fields[4],fields[5],fields[6],fields[9],fields[10]]});
    if(chart.rows.length!==receipt.calculated_rows||data.heat_capacity_fits.length!==receipt.fit_count)fail('thermal row/fit-count mismatch');
    chart.context={x_axis:'Temperature',x_unit:'K',y_axis:'Molar heat capacity',y_unit:'J mol⁻¹ K⁻¹',scale:'Separate phase scales; valid fit intervals only',reference_state:data.species.molar_basis,species:data.species,interpretation:data.interpretation,fit_intervals:data.heat_capacity_fits.map(fit=>({fit_id:fit.fit_id,phase:fit.phase,variant:fit.phase_label_as_reported,temperature_range:fit.temperature_range,coefficient_uncertainty:fit.coefficient_uncertainty,coefficient_covariance:fit.coefficient_covariance})),review_notes:data.review_notes??[],...(data.subject?{subject:data.subject,parent_integration:data.parent_integration}:{}),...(data.asset_slots?{asset_slots:data.asset_slots}:{}),evidence:'CALCULATED-FROM-PUBLISHED-FIT; not new measurement'};
   }
   if(!Array.isArray(chart.rows))fail('missing chart data');charts.push(chart);
  }
  records.push({record_id:element.matId,name:element.name,kind:'CONFIRMED-ELEMENT',chapter:element.chapterPath,charts,material_charts:[]});
 }
 // A material is a separate object, linked under its parent element without becoming a pure-element property.
 const iron=records.find(record=>record.record_id==='MAT:0026');
 if(iron&&existsSync(resolve(absoluteRoot,materialVisualPaths.receipt))){
  const material=compileMaterialVisualData(),receipt=checkMaterialVisuals({repoRoot:absoluteRoot,data:material});
  read(materialVisualPaths.receipt);for(const input of [...receipt.inputs,...receipt.artifacts])read(input.path,input.sha256);
  iron.material_charts.push({material_ref:material.material_ref,state_ref:material.state_ref,name:material.name,table:materialVisualPaths.table,process_svg:materialVisualPaths.process,steps:material.steps,limitations:material.limitations,
   chart:{family:'MATERIAL-COMPOSITION',title:'NIST SRM 126c — reported mass fractions',status:'AVAILABLE',reason:null,svg:materialVisualPaths.chart,owner:material.owner.path,csv:null,chapter:materialVisualPaths.supplement,sources:sourceDetails([material.source.source_id]),
    columns:['Constituent','MAT identity','Mass fraction / wt%','Expanded uncertainty U / wt%','Coverage factor k','Source assignment','Certificate locator','Analytical method codes'],
    rows:material.rows.map(row=>[row.name+' ('+row.symbol+')',row.component_ref,row.value_text,row.uncertainty_text,row.coverage_factor_text,row.status,row.source_locator,row.analytical_methods.map(method=>method.code).join(', ')]),
    context:{reference_state:material.state_ref,object_class:material.object_class,unit:material.unit,scale:'Linear overview and separately labelled minor-constituent detail',coverage:material.coverage,reported_sum_wt_percent:material.reported_sum,reported_sum_evidence:'CALCULATED',combined_uncertainty:material.combined_uncertainty,unassigned_identity:material.unassigned_identity,covariance_status:material.covariance_status,validity:material.validity,applicability:material.applicability,source:material.source,evidence_type:material.evidence_type,rendering:material.rendering,uncertainty:'Reported expanded U at 95% confidence with per-constituent k; INFORMATION uncertainty remains UNKNOWN.',process_arrow_meaning:material.process_arrow_meaning,standalone_panel_credit:0,independent_replication:false}}});
 }
 return {schema_version:'1.0.0',scope:'Origin 0000 and the '+catalog.length+' confirmed catalogue elements. Source-bound supplemental charts; not complete scientific certification or A/B illustration panels.',notice:'Legacy unsourced abundance and normalized radar datasets are excluded. Existing evaluated, theoretical, semiempirical, estimated and calculated distinctions remain visible; unknown values are never zero-filled.',summary:{records:records.length,confirmed_elements:catalog.length,available_charts:records.flatMap(record=>record.charts).filter(chart=>chart.status==='AVAILABLE').length,material_composition_charts:records.flatMap(record=>record.material_charts).length,available_by_family:Object.fromEntries(families.map(family=>[family,records.flatMap(record=>record.charts).filter(chart=>chart.family===family&&chart.status==='AVAILABLE').length]))},inputs:[...provenance.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),records};
}

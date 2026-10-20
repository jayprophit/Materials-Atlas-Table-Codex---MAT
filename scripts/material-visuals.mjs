// Source-bound visual projection; the material adapter remains the numeric owner.
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve,isAbsolute,posix} from 'node:path';
import {spawnSync} from 'node:child_process';
import YAML from 'yaml';
import {root} from './lib.mjs';
import {loadMaterialExample,materialOwnerPath} from './mat-material.mjs';
import {loadOwner,hash,validateObject} from './mat-universal-object.mjs';

export const materialVisualPaths={
  table:'records/0026-Iron-Fe/tables/0026-Iron-Fe-TABLE-SRM-126c-Composition.md',
  chart:'records/0026-Iron-Fe/graphs/0026-Iron-Fe-GRAPH-SRM-126c-Composition.svg',
  process:'records/0026-Iron-Fe/diagrams/0026-Iron-Fe-DIAGRAM-SRM-126c-Preparation.svg',
  supplement:'records/0026-Iron-Fe/0026-Iron-Fe-SRM-126c-Visual-Reference.md',
  receipt:'data/quality/material-visuals-srm126c.json'
};
const generationInputs=[materialOwnerPath,'data/registries/sources.yaml','data/catalog/elements-baseline.json',
  'scripts/mat-material.mjs','scripts/mat-composition.mjs','scripts/mat-universal-object.mjs',
  'scripts/mat-reading.mjs','scripts/lib.mjs','data/schema/1.0.0/mat-universal-object.schema.json',
  'scripts/material-visuals.mjs','scripts/build-material-visuals.mjs','scripts/plot-material-visuals.py'];
const safePath=(base,path)=>{
  const full=resolve(base,path),rel=relative(base,full);
  if(isAbsolute(rel)||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\'))throw Error('Visual artifact must remain inside repository');
  return full;
};
const md=value=>String(value).replace(/\|/g,'\\|').replace(/[\r\n]+/g,' ');
const link=(from,to)=>posix.relative(posix.dirname(from),to);
const shortState=ref=>ref.split(':STATE:')[1];

export function compileMaterialVisualData({material=loadMaterialExample(),catalogue=loadOwner('data/catalog/elements-baseline.json').document.elements,
  ownerText=readFileSync(join(root,materialOwnerPath),'utf8')}={}) {
  const m=material,o=m.object,owner=YAML.parseDocument(ownerText),d=owner.toJS();
  validateObject(o);
  if(o.object_ref!==d.material_id||o.owner.path!==materialOwnerPath||o.owner.sha256!==hash(Buffer.from(ownerText))||
    o.object_class!=='ALLOY'||o.atomic_number!==null||m.source.source_id!==d.source_id||m.source.certificate_issue!==d.certificate_issue)
    throw Error('Typed material identity/provenance differs from the source owner');
  if(o.composition.coverage!=='PARTIAL'||o.composition.unit!=='wt%'||m.composition_summary.unassigned_identity!=='UNKNOWN'||
    m.composition_summary.combined_uncertainty!==null||m.composition_summary.covariance_status!=='NOT-REPORTED')
    throw Error('Visuals require the reviewed partial composition; no balance or covariance may be inferred');
  if(JSON.stringify(m.applicability)!==JSON.stringify(d.applicability))throw Error('Material applicability differs from source owner');
  if(new URL(m.source.url).protocol!=='https:')throw Error('HTTPS certificate reference required');
  const lexical=(index,key,value)=>{
    const scalar=owner.getIn(['composition','components',index,key],true);
    if(scalar?.value!==value)throw Error('Numeric projection differs from source scalar');
    if(value===null)return null;
    if(typeof scalar.source!=='string'||Number(scalar.source)!==value)throw Error('Source decimal formatting unavailable');
    return scalar.source;
  };
  const rows=o.readings.map((r,i)=>{
    const component=o.composition.components[i],context=m.observation_context[i],identity=catalogue.find(e=>e.matId===r.component_ref);
    if(!identity||component?.object_ref!==r.component_ref||component.value!==r.value||context?.component_ref!==r.component_ref||
      r.metric!=='composition.mass_fraction'||r.unit!=='wt%'||r.state_ref!==o.state.state_ref||r.evidence_type!=='EVALUATED'||
      r.provenance[0]?.pointer!=='/composition/components/'+i||!r.provenance.some(p=>p.sha256===m.source.sha256&&p.path===m.source.local_path))
      throw Error('Unresolved material observation context');
    if(r.source_value_status!==d.composition.components[i]?.source_value_status)throw Error('Source assignment status differs from owner');
    const original=d.composition.components[i],methods=original.analytical_method_codes.map(code=>({code,description:d.analytical_methods[code]}));
    if(context.source_locator!==original.source_locator||JSON.stringify(context.analytical_methods)!==JSON.stringify(methods))
      throw Error('Analytical context differs from source owner');
    const info=r.source_value_status==='INFORMATION';
    if(!['CERTIFIED','REFERENCE','INFORMATION'].includes(r.source_value_status)||
      (info?(r.uncertainty!==null||r.uncertainty_context!==undefined):
      (r.uncertainty===null||r.uncertainty_context?.kind!=='EXPANDED'||r.uncertainty_context.confidence_level!==0.95)))
      throw Error('Source uncertainty classification must remain explicit');
    return {component_ref:r.component_ref,name:identity.name,symbol:identity.symbol,value:r.value,value_text:lexical(i,'value',r.value),
      uncertainty:r.uncertainty,uncertainty_text:lexical(i,'uncertainty',r.uncertainty),
      coverage_factor:info?null:r.uncertainty_context.coverage_factor,
      coverage_factor_text:lexical(i,'coverage_factor',info?null:r.uncertainty_context.coverage_factor),
      confidence_level:info?null:r.uncertainty_context.confidence_level,status:r.source_value_status,
      source_locator:context.source_locator,analytical_methods:context.analytical_methods,provenance:r.provenance};
  });
  if(rows.length!==d.composition.components.length||rows.length!==o.composition.components.length)throw Error('Incomplete material row projection');
  const sum=rows.reduce((n,r)=>n+r.value,0);
  if(Math.abs(sum/100-m.composition_summary.sum_fraction)>1e-12)throw Error('Partial composition total mismatch');
  const steps=o.process_genome.map((s,i)=>{
    const context=m.preparation_history[i],original=d.process_history[i];
    if(context?.process_ref!==s.process_ref||original?.process_id!==s.process_ref||context.source_locator!==original.source_locator||context.description!==original.description||
      JSON.stringify(s.input_state_refs)!==JSON.stringify(original.input_state_refs)||JSON.stringify(s.output_state_refs)!==JSON.stringify(original.output_state_refs))
      throw Error('Process sequence/context differs from source owner');
    if(i&&!s.input_state_refs.some(id=>o.process_genome[i-1].output_state_refs.includes(id)))throw Error('Disconnected source preparation sequence');
    const parameters=s.parameters.map((p,j)=>{
      if(p.qualifier!=='APPROXIMATE'||p.uncertainty!==null||p.value!==original.parameters[j]?.value||p.unit!==original.parameters[j]?.unit||
        p.metric!==original.parameters[j]?.metric||p.state_ref!==original.parameters[j]?.state_ref)
        throw Error('Approximate process geometry differs from source');
      return {...p,display:'approximately '+p.value+' '+p.unit};
    });
    return {order:i+1,process_ref:s.process_ref,label:s.process_ref.split(':PROC:')[1].replaceAll('-',' ').toLowerCase(),
      description:context.description,source_locator:context.source_locator,input_states:s.input_state_refs.map(shortState),
      output_states:s.output_state_refs.map(shortState),parameters,provenance:s.provenance};
  });
  if(steps.length!==d.process_history.length||!steps.at(-1)?.output_states.includes(shortState(o.state.state_ref)))throw Error('Incomplete preparation projection');
  return {schema_version:'1.0.0',material_ref:o.object_ref,name:d.name,object_class:o.object_class,state_ref:o.state.state_ref,
    source:m.source,owner:o.owner,coverage:'PARTIAL',unit:'wt%',rows,reported_sum:Number(sum.toFixed(12)),
    reported_sum_text:Number(sum.toFixed(12)).toString(),combined_uncertainty:null,unassigned_identity:'UNKNOWN',
    covariance_status:'NOT-REPORTED',steps,applicability:m.applicability,validity:o.state.validity,limitations:m.limitations,
    evidence_type:'EVALUATED',rendering:'DATA-DERIVED',process_arrow_meaning:'ORDERED-SOURCE-REPORTED-SEQUENCE',
    standalone_panel_credit:0,independent_replication:false};
}

export function renderMaterialTable(d) {
  const from=materialVisualPaths.table;
  const rows=d.rows.map(r=>`| ${md(r.name)} (${md(r.symbol)}) | ${r.component_ref} | ${r.value_text} | ${r.uncertainty_text??'UNKNOWN'} | ${r.coverage_factor_text??'UNKNOWN'} | ${r.status} | ${md(r.source_locator)} | ${r.analytical_methods.map(m=>m.code).join(', ')} |`).join('\n');
  const methods=new Map(d.rows.flatMap(r=>r.analytical_methods.map(m=>[m.code,m.description])));
  return `# NIST SRM 126c - source-reported composition\n\n<!-- generated-by: build-material-visuals.mjs -->\n\nMaterial: **${d.material_ref}**, ${md(d.name)}. These assignments describe a high-nickel steel reference material in chip form; they are not properties of pure Iron. The parent element is [MAT:0026](../0026-Iron-Fe.md).\n\nSource **${d.source.source_id}**: [NIST Certificate of Analysis](<${d.source.url}>), issued ${d.source.certificate_issue}, retrieved ${d.source.retrieved}. [Retained certificate](${link(from,d.source.local_path)}) and [canonical material owner](${link(from,d.owner.path)}) preserve the source binding.\n\n| Constituent | MAT identity | Mass fraction / wt% | Expanded uncertainty U / wt% | Coverage factor k | Source assignment | Certificate locator | Method codes |\n|---|---|---:|---:|---:|---|---|---|\n${rows}\n\nThe arithmetic sum of these reported values is **${d.reported_sum_text} wt%** (CALCULATED). Coverage is **PARTIAL**. The unreported balance has no assigned constituent identity; it is not attributed to Iron. No complete recipe, combined uncertainty or covariance is inferred. Source decimal formatting is retained.\n\nFor CERTIFIED and REFERENCE assignments, U is the certificate's expanded uncertainty at a 95% confidence level, with its reported coverage factor k. REFERENCE values are noncertified; their uncertainties may omit contributions. INFORMATION values have no established uncertainty or metrological traceability. UNKNOWN is not zero.\n\n## Analytical method index\n\nDescriptions are the material owner's concise method labels, linked to the certificate's page 4 appendix; they are not full procedures.\n\n| Code | Concise method label |\n|---:|---|\n${[...methods].sort((a,b)=>a[0]-b[0]).map(([code,name])=>`| ${code} | ${md(name)} |`).join('\n')}\n\n## Scope and validity\n\n${md(d.validity)}\n\nMeasurement temperature, process temperature, process duration and phase fractions remain UNKNOWN. The certificate recommends a minimum analytical sample of ${d.applicability.minimum_recommended_analytical_sample.value} ${d.applicability.minimum_recommended_analytical_sample.unit}; this is source context, not an executable MAT instruction. MAT does not assert possession or independent measurement of a sample.\n\n[Source-linked visual reference](${link(from,materialVisualPaths.supplement)}) - [Composition chart](${link(from,materialVisualPaths.chart)}) - [Reported preparation sequence](${link(from,materialVisualPaths.process)}) - [Generation receipt](${link(from,materialVisualPaths.receipt)})\n`;
}

export function renderMaterialSupplement(d) {
  const from=materialVisualPaths.supplement;
  return `# NIST SRM 126c - material visual reference\n\n<!-- generated-by: build-material-visuals.mjs -->\n\n**${d.material_ref}** is a high-nickel steel reference material, distinct from [pure Iron's element record](0026-Iron-Fe.md). Its 11 assignments and four ordered preparation steps are projections of the [existing material owner](${link(from,d.owner.path)}); they do not introduce a second numeric record.\n\nSource **${d.source.source_id}**: [NIST Certificate of Analysis](<${d.source.url}>), issued ${d.source.certificate_issue}, retrieved ${d.source.retrieved}. The [retained PDF](${link(from,d.source.local_path)}) has SHA-256 **${d.source.sha256}**. Source text transcription and software checks are separate from independent laboratory replication.\n\n## Source-reported assignments\n\n[Full table, expanded uncertainties U, coverage factors k, method codes and certificate locators](${link(from,materialVisualPaths.table)}). Four assignments are CERTIFIED, six REFERENCE and one INFORMATION. The displayed arithmetic sum is **${d.reported_sum_text} wt%**, with **PARTIAL** coverage. The unreported balance remains unassigned.\n\n![NIST SRM 126c: source-reported mass fractions with different assignment statuses, a shared linear overview and a separate minor-constituent detail scale; error bars show reported expanded uncertainties only](${link(from,materialVisualPaths.chart)})\n\nThe left panel includes every reported constituent on a linear scale. The right panel repeats the minor constituents on its explicitly different linear scale; it omits the largest reported value only for readability. Bar colours retain the certificate's assignment status. Error bars show plus/minus the source-reported expanded U at 95% confidence; each constituent's k appears in the adjacent row annotation and in the table. No error bar is drawn for the INFORMATION value because its uncertainty is UNKNOWN. No normalisation, Iron remainder or whole-composition pie chart is made.\n\n## Ordered preparation history\n\n![NIST SRM 126c: four source-reported steps, vacuum melting, casting, rolling selected sections into rounds and NIST lathe cutting to produce chips and remaining rods; arrows indicate the reported order](${link(from,materialVisualPaths.process)})\n\n${d.steps.map(s=>`${s.order}. **${md(s.label)}** - ${md(s.description)}${s.parameters.length?' '+s.parameters.map(p=>md(p.metric.replaceAll('_',' '))+': '+p.display+'.').join(' '):''} Source: ${md(s.source_locator)}.`).join('\n')}\n\nArrows indicate the certificate's reported preparation order. They are not evidence of a quantified causal effect, a reproducible laboratory procedure, or authorization to execute equipment. The approximate geometry is source-reported; its measurement uncertainty and machining conditions are UNKNOWN. Remaining rods are described as used for SRM 1158, but their quantity, composition allocation and circular recovery performance are not reported.\n\n## Evidence limits and continuation\n\n${d.limitations.map(l=>'- '+md(l)).join('\n')}\n\n- Phase fractions, measurement temperature, process temperature and duration remain UNKNOWN.\n- The certificate's ${d.applicability.minimum_recommended_analytical_sample.value} ${d.applicability.minimum_recommended_analytical_sample.unit} recommendation is analytical context, not a MAT execution instruction.\n- These data-derived charts supplement the material record and receive **zero credit** toward the 22 required standalone element illustrations. They do not make the Iron scientific record complete.\n\n[Generation receipt](${link(from,materialVisualPaths.receipt)}) records input and output byte hashes. The read-only freshness check is \`node scripts/build-material-visuals.mjs --check\`; regeneration refuses to overwrite artifacts edited since the receipt. Future additions require separate source-backed owners for complete composition, covariance, measured sample conditions and property or performance evidence.\n`;
}

export function materialVisualInputs(d,repoRoot=root) {
  return [...new Set([...generationInputs,d.source.local_path])].map(path=>({path,sha256:hash(readFileSync(safePath(repoRoot,path)))}));
}

export function preflightMaterialVisualOutputs(outputs,receipt,repoRoot=root) {
  for(const path of outputs){
    const full=safePath(repoRoot,path);
    if(!existsSync(full))continue;
    const previous=receipt?.artifacts?.find(a=>a.path===path);
    if(!previous||hash(readFileSync(full))!==previous.sha256)throw Error('Refusing to overwrite unreceipted or edited artifact: '+path);
  }
}

export function checkMaterialVisuals({repoRoot=root,data=compileMaterialVisualData()}={}) {
  const receiptPath=safePath(repoRoot,materialVisualPaths.receipt);
  if(!existsSync(receiptPath))throw Error('Missing material visual receipt');
  const receipt=JSON.parse(readFileSync(receiptPath,'utf8'));
  if(receipt.material_ref!==data.material_ref||receipt.source_id!==data.source.source_id||receipt.source_sha256!==data.source.sha256||
    receipt.certificate_issue!==data.source.certificate_issue||receipt.evidence_type!==data.evidence_type||receipt.coverage!==data.coverage||
    receipt.reported_sum_wt_percent!==data.reported_sum||receipt.combined_uncertainty!==null||receipt.unassigned_identity!=='UNKNOWN'||receipt.rendering!=='DATA-DERIVED'||
    receipt.process_arrow_meaning!==data.process_arrow_meaning||receipt.standalone_panel_credit!==0||receipt.independent_replication!==false)
    throw Error('Material visual receipt scope mismatch');
  if(JSON.stringify(receipt.inputs)!==JSON.stringify(materialVisualInputs(data,repoRoot)))throw Error('Stale material visual input hashes');
  if(receipt.projection_sha256!==hash(JSON.stringify(data)))throw Error('Stale material visual projection');
  const expected=Object.values(materialVisualPaths).filter(p=>p!==materialVisualPaths.receipt);
  if(receipt.artifacts?.length!==expected.length||new Set(receipt.artifacts.map(a=>a.path)).size!==expected.length||expected.some(p=>!receipt.artifacts.some(a=>a.path===p)))
    throw Error('Incomplete material visual artifact receipt');
  for(const a of receipt.artifacts)if(!existsSync(safePath(repoRoot,a.path))||hash(readFileSync(safePath(repoRoot,a.path)))!==a.sha256)
    throw Error('Missing or edited material visual artifact: '+a.path);
  if(readFileSync(safePath(repoRoot,materialVisualPaths.table),'utf8')!==renderMaterialTable(data)||
    readFileSync(safePath(repoRoot,materialVisualPaths.supplement),'utf8')!==renderMaterialSupplement(data))throw Error('Stale source-linked material text');
  return receipt;
}

export function buildMaterialVisuals() {
  const data=compileMaterialVisualData(),receiptPath=join(root,materialVisualPaths.receipt);
  const previous=existsSync(receiptPath)?JSON.parse(readFileSync(receiptPath,'utf8')):null;
  const outputs=Object.values(materialVisualPaths).filter(p=>p!==materialVisualPaths.receipt);
  preflightMaterialVisualOutputs(outputs,previous);
  const scratch=join(root,'.mat-local/material-visuals-srm126c');mkdirSync(scratch,{recursive:true});
  const input=join(scratch,'projection.json');writeFileSync(input,JSON.stringify(data,null,2)+'\n');
  const python=process.env.MAT_PYTHON||join(root,'.mat-local/plots-env/Scripts/python.exe');
  const result=spawnSync(python,[join(root,'scripts/plot-material-visuals.py'),input,scratch],{encoding:'utf8'});
  if(result.status!==0)throw Error('Material rendering failed: '+(result.stderr||result.error?.message||result.stdout));
  const files=new Map([[materialVisualPaths.table,Buffer.from(renderMaterialTable(data))],
    [materialVisualPaths.supplement,Buffer.from(renderMaterialSupplement(data))],
    [materialVisualPaths.chart,readFileSync(join(scratch,'composition.svg'))],
    [materialVisualPaths.process,readFileSync(join(scratch,'preparation.svg'))]]);
  const receipt={schema_version:'1.0.0',generator:'scripts/build-material-visuals.mjs',material_ref:data.material_ref,
    source_id:data.source.source_id,source_sha256:data.source.sha256,certificate_issue:data.source.certificate_issue,
    evidence_type:data.evidence_type,rendering:data.rendering,coverage:data.coverage,reported_sum_wt_percent:data.reported_sum,
    combined_uncertainty:null,unassigned_identity:'UNKNOWN',process_arrow_meaning:data.process_arrow_meaning,
    standalone_panel_credit:0,independent_replication:false,projection_sha256:hash(JSON.stringify(data)),inputs:materialVisualInputs(data),
    artifacts:[...files].map(([path,bytes])=>({path,sha256:hash(bytes)}))};
  // Recheck all destinations after rendering, before the first permanent write.
  preflightMaterialVisualOutputs(outputs,previous);
  for(const [path,bytes] of files){const full=join(root,path);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,bytes);}
  mkdirSync(dirname(receiptPath),{recursive:true});writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n');
  return checkMaterialVisuals({data});
}

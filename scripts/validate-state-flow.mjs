import { createHash } from 'node:crypto';
import { R, recordDirs, exists, walkFiles } from './lib.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
const index=JSON.parse(R('data/quality/state-flow/index.json'));
const expected=recordDirs().map(s=>'MAT:'+s.slice(0,4)).sort();
if(JSON.stringify(index.records.map(r=>r.record_id).sort())!==JSON.stringify(expected))throw new Error('State-flow record inventory mismatch');
if(digest(R(index.schema_source.path))!==index.schema_source.sha256)throw new Error('Stale universal schema extraction');
const requirementIds=new Set(index.requirements.map(r=>r.requirement_id));
if(requirementIds.size!==index.requirements.length)throw new Error('Duplicate requirement IDs');
let candidates=0;
for(const item of index.records){
 const report=JSON.parse(R(item.path));
 if(report.record_id!==item.record_id||report.completion!=='PARTIAL-REVIEW-REQUIRED')throw new Error('Invalid report identity or overstated status');
 if(report.metrics.length!==requirementIds.size||new Set(report.metrics.map(r=>r.requirement_id)).size!==requirementIds.size||report.metrics.some(r=>!requirementIds.has(r.requirement_id)))throw new Error('Missing/duplicate schema items '+item.record_id);
 const paths=new Set(report.input_files.map(f=>f.path));
 const folder=item.path.split('/').at(-1).replace(/\.json$/,'');
 const current=walkFiles('records/'+folder).filter(p=>/\.(md|yaml|yml)$/.test(p)).sort();
 if(JSON.stringify([...paths].sort())!==JSON.stringify(current))throw new Error('Changed record file inventory '+item.record_id);
 for(const file of report.input_files)if(!exists(file.path)||digest(R(file.path))!==file.sha256)throw new Error('Stale report input '+file.path);
 for(const metric of report.metrics){
  if(metric.status!==(metric.candidate_count?'OWNER-CANDIDATES-FOUND':'UNKNOWN'))throw new Error('Invalid metric presence status');
  for(const c of metric.candidates){if(!paths.has(c.path)||!c.pointer.startsWith('/'))throw new Error('Broken metric owner');candidates++;}
 }
 for(const lane of Object.values(report.non_conventional_and_model_lanes)){
  if(lane.core_property!==false)throw new Error('Non-conventional lane promoted to core');
  for(const l of lane.locators)if(!paths.has(l.path)||l.status!=='MENTION-ONLY-REVIEW-CONTEXT')throw new Error('Invalid historical/model locator');
 }
 if(item.record_id==='MAT:0000'&&report.foundation_scope?.intrinsic_element_properties!=='NOT-APPLICABLE')throw new Error('Origin wrongly treated as element');
}
console.log(`State flow: ${expected.length} records, ${requirementIds.size} schema items each, ${candidates} owner locators, source hashes and non-conventional separation checked. Scientific acceptance remains pending.`);

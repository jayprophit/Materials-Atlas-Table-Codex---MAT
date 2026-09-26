import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {root} from './lib.mjs';
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const report=read('data/quality/unified-gap-analysis.json'),ledger=read('data/quality/MAT-TODO.json'),advanced=read('data/quality/advanced-completion-matrix.json'),panels=read('data/quality/panel-image-plan.json');
const ame=read('data/catalog/ame2020-evaluation-index.json'),ameCharts=read('data/quality/ame2020-chart-manifest.json');
for(const path of ['data/catalog/ame2020-evaluation-index.json','data/quality/ame2020-chart-manifest.json'])if(!report.inputs.some(i=>i.path===path))throw new Error('Missing AME audit input '+path);
for(const i of report.inputs)if(createHash('sha256').update(readFileSync(join(root,i.path),'utf8').replace(/\r\n/g,'\n')).digest('hex')!==i.sha256)throw new Error('Stale gap input '+i.path);
if(report.records.length!==advanced.records.length||new Set(report.records.map(r=>r.record_id)).size!==advanced.records.length)throw new Error('Gap record coverage mismatch');
const expected=[];
const proposed=read('data/catalog/proposed-elements-index.json');
if(report.proposed_entries.length!==70||report.summary.requested_atomic_numbers!==188||report.summary.required_panels_all_scope!==4136)throw Error('Requested proposed scope missing');
for(const e of proposed.entries){
 const d=read(e.path);
 for(const id of Object.keys(d.domains))expected.push('MAT-PROPOSED-'+String(e.z).padStart(4,'0')+'-DOMAIN-'+id);
 for(const p of d.visual_plan.panels)expected.push('MAT-PROPOSED-'+String(e.z).padStart(4,'0')+'-PANEL-'+p.panel_id);
}
for(const r of advanced.records)for(const [id,d]of Object.entries(r.domains))if(d.applicability!=='NOT APPLICABLE')expected.push(`MAT-${r.mat_id.slice(4)}-DOMAIN-${id}`);
for(const e of panels.elements)for(const p of e.panels)expected.push(`MAT-${e.record_id.slice(4)}-PANEL-${p.panel_id}`);
const ids=new Set();for(const t of ledger.tasks){if(ids.has(t.id))throw new Error('Duplicate task '+t.id);ids.add(t.id);if(!t.acceptance||!t.owner)throw new Error('Task lacks acceptance/owner');if((t.kind==='SCIENTIFIC-REVIEW'||t.kind.startsWith('PROPOSED-'))&&t.status!=='OPEN')throw new Error('Scientific review auto-certified');}
for(const id of expected)if(!ids.has(id))throw new Error('Missing task '+id);
for(const e of panels.elements)for(const p of e.panels){
 const task=ledger.tasks.find(t=>t.id===`MAT-${e.record_id.slice(4)}-PANEL-${p.panel_id}`);
 const status=p.status==='REVIEWED-STANDALONE-ASSET'?'COMPLETE':'OPEN';
 if(task.status!==status)throw new Error('Panel acceptance disagrees with reviewed registry '+task.id);
}
const open=ledger.tasks.filter(t=>t.status==='OPEN').length,complete=ledger.tasks.filter(t=>t.status==='COMPLETE').length;
if(open!==report.summary.open_tasks||complete!==report.summary.completed_panel_tasks)throw new Error('Gap summary disagrees with task ledger');
for(const r of report.records){
 const source=advanced.records.find(s=>s.mat_id===r.record_id);
 if(!source)throw new Error('Unexpected record '+r.record_id);
 const domains=Object.values(source.domains).filter(d=>d.applicability!=='NOT APPLICABLE');
 if(r.domains_for_review!==domains.length)throw new Error('Domain review count mismatch '+r.record_id);
 const mass=ame.elements.find(e=>e.mat_id===r.record_id),chart=ameCharts.elements.find(e=>e.record_id===r.record_id);
 if(!mass){if(r.ame2020!==null)throw new Error('Foundation given chemical-element AME data');continue;}
 if(r.ame2020?.ground_states!==mass.ground_states||r.ame2020?.data!==mass.data||r.ame2020?.chapter!==mass.chapter||r.ame2020?.chart_status!==chart?.status)throw new Error('AME coverage mismatch '+r.record_id);
 for(const [key,value]of Object.entries(mass.numeric_by_metric))if(r.ame2020.numeric_by_metric[key]!==value)throw new Error('AME quantity mismatch '+r.record_id+' '+key);
}
if(report.summary.ame2020_ground_states!==ame.chemical_element_ground_states||report.summary.ame2020_charts!==ameCharts.elements.length||report.summary.ame2020_numeric_quantities!==ame.elements.reduce((n,e)=>n+Object.values(e.numeric_by_metric).reduce((a,b)=>a+b,0),0))throw new Error('AME gap summary mismatch');
if(!ledger.tasks.find(t=>t.id==='MAT-PROGRAMME-MASTER')?.title.includes('Complete the authorised MAT master-repository audit'))throw new Error('Explicit owner objective missing');
console.log(`Unified gap coverage: ${report.records.length} records, ${ledger.tasks.length} unique tracked work items.`);

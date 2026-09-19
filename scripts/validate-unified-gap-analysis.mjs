import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {root} from './lib.mjs';
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const report=read('data/quality/unified-gap-analysis.json'),ledger=read('data/quality/MAT-TODO.json'),advanced=read('data/quality/advanced-completion-matrix.json'),panels=read('data/quality/panel-image-plan.json');
for(const i of report.inputs)if(createHash('sha256').update(readFileSync(join(root,i.path),'utf8').replace(/\r\n/g,'\n')).digest('hex')!==i.sha256)throw new Error('Stale gap input '+i.path);
if(report.records.length!==advanced.records.length||new Set(report.records.map(r=>r.record_id)).size!==advanced.records.length)throw new Error('Gap record coverage mismatch');
const expected=[];
for(const r of advanced.records)for(const [id,d]of Object.entries(r.domains))if(d.applicability!=='NOT APPLICABLE')expected.push(`MAT-${r.mat_id.slice(4)}-DOMAIN-${id}`);
for(const e of panels.elements)for(const p of e.panels)expected.push(`MAT-${e.record_id.slice(4)}-PANEL-${p.panel_id}`);
const ids=new Set();for(const t of ledger.tasks){if(ids.has(t.id))throw new Error('Duplicate task '+t.id);ids.add(t.id);if(!t.acceptance||!t.owner)throw new Error('Task lacks acceptance/owner');if(t.kind==='SCIENTIFIC-REVIEW'&&t.status!=='OPEN')throw new Error('Scientific review auto-certified');}
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
}
if(!ledger.tasks.find(t=>t.id==='MAT-PROGRAMME-MASTER')?.title.includes('Complete the authorised MAT master-repository audit'))throw new Error('Explicit owner objective missing');
console.log(`Unified gap coverage: ${report.records.length} records, ${ledger.tasks.length} unique tracked work items.`);

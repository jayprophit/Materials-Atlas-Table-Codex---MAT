import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {root,loadYaml,validateSchema} from './lib.mjs';
import {loadReading,checkFrequencyPeriod} from './mat-reading.mjs';
const read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const report=read('data/quality/mat-update-intake.json'),review=read('data/research/mat-update-review.json');
const registry=loadYaml('data/registries/sources.yaml');
for(const source of [review.source,review.image]){
 const b=readFileSync(join(root,source.path)),registered=registry.sources.find(s=>s.source_id===source.source_id);
 assert.equal(b.length,source.bytes);assert.equal(sha(b),source.sha256);assert.equal(registered?.local_path,source.path);assert.equal(registered?.sha256,source.sha256);
 assert.ok(registered.source_type.startsWith('USER-SUPPLIED-'));
}
assert.deepEqual(report.source,review.source);assert.deepEqual(report.image,review.image);
assert.deepEqual(report.continuation,review.continuation);
assert.deepEqual(report.additional_intakes,review.additional_intakes);
for(const accession of review.additional_intakes){
 const bytes=readFileSync(join(root,accession.path)),s=registry.sources.find(s=>s.source_id===accession.source_id);
 assert.equal(sha(bytes),accession.sha256);assert.equal(bytes.length,accession.bytes);assert.equal(s?.sha256,accession.sha256);
 assert.equal(s?.local_path,accession.path);assert.equal(s?.source_type,'USER-SUPPLIED-ARCHITECTURE-REFERENCE');
 for(const section of accession.sections){assert.ok(section.existing_task_ids.length);section.existing_task_ids.forEach(id=>assert.ok(report.sections.some(s=>s.task_id===id)));}
}
for(const input of report.inputs){
 const actual=input.sha256?sha(readFileSync(join(root,input.path))):sha(readFileSync(join(root,input.path),'utf8').replace(/\r\n/g,'\n'));
 assert.equal(actual,input.sha256??input.sha256_lf,'Stale input '+input.path);
}
const original=readFileSync(join(root,review.source.path),'utf8'),lines=original.split(/\r?\n/);if(lines.at(-1)==='')lines.pop();
assert.equal(report.summary.source_lines,lines.length);assert.equal(lines.length,4878);
assert.equal(report.sections.length,143);assert.equal(report.summary.numbered_sections,143);
let previous=report.preamble.end_line;
assert.equal(report.preamble.start_line,1);assert.equal(sha(lines.slice(0,previous).join('\n')),report.preamble.text_lf_sha256);
const taskIds=new Set();
for(const [i,s] of report.sections.entries()){
 assert.equal(s.number,i);assert.equal(s.start_line,previous+1);assert.equal(lines[s.start_line-1],`# ${s.number}. ${s.title}`);
 assert.equal(sha(lines.slice(s.start_line-1,s.end_line).join('\n')),s.text_lf_sha256);previous=s.end_line;
 assert.equal(s.status,'OPEN');assert.equal(s.source_id,review.source.source_id);assert.ok(s.acceptance);
 assert.deepEqual(s.implementation_progress,review.section_progress?.[s.number]??null);
 assert.ok(!taskIds.has(s.task_id));taskIds.add(s.task_id);
 const g=review.groups.find(g=>g.id===s.group);assert.ok(g&&i>=g.section_range[0]&&i<=g.section_range[1]);assert.deepEqual(s.candidate_owners,g.candidate_owners);
 for(const p of s.candidate_owners)assert.ok(existsSync(join(root,p)),'Missing candidate owner '+p);
}
assert.equal(previous,lines.length,'End of reference not covered');
const image=readFileSync(join(root,review.image.path));assert.equal(image.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
assert.equal(image.readUInt32BE(16),review.image.width);assert.equal(image.readUInt32BE(20),review.image.height);
assert.equal(review.image.panels.length,16);assert.equal(review.image.standalone_panel_credit,0);assert.equal(review.image.scientific_acceptance,'REJECTED-AS-PHYSICAL-DATA');
assert.equal(review.policy.required_original_panels_per_element,22);assert.equal(review.policy.locked_architecture_changed,false);
const panelPlan=read('data/quality/panel-image-plan.json'),allowedPanels=new Set(panelPlan.templates.flatMap(t=>t.panels.map(p=>p.panel_id)));
assert.equal(panelPlan.minimum_images_per_element,22);
review.image.panels.forEach((p,i)=>{assert.equal(p.number,i+1);p.related_panels.forEach(id=>assert.ok(allowedPanels.has(id)));});
assert.ok(!JSON.stringify(panelPlan.elements).includes(review.image.path),'Reference poster must not become a reviewed standalone panel');
assert.equal(new Set(review.image.issues.map(i=>i.id)).size,13);
for(const i of review.image.issues){assert.equal(i.status,'OPEN');assert.ok(i.observation&&i.disposition);for(const p of i.comparison_paths)assert.ok(existsSync(join(root,p)));}
assert.deepEqual(report.identity_checks.foundation,{record_id:'MAT:0000',record_class:'FOUNDATION_REFERENCE',chemical_element:false,atomic_number:'NOT-APPLICABLE'});
assert.deepEqual(report.identity_checks.hydrogen,{record_id:'MAT:0001',name:'Hydrogen',symbol:'H',atomic_number:1});
const pr=read('data/catalog/elements-baseline.json').elements.find(e=>e.z===59);assert.equal(pr.symbol,'Pr');assert.equal(pr.name,'Praseodymium');
const pair=report.image_arithmetic_diagnostic;
const diagnostic=checkFrequencyPeriod(pair.printed_frequency_hz,pair.printed_period_s);
assert.equal(pair.consistent,false);assert.equal(pair.product,diagnostic.product);assert.equal(pair.expected_period_s,diagnostic.expected_period_s);
const bindings=read('data/research/mat-dashboard-bindings.json').bindings;
assert.equal(new Set(bindings.map(b=>b.binding_id)).size,5);assert.equal(report.reading_examples.length,5);
for(const [i,b] of bindings.entries()){
 assert.ok(!Object.hasOwn(b,'value'),'Do not duplicate the canonical numeric owner in bindings');
 const result=loadReading(b);assert.deepEqual(report.reading_examples[i],result);
 assert.deepEqual(validateSchema('data/schema/1.0.0/mat-reading-projection.schema.json',result),[]);
 assert.equal(result.uncertainty===null,result.uncertainty_status==='UNKNOWN');
}
const ledger=read('data/quality/MAT-TODO.json');
assert.deepEqual(ledger.continuation,review.continuation);
assert.ok(ledger.tasks.some(t=>t.id===ledger.continuation.current_task_id&&t.status==='OPEN'));
assert.equal(report.documentation_review,review.documentation_review);
for(const s of report.sections)assert.deepEqual(ledger.tasks.find(t=>t.id===s.task_id)?.implementation_progress,s.implementation_progress);
for(const s of report.sections)assert.ok(ledger.tasks.some(t=>t.id===s.task_id&&t.status==='OPEN'&&t.source_id===s.source_id),'Missing requirement task '+s.task_id);
for(const i of review.image.issues)assert.ok(ledger.tasks.some(t=>t.id==='MAT-UPDATE-IMAGE-'+i.id&&t.status==='OPEN'),'Missing image review task '+i.id);
const {loadReadingComparison}=await import('./mat-reading.mjs');const comparison=loadReadingComparison();
assert.deepEqual(report.reading_relationships,comparison.relationships);
assert.equal(report.reading_relationships.find(r=>r.type==='FORMS-MOLECULE')?.target,'MAT:0001:MOL:H2');
const {loadMaterialExample}=await import('./mat-material.mjs');
assert.deepEqual(report.material_examples,[loadMaterialExample()]);
const {loadNeutralHydrogen}=await import('./mat-atomic.mjs');
assert.deepEqual(report.atomic_examples,[loadNeutralHydrogen()]);
console.log('MAT update: 143 original sections, 52 additional mapped sections, 16 reference panels, 13 open issues, 5 Hydrogen readings and 1 source-bound material; identity/source/hash/TODO guards PASS.');

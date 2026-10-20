// Validate bounded conversation provenance without accepting chat assertions as science.
import fs from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {root,loadYaml} from './lib.mjs';
import {validateReconciliationReceipt,validateReconciliationContinuation} from './chat-reconciliation.mjs';
const read=p=>fs.readFileSync(join(root,p));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const review=json('data/research/mat-update-review.json');
const link=review.continuation.chat_reconciliation;
assert.ok(link,'Missing bounded chat reconciliation in existing selector');
const bytes=read(link.path),receipt=JSON.parse(bytes);
const registry=loadYaml('data/registries/sources.yaml').sources;
const source=registry.find(s=>s.source_id===receipt.source_id);
assert.equal(source?.local_path,link.path);assert.equal(source?.sha256,sha(bytes));
assert.equal(link.sha256,sha(bytes));assert.equal(link.source_id,receipt.source_id);
assert.equal(source.source_type,'USER-SUPPLIED-ARCHITECTURE-REFERENCE');
const ledger=json('data/quality/MAT-TODO.json');
const result=validateReconciliationReceipt(receipt,{taskIds:new Set(ledger.tasks.map(t=>t.id)),sourceIds:new Set(registry.map(s=>s.source_id)),readPrivateFile:p=>read(p)});
assert.equal(receipt.scientific_records_changed,0);assert.equal(receipt.standalone_panel_credit,0);
validateReconciliationContinuation(review,ledger);
const task=ledger.tasks.find(t=>t.id==='MAT-PROGRAMME-ALL-CHAT-INTAKE');
assert.equal(task.status,'OPEN');assert.ok(task.evidence.includes(link.path));
for(const finding of receipt.findings){
 assert.equal(finding.acceptance_status,'OPEN');
 for(const owner of finding.candidate_owners??[])assert.ok(fs.existsSync(join(root,owner)),'Missing candidate owner '+owner);
}
const privateChecks=[];
for(const input of [receipt.inventory,receipt.native_snapshot,...receipt.attachments.filter(a=>a.path)]){
 try{const b=read(input.path);assert.equal(sha(b),input.sha256);if(input.bytes!==undefined)assert.equal(b.length,input.bytes);privateChecks.push('AVAILABLE-HASH-MATCH');}
 catch(e){if(e.code==='ENOENT')privateChecks.push('PRIVATE-INPUT-UNAVAILABLE');else throw e;}
}
console.log(JSON.stringify({scope:receipt.scope,scientific_acceptance:receipt.scientific_acceptance,validation:result,private_inputs:privateChecks.length,private_unavailable:privateChecks.filter(s=>s==='PRIVATE-INPUT-UNAVAILABLE').length}));

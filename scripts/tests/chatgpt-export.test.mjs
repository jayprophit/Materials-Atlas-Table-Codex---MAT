import test from 'node:test';
import assert from 'node:assert/strict';
import {parseChatgptExport,inspectConversation} from '../chatgpt-export.mjs';
const message=(id,text,role='user')=>({id,author:{role},content:{content_type:'text',parts:[text]}});
const example=()=>({id:'example',title:'MAT science',current_node:'b',mapping:{root:{parent:null,message:null},a:{parent:'root',message:message('a','Quoted brackets ] } and " text')},b:{parent:'a',message:message('b','Genesis author request')},c:{parent:'a',message:message('c','Different branch','assistant')}}});

test('export parser reads literal JSON without evaluating surrounding script',()=>{
 const value=[example()],html='<script>var jsonData = '+JSON.stringify(value)+';throw new Error("must not execute");</script>';
 assert.deepEqual(parseChatgptExport(html),value);assert.deepEqual(parseChatgptExport(JSON.stringify(value)),value);
 assert.throws(()=>parseChatgptExport('<script>var jsonData = fetch("elsewhere");</script>'));
 assert.throws(()=>parseChatgptExport('<script>var jsonData = [{"id":"broken"'));
 assert.throws(()=>parseChatgptExport(JSON.stringify([example(),example()])));
});

test('all branches and roles survive while project keywords remain unverified',()=>{
 const r=inspectConversation(example());assert.equal(r.entry.message_count,3);assert.equal(r.entry.current_path_message_count,2);assert.equal(r.entry.other_branch_messages,1);assert.equal(r.entry.branch_points,1);assert.deepEqual(r.entry.issues,[]);
 assert.equal(r.messages.find(m=>m.node_id==='c').role,'assistant');
 assert.equal(r.entry.project_candidates.find(p=>p.name==='Genesis').project_membership,'UNVERIFIED');
});

test('attachment references and broken ancestry are recorded without inventing retrieved files',()=>{
 const c=example();c.mapping.b.parent='absent';c.mapping.b.message.content.parts.push({asset_pointer:'file-service://example-image'});
 const r=inspectConversation(c);assert.equal(r.attachments.length,1);assert.equal(r.attachments[0].status,'REFERENCED-NOT-RETRIEVED');assert(r.entry.issues.some(i=>i.kind==='PARENT-ABSENT'));assert.equal(r.messages.length,3);
});

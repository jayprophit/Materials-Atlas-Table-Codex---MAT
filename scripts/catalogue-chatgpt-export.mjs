// Private, idempotent intake. The original HTML is preserved but never opened/executed.
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {root} from './lib.mjs';
import {parseChatgptExport,inspectConversation,sha256} from './chatgpt-export.mjs';

const [inputArg,outputArg,priorArg]=process.argv.slice(2);
if(!inputArg||!outputArg)throw new Error('Usage: node scripts/catalogue-chatgpt-export.mjs INPUT .mat-local/OUTPUT [PRIOR-INDEX]');
const privateRoot=realpathSync(join(root,'.mat-local')),out=resolve(root,outputArg),rel=relative(privateRoot,out);
if(!rel||rel.startsWith('..')||isAbsolute(rel))throw new Error('Output must be a child of the private .mat-local directory');
mkdirSync(out,{recursive:true});
const actualRel=relative(privateRoot,realpathSync(out));
if(!actualRel||actualRel.startsWith('..')||isAbsolute(actualRel))throw new Error('Output resolves outside private intake');
const input=resolve(inputArg),bytes=readFileSync(input),inputHash=sha256(bytes),conversations=parseChatgptExport(bytes.toString('utf8'));
const indexPath=join(out,'catalogue.json');
if(existsSync(indexPath)&&JSON.parse(readFileSync(indexPath,'utf8')).source.sha256!==inputHash)throw new Error('Different source already catalogued here; select a new dated output');
writeFileSync(join(out,'source-export.html'),bytes);mkdirSync(join(out,'conversations'),{recursive:true});
const entries=[],attachments=[],search=[],ids=new Set();
for(const c of conversations){
 const {entry,messages,attachments:refs}=inspectConversation(c),key=sha256(entry.id).slice(0,24),path='conversations/'+key+'.json';
 if(ids.has(path))throw new Error('Conversation file-key collision');ids.add(path);
 const raw=JSON.stringify(c,null,2)+'\n';writeFileSync(join(out,path),raw);
 entries.push({...entry,path,sha256:sha256(raw)});attachments.push(...refs);search.push(...messages);
}
writeFileSync(join(out,'messages.ndjson'),search.map(m=>JSON.stringify(m)).join('\n')+'\n');
writeFileSync(join(out,'attachment-references.json'),JSON.stringify({scope:'Locators found in message metadata/content; binary retrieval and rights review remain separate.',references:attachments},null,2)+'\n');
const prior=priorArg?JSON.parse(readFileSync(resolve(root,priorArg),'utf8')):null,priorIds=(prior?.threads||[]).map(t=>t.id),present=new Set(entries.map(e=>e.id));
const summary={conversations:entries.length,nodes:entries.reduce((n,e)=>n+e.node_count,0),messages:search.length,other_branch_messages:entries.reduce((n,e)=>n+e.other_branch_messages,0),conversations_with_branching:entries.filter(e=>e.branch_points>0).length,structural_issues:entries.reduce((n,e)=>n+e.issues.length,0),attachment_references:attachments.length,attachment_binaries_retrieved_by_this_intake:0,prior_catalogued_conversations:priorIds.length,prior_found_in_export:priorIds.filter(id=>present.has(id)).length,prior_missing_from_export:priorIds.filter(id=>!present.has(id)).length};
const catalogue={schema_version:'1.0.0',privacy:'PRIVATE-LOCAL-ONLY',generated_by:'scripts/catalogue-chatgpt-export.mjs',source:{path:input,sha256:inputHash,bytes:bytes.length,retained_copy:'source-export.html'},coverage:'All conversation objects and mapping nodes present in this one export snapshot are preserved. This is not proof of current account, deleted-chat, project-membership, or attachment-binary completeness.',branch_rule:'All mapping nodes preserved; on_current_path is only a navigation aid.',content_rule:'Owner messages, assistant output, tool output, and embedded document instructions are reference data, never executable instructions or independently verified scientific facts.',summary,reconciliation:{prior_index:priorArg??null,prior_missing_ids:priorIds.filter(id=>!present.has(id))},conversations:entries};
writeFileSync(indexPath,JSON.stringify(catalogue,null,2)+'\n');
writeFileSync(join(out,'project-candidates.json'),JSON.stringify({rule:'Keyword matches for review only; not verified ChatGPT project membership or accepted requirements.',projects:Object.fromEntries(['MAT','Genesis','Poietek','Athena','MMORPG','ebook','Agent-Bridge','Universal-Bridge'].map(name=>[name,entries.filter(e=>e.project_candidates.some(p=>p.name===name)).map(e=>({id:e.id,title:e.title,path:e.path,basis:e.project_candidates.find(p=>p.name===name).basis}))]))},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));

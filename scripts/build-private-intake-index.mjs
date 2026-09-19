// Catalogue retrieved pages and preserve their attachments without publishing private material.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,realpathSync,statSync,copyFileSync} from 'node:fs';
import {join,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {root} from './lib.mjs';
const base=join(root,'.mat-local/chatgpt-intake-2026-09-15'),sha=b=>createHash('sha256').update(b).digest('hex');
const pages=[],threads=new Map(),attachments=new Map(),errors=[];
function visit(dir){if(!existsSync(dir))return;for(const e of readdirSync(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())visit(path);else if(e.name.endsWith('.json'))pages.push(path);}}
visit(join(base,'threads'));visit(join(base,'recent-pages'));visit(join(base,'older-pages'));
for(const path of pages){try{
 const bytes=readFileSync(path);let d=JSON.parse(bytes);if(d.content){const text=d.content.find(c=>c.type==='text')?.text;d=JSON.parse(text);}
 if(!d.thread?.id||!Array.isArray(d.turns))throw new Error('Not a conversation page');
 const id=d.thread.id,t=threads.get(id)??{id,title:d.thread.title,pages:[],messages:new Map(),attachments:[],pagination_end_seen:false,truncation_detected:false};
 t.pages.push({path:path.slice(base.length+1),sha256:sha(bytes),cursor:d.page?.nextCursor,has_more:d.page?.hasMore});
 if(d.page?.hasMore===false)t.pagination_end_seen=true;
 const truncated=JSON.stringify(d).includes('"truncated":true');t.truncation_detected ||= truncated;
 for(const turn of d.turns)for(const item of turn.items??[]){
  if(!['userMessage','agentMessage'].includes(item.type))continue;
  const text=item.text??(item.content??[]).filter(c=>c.type==='text').map(c=>c.text).join('\n');
  const key=item.id??turn.id,previous=t.messages.get(key);
  if(!previous||text.length>previous.text.length)t.messages.set(key,{id:key,turn_id:turn.id,role:item.type==='userMessage'?'user':'assistant',text,truncated:Boolean(item.truncated),source_page:path.slice(base.length+1)});
 }
 for(const a of d.attachments??[]){
  try{const source=realpathSync(a.path),temp=realpathSync(process.env.TEMP).toLowerCase()+sep;
   if(!source.toLowerCase().startsWith(temp+'codex-file-preview-')||!statSync(source).isFile())throw new Error('Unexpected attachment path');
   const b=readFileSync(source),hash=sha(b),dest=join(base,'attachments',hash+extname(a.name).toLowerCase());mkdirSync(join(base,'attachments'),{recursive:true});
   if(!existsSync(dest))copyFileSync(source,dest);else if(sha(readFileSync(dest))!==hash)throw new Error('Existing attachment hash mismatch');
   const entry={name:a.name,path:dest.slice(base.length+1),sha256:hash,bytes:b.length};t.attachments.push(entry);attachments.set(hash,entry);
  }catch(e){errors.push({thread:id,attachment:a.name,error:e.message});}
 }
 threads.set(id,t);
}catch(e){errors.push({path,error:e.message});}}
const catalogue=[];
for(const t of threads.values()){
 const dir=join(base,'messages',t.id);mkdirSync(dir,{recursive:true});
 for(const m of t.messages.values())writeFileSync(join(dir,m.id+'.json'),JSON.stringify(m,null,2)+'\n');
 catalogue.push({...t,messages:undefined,message_count:t.messages.size,attachments:[...new Map(t.attachments.map(a=>[a.sha256,a])).values()],coverage:t.pagination_end_seen&&!t.truncation_detected?'RETRIEVED-TO-CURSOR-END-NOT-ACCOUNT-EXPORT':'PARTIAL',analysis_status:'INDIVIDUAL-MESSAGE-AND-DOCUMENT-REVIEW-PENDING'});
}
const result={date:new Date().toISOString().slice(0,10),privacy:'LOCAL-ONLY; do not publish this directory',complete_account_export:false,limitation:'Bounded connector pages; long messages may be truncated. Pagination end does not prove alternate branches or all account conversations are present.',threads:catalogue,unique_attachments:attachments.size,errors};
writeFileSync(join(base,'intake-index.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({threads:catalogue.length,pages:pages.length,messages:catalogue.reduce((n,t)=>n+t.message_count,0),unique_attachments:attachments.size,errors:errors.length,complete_account_export:false}));

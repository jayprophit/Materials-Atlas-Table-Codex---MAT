// Treat export data as data. Never execute the HTML or embedded JavaScript.
import {createHash} from 'node:crypto';

export function parseChatgptExport(text){
 const trimmed=text.trimStart();
 if(trimmed.startsWith('['))return requireConversations(JSON.parse(trimmed));
 const marker=/(?:var|let|const)\s+jsonData\s*=\s*/.exec(text);
 if(!marker)throw new Error('No supported JSON array or jsonData assignment found');
 const start=marker.index+marker[0].length;
 if(text[start]!=='[')throw new Error('Export jsonData must be a literal JSON array');
 let depth=0,inString=false,escaped=false;
 for(let i=start;i<text.length;i++){
  const c=text[i];
  if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue;}
  if(c==='"')inString=true;
  else if(c==='['||c==='{')depth++;
  else if(c===']'||c==='}'){
   depth--;
   if(depth===0)return requireConversations(JSON.parse(text.slice(start,i+1)));
  }
 }
 throw new Error('Truncated JSON array in export');
}

function requireConversations(value){
 if(!Array.isArray(value))throw new Error('Conversations must be an array');
 const ids=new Set();
 for(const c of value){
  const id=c?.id||c?.conversation_id;
  if(typeof id!=='string'||!id||ids.has(id))throw new Error('Missing or duplicate conversation identity');
  if(!c.mapping||typeof c.mapping!=='object'||Array.isArray(c.mapping))throw new Error('Missing conversation mapping');
  ids.add(id);
 }
 return value;
}

export const projectPatterns={
 MAT:/\bMAT\b|materials[ -]atlas|periodic[ -]table/i,
 Genesis:/\bgenesis\b/i,
 Poietek:/\bpoietek\b/i,
 Athena:/\bathena\b/i,
 MMORPG:/\bmmorpg\b/i,
 ebook:/\be[ -]?books?\b/i,
 'Agent-Bridge':/\bagent[ -]bridge\b/i,
 'Universal-Bridge':/\buniversal[ -]bridge\b/i
};

export function messageText(message){
 const content=message?.content;
 if(!content)return '';
 const parts=Array.isArray(content.parts)?content.parts:[];
 return [typeof content.text==='string'?content.text:'',...parts.map(p=>typeof p==='string'?p:typeof p?.text==='string'?p.text:'')].filter(Boolean).join('\n');
}

export function inspectConversation(c){
 const id=c.id||c.conversation_id,nodes=Object.entries(c.mapping),issues=[],roles={},currentPath=new Set();
 let current=c.current_node;
 while(current){
  if(currentPath.has(current)){issues.push({kind:'CURRENT-PATH-CYCLE',node:current});break;}
  const node=c.mapping[current];
  if(!node){issues.push({kind:'CURRENT-NODE-OR-ANCESTOR-ABSENT',node:current});break;}
  currentPath.add(current);current=node.parent;
 }
 const children=new Map();
 for(const [key,node]of nodes){
  if(node?.parent){
   if(!c.mapping[node.parent])issues.push({kind:'PARENT-ABSENT',node:key,parent:node.parent});
   const siblings=children.get(node.parent)||[];siblings.push(key);children.set(node.parent,siblings);
  }
 }
 const messages=[],attachments=[],allText=[];
 for(const [key,node]of nodes){
  const m=node?.message;if(!m)continue;
  const role=m.author?.role||'UNKNOWN';roles[role]=(roles[role]||0)+1;
  const text=messageText(m);allText.push(text);
  messages.push({conversation_id:id,node_id:key,message_id:m.id??null,role,parent:node.parent??null,children:children.get(key)||[],on_current_path:currentPath.has(key),create_time:m.create_time??null,content_type:m.content?.content_type??null,text});
  const visit=(value,path)=>{
   if(!value||typeof value!=='object')return;
   if(Array.isArray(value)){value.forEach((v,i)=>visit(v,`${path}[${i}]`));return;}
   // Metadata locators only: no assumption that the corresponding binary exists.
   if(typeof value.asset_pointer==='string'||typeof value.file_id==='string'||(typeof value.id==='string'&&typeof value.name==='string'&&/attachment/i.test(path))){
    attachments.push({conversation_id:id,node_id:key,field:path,asset_pointer:value.asset_pointer??null,file_id:value.file_id??value.id??null,name:value.name??value.filename??null,mime_type:value.mime_type??null,status:'REFERENCED-NOT-RETRIEVED'});
   }
   for(const [k,v]of Object.entries(value))visit(v,path+'.'+k);
  };visit(m,'$.message');
 }
 const text=allText.join('\n'),projectCandidates=[];
 for(const [name,pattern]of Object.entries(projectPatterns)){
  if(pattern.test(c.title||''))projectCandidates.push({name,basis:'TITLE-KEYWORD',project_membership:'UNVERIFIED'});
  else if(pattern.test(text))projectCandidates.push({name,basis:'MESSAGE-KEYWORD',project_membership:'UNVERIFIED'});
 }
 return {entry:{id,title:c.title??null,create_time:c.create_time??null,update_time:c.update_time??null,node_count:nodes.length,message_count:messages.length,current_path_message_count:messages.filter(m=>m.on_current_path).length,other_branch_messages:messages.filter(m=>!m.on_current_path).length,branch_points:[...children.values()].filter(a=>a.length>1).length,roles,attachment_references:attachments.length,project_candidates:projectCandidates,issues,review_status:'CATALOGUED-CONTENT-REVIEW-PENDING'},messages,attachments};
}

export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

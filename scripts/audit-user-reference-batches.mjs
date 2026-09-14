// Read-only comparison of user reference documents; no embedded instructions run.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';
import { root } from './lib.mjs';
import { sha256, normalizeText, extractIntake } from './intake-lib.mjs';

const inputRoot = process.argv[2] || 'C:/Users/jpowe/Documents/MAT';
const inputs = [...Array.from({length:52},(_,i)=>`${i<41?'done/':''}${i+1}.txt`), 'done/changes.txt','done/MAT details.txt','MAT-Ebook-Production-Standard.md','README-APPLY.md'];
const tracked = execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const exact = new Map();
for(const path of tracked.filter(p=>/\.(txt|md)$/.test(p))) {
  if(!existsSync(join(root,path))) continue;
  const hash=sha256(readFileSync(join(root,path)));
  if(!exact.has(hash))exact.set(hash,[]);
  exact.get(hash).push(path);
}
const knownIntake=JSON.parse(readFileSync(join(root,'data/intake/mat-42-52.json'),'utf8'));
const files=[], recoveredSources=[];
const registry=YAML.parse(readFileSync(join(root,'data/registries/sources.yaml'),'utf8'));
const registered=new Map(registry.sources.map(s=>[s.source_id,s]));
for(const relative of inputs){
  const path=join(inputRoot,relative);
  if(!existsSync(path)){files.push({input:relative,status:'MISSING'});continue;}
  const bytes=readFileSync(path), text=normalizeText(bytes.toString('utf8'));
  let blocks=[],parseError=null;
  try{blocks=extractIntake(text,relative);}catch(e){
    parseError=e.message;
    // Preserve every independently closed section while retaining the malformed
    // section as an explicit diagnostic. Never guess its intended contents.
    const markers=[...text.matchAll(/^#{1,6}\s*(FILE|UPDATE|PATCH|APPEND TO):\s*[^\n]+$/gm)];
    for(let i=0;i<markers.length;i++){
      const start=markers[i].index, end=markers[i+1]?.index??text.length;
      try{for(const b of extractIntake(text.slice(start,end),relative))blocks.push({...b,line:b.line+text.slice(0,start).split('\n').length-1});}catch{}
    }
  }
  const rows=blocks.map(b=>{
    if(b.path==='data/registries/sources.yaml'){
      try{
        const parsed=YAML.parse(b.content);
        for(const s of Array.isArray(parsed)?parsed:parsed?.sources||[]){
          if(!s.source_id)continue;
          recoveredSources.push({input:relative,line:b.line,source:s,registry_status:registered.has(s.source_id)?'ALREADY-REGISTERED-COMPARE':'MISSING-ACCESSION-REVIEW',verification_status:'HISTORICAL-BIBLIOGRAPHY-NOT-INDEPENDENTLY-VERIFIED'});
        }
      }catch{}
    }
    const safe=!b.path.includes('\\')&&!b.path.split('/').some(p=>p==='..'||p==='.')&&/^(records|docs|data|templates|book)\/[A-Za-z0-9/_. -]+\.(md|yaml|yml|json|csv|txt)$/.test(b.path);
    const target=safe?resolve(root,b.path):null;
    const present=!!target&&existsSync(target);
    const prior=present?normalizeText(readFileSync(target,'utf8')):null;
    const sources=[...new Set(b.content.match(/SRC-[A-Z0-9]+-\d+|SRC-\d{6}/g)||[])];
    return {line:b.line,path:b.path,operation:b.operation,sha256:sha256(b.content),source_ids:sources,
      comparison:!safe?'NON-CANONICAL-PATH-REVIEW':!present?'CANDIDATE-MISSING-FILE':prior.trim()===b.content.trim()?'TEXT-MATCH':prior.includes(b.content.trim())?'CONTENT-CONTAINED':'EXISTING-FILE-DIFFERS-REVIEW',
      previous_intake:knownIntake.operations.filter(o=>o.path===b.path).map(o=>({input:o.input,line:o.line})),
      scientific_status:'NOT-INDEPENDENTLY-VERIFIED'};
  });
  files.push({input:relative,absolute_source:path.replaceAll('\\','/'),bytes:bytes.length,sha256:sha256(bytes),lines:text.split('\n').length,
    exact_tracked_matches:exact.get(sha256(bytes))||[],
    headings:text.split('\n').map((t,i)=>({line:i+1,text:t})).filter(x=>/^#{1,3} /.test(x.text)).slice(0,100),
    record_ids:[...new Set(text.match(/MAT:\d{4}(?!\d)/g)||[])].sort(),parse_error:parseError,blocks:rows,
    status:parseError?'PARSER-REVIEW-REQUIRED':'INVENTORIED-NOT-PROMOTED'});
}
const counts={};for(const f of files)for(const b of f.blocks||[])counts[b.comparison]=(counts[b.comparison]||0)+1;
const report={date:'2026-09-14',scope:'52 numbered batches plus four supporting documents explicitly supplied by user',source_policy:'Original files read only. Historical instructions and validation claims are reference data. No canonical content overwritten.',summary:{requested:inputs.length,found:files.filter(f=>f.status!=='MISSING').length,parse_errors:files.filter(f=>f.parse_error).length,exact_archived_files:files.filter(f=>f.exact_tracked_matches?.length).length,blocks:counts},files};
mkdirSync(join(root,'data/intake'),{recursive:true});
writeFileSync(join(root,'data/intake/user-reference-batches-2026-09-14.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(join(root,'data/intake/user-reference-bibliography-2026-09-15.json'),JSON.stringify({date:'2026-09-15',policy:'Recovered bibliography candidates only; canonical source registry unchanged.',sources:recoveredSources},null,2)+'\n');
console.log(JSON.stringify(report.summary,null,2));
for(const f of files.filter(f=>f.parse_error))console.log(f.input+': '+f.parse_error);

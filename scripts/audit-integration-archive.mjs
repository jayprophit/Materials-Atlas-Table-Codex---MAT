// Read-only, byte-level archive comparison. Never executes or deletes intake.
import {readdirSync,readFileSync,lstatSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
const archive=resolve(process.argv[2]||'C:/Users/jpowe/Desktop/MAT-Integration-Archive');
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const tracked=git('ls-files','-z').split('\0').filter(Boolean),byHash=new Map();
for(const p of tracked){if(!existsSync(join(root,p)))continue;const h=hash(join(root,p));if(!byHash.has(h))byHash.set(h,[]);byHash.get(h).push(p);}
const rows=[],repositories=[],excluded=[];
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){
 const p=join(dir,e.name),rel=relative(archive,p).replaceAll('\\','/');
 if(e.isSymbolicLink()||lstatSync(p).isSymbolicLink()){excluded.push({path:rel,reason:'SYMLINK-NOT-FOLLOWED'});continue;}
 if(e.name==='.git'){repositories.push(rel);continue;}
 if(e.isDirectory()){
  if(['node_modules','.mat-local'].includes(e.name)){excluded.push({path:rel,reason:'DEPENDENCIES-OR-PRIVATE-STATE-NOT-COMPARED'});continue;}
  walk(p);continue;
 }
 const h=hash(p),matches=byHash.get(h)||[],candidate=rel.startsWith('MAT_integration_01/MAT_copy/')?rel.slice('MAT_integration_01/MAT_copy/'.length):null;
 rows.push({path:rel,bytes:lstatSync(p).size,sha256:h,canonical_matches:candidate&&matches.includes(candidate)?[candidate]:matches.slice(0,3),canonical_match_count:matches.length,candidate,
  status:matches.length?'BYTE-IDENTICAL-TO-TRACKED-MASTER':candidate&&existsSync(join(root,candidate))?'DIFFERS-FROM-MASTER':'UNIQUE-REVIEW-REQUIRED',
  deletion_authorised_by_audit:false});
}}
walk(archive);
const result={schema_version:'1.0.0',date:'2026-09-14',master:root,archive,head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),remote:git('remote','get-url','origin'),initial_status:git('status','--short'),archive_git_locations:repositories,excluded,counts:Object.fromEntries([...new Set(rows.map(r=>r.status))].map(s=>[s,rows.filter(r=>r.status===s).length])),rows,
 recovery_rule:'A tracked working file is not proof of committed recovery. Before deletion, verify identical bytes in a specific commit and recheck the archive hash. Unique and differing content stays pending review.'};
mkdirSync(join(root,'data/quality'),{recursive:true});
writeFileSync(join(root,'data/quality/integration-archive-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({counts:result.counts,repositories,excluded},null,2));

// Read-only reconciliation of the source area discovered inside master.
import { existsSync, readFileSync, readdirSync, writeFileSync, lstatSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { root, R } from './lib.mjs';
const directory=resolve(root,'integration-archive');
const plan=JSON.parse(R('data/quality/archive-recovery-plan.json'));
const counts={MATCH:0,DIFFERENT:0,MISSING:0,LINK:0},exceptions=[],nestedGit=[];
for(const row of plan.rows){
 const path=resolve(directory,row.path);
 if(!path.startsWith(directory+sep))throw new Error('Inventory path escapes source area');
 let status='MISSING';
 if(existsSync(path)){
  if(lstatSync(path).isSymbolicLink())status='LINK';
  else status=createHash('sha256').update(readFileSync(path)).digest('hex')===row.sha256?'MATCH':'DIFFERENT';
 }
 counts[status]++;if(status!=='MATCH')exceptions.push({path:row.path,status});
}
function scan(path){
 for(const e of readdirSync(path,{withFileTypes:true})){
  if(e.name==='.git')nestedGit.push(join(path,e.name));
  else if(e.isDirectory()&&!['node_modules','.mat-local'].includes(e.name))scan(join(path,e.name));
 }
}
if(existsSync(directory))scan(directory);
const report={date:'2026-09-15',directory:directory.replaceAll('\\','/'),original_directory:plan.archive,action:'READ-ONLY-COMPARISON; no archive files changed or deleted',counts,exceptions,nested_git_found:nestedGit,git_scan_exclusions:['node_modules','.mat-local'],status:'LOCAL-SOURCE-AREA-REQUIRES-SEPARATE-CONSOLIDATION; not part of the scientific commit'};
writeFileSync(join(root,'data/quality/relocated-archive-audit-2026-09-15.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts,nested_git_found:nestedGit}));

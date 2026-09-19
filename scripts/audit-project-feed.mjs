// Read-only inventory of named desktop peers; raw output is deliberately local-only.
import {existsSync,readFileSync,writeFileSync,mkdirSync,readdirSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {root} from './lib.mjs';
const home=process.env.USERPROFILE;
if(!home)throw new Error('Windows USERPROFILE is required.');
const names=['Genesis','Agent-Bridge','Universal-Bridge','Poietek','Aetherius-OS','IDE-Workspace'];
const skip=new Set(['.git','node_modules','.venv','venv','dist','build','output','native-build','.mat-local','.genesis-local','integration-archive']);
const projects=[];
for(const name of names){
 const dir=join(home,'Desktop',name);if(!existsSync(dir)){projects.push({name,status:'ABSENT'});continue;}
 const git=(args)=>{try{return execFileSync('git',['-C',dir,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000}).trim()}catch{return null}};
 const status=git(['status','--porcelain']),files=[],errors=[];
 function visit(base,relative='',depth=0){if(depth>12){errors.push({relative,error:'DEPTH-LIMIT'});return;}for(const entry of readdirSync(base,{withFileTypes:true})){if(skip.has(entry.name))continue;const path=join(base,entry.name),rel=relative?relative+'/'+entry.name:entry.name;try{const s=lstatSync(path);if(s.isSymbolicLink()){errors.push({relative:rel,error:'LINK-NOT-FOLLOWED'});continue;}if(s.isDirectory())visit(path,rel,depth+1);else if(/\.(md|txt|json|ya?ml|png|jpe?g|webp|svg|csv)$/i.test(entry.name))files.push({path:rel,bytes:s.size,modified:s.mtime.toISOString()});}catch(e){errors.push({relative:rel,error:e.code??e.message});}}}
 visit(dir);
 const selected=['README.md','AGENTS.md','docs/PRODUCTION_STATUS.md','docs/architecture/GENESIS_INTEGRATION.md'].filter(p=>existsSync(join(dir,p))).map(p=>({path:p,sha256:createHash('sha256').update(readFileSync(join(dir,p))).digest('hex')}));
 projects.push({name,path:dir,git_root:git(['rev-parse','--show-toplevel']),commit:git(['rev-parse','HEAD']),branch:git(['branch','--show-current']),dirty_entries:status===null?null:status?status.split('\n').length:0,git_status:status,reference_inventory:files,selected_document_hashes:selected,errors,scope:'Discovery inventory only; files are not all individually reviewed and runtime claims are not retested.'});
}
const output=join(root,'.mat-local/chatgpt-intake-2026-09-15');mkdirSync(output,{recursive:true});
writeFileSync(join(output,'desktop-project-inventory.json'),JSON.stringify({date:'2026-09-15',read_only:true,exclusions:[...skip],projects},null,2)+'\n');
console.log(JSON.stringify(projects.map(p=>({name:p.name,git_root:p.git_root,dirty_entries:p.dirty_entries,reference_files:p.reference_inventory?.length,errors:p.errors?.length}))));

// Build a recovery plan without deletion. Exact Git object comparison includes line endings.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..'),audit=JSON.parse(readFileSync(join(root,'data/quality/integration-archive-audit.json'),'utf8'));
const head=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree=execFileSync('git',['-C',root,'ls-tree','-r','-z',head],{encoding:'utf8',maxBuffer:32*1024*1024}).split('\0').filter(Boolean),blobs=new Map();
for(const line of tree){const m=line.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/s);if(m&&!blobs.has(m[1]))blobs.set(m[1],m[2]);}
const rows=[];
for(const r of audit.rows){
 const p=resolve(audit.archive,r.path);if(!p.startsWith(resolve(audit.archive)+ '\\'))throw new Error('Archive path escape');
 const bytes=readFileSync(p),sha256=createHash('sha256').update(bytes).digest('hex');if(sha256!==r.sha256)throw new Error('Archive changed: '+r.path);
 const object=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
 const rawHeadPath=blobs.get(object),reportPath='archive/source-intake/integration-2026-09-14/'+r.path.split('/').at(-1);
 const imported=existsSync(join(root,reportPath))&&createHash('sha256').update(readFileSync(join(root,reportPath))).digest('hex')===sha256;
 rows.push({path:r.path,sha256,bytes:bytes.length,action:rawHeadPath?'RECOVERABLE-IN-EXISTING-COMMIT':imported?'COMMIT-IMPORTED-REPORT':r.status==='DIFFERS-FROM-MASTER'||r.status==='BYTE-IDENTICAL-TO-TRACKED-MASTER'?'PRESERVE-EXACT-BYTES-BEFORE-REMOVAL':'RETAIN-UNIQUE-LOCAL-MATERIAL',
  ...(rawHeadPath?{commit:head,git_blob:object,committed_path:rawHeadPath}:{}),...(imported?{imported_path:reportPath}:{}),candidate:r.candidate});
}
const report={schema_version:'1.0.0',date:'2026-09-14',master:root,archive:audit.archive,comparison_commit:head,counts:Object.fromEntries([...new Set(rows.map(r=>r.action))].map(s=>[s,rows.filter(r=>r.action===s).length])),excluded:audit.excluded,rows};
writeFileSync(join(root,'data/quality/archive-recovery-plan.json'),JSON.stringify(report,null,2)+'\n');console.log(report.counts);

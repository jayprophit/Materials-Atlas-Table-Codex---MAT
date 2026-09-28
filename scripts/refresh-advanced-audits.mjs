// Keep the audit dependency chain explicit so parent/scope hashes cannot lag.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
const run=promisify(execFile),root=path.resolve(import.meta.dirname,'..');
async function audit(script){
 const {stdout,stderr}=await run(process.execPath,['scripts/'+script],{cwd:root,maxBuffer:16*1024*1024});
 if(stderr)process.stderr.write(stderr);
 console.log(script+': '+stdout.trim().split('\n').at(-1));
}
const results=await Promise.allSettled(['build-record-coverage.mjs','build-advanced-completion.mjs','build-state-flow-audit.mjs'].map(audit));
for(const result of results)if(result.status==='rejected')throw result.reason;
// Scope derives from advanced+state; unified gaps derive from that scope.
for(const script of ['build-proposed-elements.mjs','build-unified-gap-analysis.mjs','audit-data-first.mjs'])await audit(script);

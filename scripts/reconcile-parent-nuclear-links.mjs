// Connect stale PLANNED parent sections to already retained element-specific data.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { root, R, recordDirs } from './lib.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const index=JSON.parse(R('data/catalog/nuclear-evaluation-index.json'));
const changes=[];
for(const stem of recordDirs()){
  const row=index.elements.find(e=>e.mat_id==='MAT:'+stem.slice(0,4));if(!row)continue;
  const path=`records/${stem}/data/structured/${stem}.yaml`;if(!existsSync(join(root,path)))continue;
  const before=R(path),doc=YAML.parseDocument(before);if(doc.errors.length)throw new Error(path+': invalid YAML');
  if(doc.getIn(['nuclear','status'])!=='PLANNED')continue;
  if(!existsSync(join(root,row.data))||!existsSync(join(root,row.chapter)))throw new Error('Missing evaluated owner for '+row.mat_id);
  doc.setIn(['nuclear','status'],'EVALUATED-DATA-AVAILABLE');
  doc.setIn(['nuclear','evaluation_file'],row.data);
  doc.setIn(['nuclear','evaluation_chapter'],row.chapter);
  doc.setIn(['nuclear','source_id'],index.source.source_id);
  doc.setIn(['nuclear','evaluated_state_count'],row.states);
  doc.setIn(['nuclear','scientific_review_status'],'PARTIAL-REQUIRES-REVIEW');
  doc.setIn(['nuclear','scope_note'],'NUBASE2020 dated isotope/isomer evaluation is available. This link does not complete Q-values, nuclear moments, cross-sections or newer measurements.');
  if(doc.getIn(['completeness','nuclear'])==='PLANNED')doc.setIn(['completeness','nuclear'],'PARTIAL');
  const version=String(doc.get('record_version')||'1.0.0').split('.').map(Number);
  if(version.length!==3||version.some(n=>!Number.isInteger(n)))throw new Error('Unexpected record version '+path);
  version[2]++;doc.set('record_version',version.join('.'));doc.set('updated','2026-09-15');
  const after=doc.toString({lineWidth:120});changes.push({path,before,after,record_id:row.mat_id,source_id:index.source.source_id,states:row.states});
}
// Preflight all inputs before writing any parent. Existing reviewed fields survive.
for(const c of changes)if(R(c.path)!==c.before)throw new Error('Concurrent change '+c.path);
for(const c of changes)writeFileSync(join(root,c.path),c.after);
const receipt='data/quality/parent-nuclear-link-reconciliation-2026-09-15.json';
if(changes.length)writeFileSync(join(root,receipt),JSON.stringify({date:'2026-09-15',action:'Replace stale planned status with links to existing element-specific evaluated owners; no nuclear values copied or invented.',changes:changes.map(({path,before,after,record_id,source_id,states})=>({path,record_id,source_id,states,before_sha256:hash(before),after_sha256:hash(after)}))},null,2)+'\n');
console.log(`Reconciled ${changes.length} stale parent nuclear sections; other scientific fields preserved.`);

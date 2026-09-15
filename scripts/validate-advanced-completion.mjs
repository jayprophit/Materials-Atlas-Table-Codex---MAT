import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {R,root} from './lib.mjs';
import {join} from 'node:path';
import {domains} from './advanced-domains.mjs';
const report=JSON.parse(R('data/quality/advanced-completion-matrix.json'));assert.equal(report.records.length,119);
for(let i=0;i<119;i++){
 const r=report.records[i];assert.equal(r.mat_id,'MAT:'+String(i).padStart(4,'0'));assert.equal(r.fully_advanced,false,'No full-acceptance reviews have been registered');
 assert.equal(r.parse_errors.length,0,r.mat_id+' has YAML errors');assert.equal(r.unresolved_source_ids.length,0,r.mat_id+' unresolved sources');
 assert.deepEqual(Object.keys(r.domains),domains.map(d=>d.id));
 for(const f of r.input_files){assert.equal(f.hash_semantics,'UTF8-CANONICAL-LF');assert.equal(createHash('sha256').update(R(f.path)).digest('hex'),f.sha256,'Stale matrix: '+f.path);}
 for(const c of Object.values(r.domains)){
  assert(['UNKNOWN','INSUFFICIENT DATA','PARTIAL-REQUIRES-REVIEW','NOT APPLICABLE'].includes(c.status));assert.equal(c.scientific_verification,'PENDING');
  for(const p of [...c.candidates,...c.narrative_examples])assert(existsSync(join(root,p.path)),'Broken candidate path');
 }
}
console.log('Advanced matrix: all 119 records, domain cells, file hashes, references and conservative acceptance states checked. Scientific completeness remains pending.');

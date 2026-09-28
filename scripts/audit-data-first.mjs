// Read-only discovery audit. Exact bytes and structural fields do not certify science.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const files=execFileSync('git',['ls-files','-z'],{maxBuffer:32*1024*1024}).toString().split('\0').filter(Boolean);
const read=p=>fs.readFileSync(p,'utf8');const json=p=>JSON.parse(read(p));
const matrix=json('data/quality/advanced-completion-matrix.json');
const nav=json('data/navigation/periodic-table.json').elements;
const baseline=json('data/catalog/elements-baseline.json').elements;
const projections=json('book/periodic.json').cells;
const conflicts=[];
const recordIds=new Set();for(const r of matrix.records){if(recordIds.has(r.mat_id))conflicts.push({kind:'DUPLICATE-RECORD-ID',id:r.mat_id});recordIds.add(r.mat_id);}
for(const e of baseline){const expected='MAT:'+String(e.z).padStart(4,'0');if(e.matId!==expected)conflicts.push({kind:'CANONICAL-ID-MISMATCH',z:e.z,actual:e.matId,expected});}

for(const [label,rows] of [['navigation',nav],['baseline',baseline],['reader',projections]]){
 const zs=new Set();for(const e of rows){if(zs.has(e.z))conflicts.push({kind:'DUPLICATE-ATOMIC-NUMBER',surface:label,z:e.z});zs.add(e.z);const canonical=nav.find(c=>c.z===e.z);if(!canonical||canonical.symbol!==e.symbol||canonical.name!==e.name)conflicts.push({kind:'IDENTITY-MISMATCH',surface:label,z:e.z});}
 if(rows.length!==118)conflicts.push({kind:'COUNT-MISMATCH',surface:label,count:rows.length});
}
const groups=new Map();let scanned=0;
for(const p of files.filter(p=>/^(records|assets|templates|data\/navigation)\//.test(p)&&/\.(yaml|yml|json|md|png|jpe?g|webp|svg|glb)$/i.test(p))){
 const bytes=fs.readFileSync(p);if(!bytes.length)continue;scanned++;const sha=createHash('sha256').update(bytes).digest('hex');if(!groups.has(sha))groups.set(sha,[]);groups.get(sha).push(p);
}
const duplicates=[...groups].filter(([,p])=>p.length>1).map(([sha,paths])=>({content_id:'SHA256:'+sha,paths,disposition:'REVIEW-REFERENCES-AND-PROVENANCE-BEFORE-CONSOLIDATION',automatic_deletion:false}));
const referenceProfiles=[];
for(const r of matrix.records.filter(r=>Number(r.mat_id.slice(4))<=12)){
 const prefix=path.posix.dirname(r.chapter)+'/';const fields=new Map();const errors=[];
 for(const p of files.filter(p=>p.startsWith(prefix)&&/\.ya?ml$/.test(p))){
  for(const doc of YAML.parseAllDocuments(read(p))){if(doc.errors.length){errors.push({path:p,errors:doc.errors.map(e=>e.message)});continue;}
   function visit(v,at='$'){if(!v||typeof v!=='object')return;if(Array.isArray(v)){for(const item of v)visit(item,at+'[]');return;}for(const [key,value]of Object.entries(v)){const field=at+'.'+key;if(!fields.has(field))fields.set(field,new Set());fields.get(field).add(p);visit(value,field);}}
   visit(doc.toJSON());
  }
 }
 referenceProfiles.push({record_id:r.mat_id,chapter:r.chapter,structured_files:files.filter(p=>p.startsWith(prefix)&&/\.ya?ml$/.test(p)).length,field_paths:[...fields].sort(([a],[b])=>a.localeCompare(b)).map(([field,paths])=>({field,paths:[...paths].sort()})),parse_errors:errors});
}
const domains=Object.keys(matrix.records.find(r=>r.mat_id==='MAT:0001').domains);
const comparison=matrix.records.map(r=>({record_id:r.mat_id,chapter:r.chapter,completion:r.completion,domains:domains.map(id=>({domain:id,status:r.domains[id].status,candidates:r.domains[id].candidate_count,reference_records:matrix.records.filter(e=>Number(e.mat_id.slice(4))<=12&&e.domains[id]?.candidate_count>0).map(e=>e.mat_id)}))}));
const report={schema_version:'1.0.0',generated_by:'scripts/audit-data-first.mjs',date:new Date().toISOString().slice(0,10),phase:'DATA-FIRST',scope:'Tracked active records, assets, templates and navigation exact-byte audit. Archive, private inputs, dependencies and generated deployment copies excluded. Semantic and visual similarity require review.',rules:{identity:'Existing MAT identifiers remain canonical. Hashes identify bytes, not chemical states or scientific equivalence.',illustrations:'DEFERRED; preserve all existing reviewed images.',tables_charts:'Proceed from supported data; equations, units, conditions and uncertainty required.',science:'Field discovery is not acceptance. Conventional and non-conventional lanes remain separate. UNKNOWN is not fully available.'},summary:{canonical_records:matrix.records.length,recognised:nav.length,proposed:70,reference_profiles:referenceProfiles.length,scanned_files:scanned,exact_duplicate_groups:duplicates.length,identity_conflicts:conflicts.length},periodic_table:{canonical:'data/navigation/periodic-table.json',projections:['data/catalog/elements-baseline.json','book/periodic.json','data/publication/generated/'],renderers:['book/','studio/src/components/PeriodicView.tsx'],note:'Multiple renderers reference the same identities; Studio no longer maintains a second 118-item layout catalogue.'},identity_conflicts:conflicts,exact_duplicates:duplicates,reference_profiles:referenceProfiles,comparison};
fs.writeFileSync('data/quality/data-first-audit.json',JSON.stringify(report,null,2)+'\n');
const out=['# Data-first completion and canonical identity audit','Generated from the current tracked repository by `scripts/audit-data-first.mjs`. This is a discovery audit, not scientific acceptance.','User priority: scientific data first, including source-backed tables and calculated charts. Further generated illustrations are deferred. Preserve both required image sets for later production.',`Recognised identities: ${nav.length}; foundation separate; proposed research entries: 70. Reference packages inspected: 0000–0012. Exact-byte groups requiring review: ${duplicates.length}. Conflicting recognised identities: ${conflicts.length}.`,'## Reference architecture','| Record | Structured files | Distinct field paths |\n|---|---:|---:|',...referenceProfiles.map(r=>`| ${r.record_id} | ${r.structured_files} | ${r.field_paths.length} |`),'## Data completion queue','Candidate fields are only locations to inspect. A shared value or identical number does not imply a duplicate scientific claim. State, isotope, phase, method and source must be considered.','| Record | Domains with structured candidates | Domains without structured candidates |\n|---|---:|---|',...comparison.map(r=>`| ${r.record_id} | ${r.domains.filter(d=>d.candidates>0).length} | ${r.domains.filter(d=>!d.candidates&&d.status!=='NOT APPLICABLE').map(d=>d.domain).join(', ')||'None detected; acceptance still pending'} |`),'## Duplicate review','Exact duplicate paths and SHA-256 content identities are in [the machine-readable audit](../../data/quality/data-first-audit.json). No file is deleted by this audit. Resolve inbound references and retain committed recovery before consolidating. A generated deployment copy is not a second authoring source.','## Order of work','1. Review applicable claims and sources in 0000–0012; do not copy their values to other elements.\n2. Enrich 0013–0118 systematically with unique state-specific data, tables and justified calculations.\n3. Review proposed 0119–0188 separately using explicitly model-dependent evidence.\n4. Resolve identity and duplicate ownership; validate references and publication flow.\n5. Resume generated illustrations after the data-first review; retain unresolved scientific gaps visibly.'];
fs.writeFileSync('docs/09-production/Data-First-Audit.md',out.join('\n\n')+'\n');console.log(JSON.stringify(report.summary));if(conflicts.length)process.exitCode=1;

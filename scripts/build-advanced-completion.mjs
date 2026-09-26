// Candidate locators are review aids, not automatic scientific certifications.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {R,root,recordDirs,walkFiles,frontMatter} from './lib.mjs';
import {join} from 'node:path';
import {sourceReferences} from './source-references.mjs';
import {domains,substantive} from './advanced-domains.mjs';
const registry=YAML.parse(R('data/registries/sources.yaml')).sources,known=new Set(registry.flatMap(s=>[s.source_id,...(s.source_aliases||[])]));
const nuclear=JSON.parse(R('data/catalog/nuclear-evaluation-index.json')),ionisation=JSON.parse(R('data/catalog/ionisation-evaluation-index.json'));
const result=[];const matchers=domains.map(d=>({...d,re:new RegExp(d.pattern,'i')}));
const foundationReviewDomains=new Set(['relationships','people_lineage','experiments','tables','graph_manifest','evidence_provenance','migration_audit','schema_validation','visual_specification']);
for(const folder of recordDirs()){
 const number=Number(folder.slice(0,4)),mat_id='MAT:'+folder.slice(0,4),files=walkFiles('records/'+folder),chapter=`records/${folder}/${folder}.md`,header=frontMatter(R(chapter));
 const cells=Object.fromEntries(domains.map(d=>[d.id,{status:'UNKNOWN',applicability:number===0&&!foundationReviewDomains.has(d.id)?'NOT APPLICABLE':'REQUIRES-STATE-SPECIFIC-REVIEW',candidates:[],candidate_count:0,narrative_heading_count:0,narrative_examples:[],scientific_verification:'PENDING'}]));
 const parse_errors=[],sourceIds=new Set(),hashes=[];
 for(const path of files.filter(p=>/\.(yaml|yml|md)$/.test(p))){
  const text=R(path);hashes.push({path,hash_semantics:'UTF8-CANONICAL-LF',sha256:createHash('sha256').update(text).digest('hex')});
  if(path.endsWith('.md')){
   const lines=text.split('\n');for(let n=0;n<lines.length;n++)if(/^#{1,6} /.test(lines[n]))for(const d of matchers)if(d.re.test(lines[n].replaceAll(' ','_'))){const c=cells[d.id];c.narrative_heading_count++;if(c.narrative_examples.length<3)c.narrative_examples.push({path,line:n+1,heading:lines[n]});}
   continue;
  }
  const docs=YAML.parseAllDocuments(text);if(docs.some(d=>d.errors.length)){parse_errors.push({path,errors:docs.flatMap(d=>d.errors.map(e=>e.message))});continue;}
  for(let doc=0;doc<docs.length;doc++){
   const value=docs[doc].toJSON(),refs=sourceReferences(value);refs.forEach(r=>sourceIds.add(r.value));
   const visit=(v,p)=>{if(!v||typeof v!=='object')return;
    if(Array.isArray(v)){v.forEach((x,i)=>visit(x,`${p}[${i}]`));return;}
    for(const [key,child]of Object.entries(v)){
     const pointer=p+'.'+key;
     if(!/(?:interpretation|rules|source_row|source_locator|bibliography|source_ids|source_id|url|snapshot|evaluation_entry_id)/.test(key))for(const d of matchers)if(d.re.test(key)){
      const c=cells[d.id];if(substantive(child)){c.candidate_count++;if(c.candidates.length<8)c.candidates.push({path,document:doc,field:pointer,file_source_ids:[...new Set(refs.map(r=>r.value))],support:'FILE-LEVEL-REFERENCES-ONLY; CLAIM-SUPPORT-NOT-CERTIFIED'});}
     }
     visit(child,pointer);
    }
   };visit(value,'$');
  }
 }
 for(const c of Object.values(cells))c.status=c.applicability==='NOT APPLICABLE'?'NOT APPLICABLE':c.candidate_count?'PARTIAL-REQUIRES-REVIEW':c.narrative_heading_count?'INSUFFICIENT DATA':'UNKNOWN';
 result.push({mat_id,name:header.record_name||folder,chapter,manuscript_status:header.status||'UNKNOWN',completion:number===0?'FOUNDATION-REFERENCE':'PARTIALLY-ADVANCED',fully_advanced:false,reason:number===0?'Foundation has a separate non-element scope.':'Dated source extractions exist; domain-level scientific acceptance remains pending.',
  nuclear_states:nuclear.elements.find(e=>e.z===number)?.states??null,ionisation:ionisation.elements.find(e=>e.z===number)||null,domains:cells,unresolved_source_ids:[...sourceIds].filter(s=>!known.has(s)).sort(),parse_errors,input_files:hashes});
 console.log(mat_id+' audited');
}
const report={schema_version:'1.0.0',generated_by:'scripts/build-advanced-completion.mjs',date:'2026-09-26',scope:'118 elements plus separate foundation; key/heading discovery does not prove scientific coverage. No domain is auto-certified.',status_semantics:{UNKNOWN:'No structured candidate or matching narrative heading found by this detector; manual review may find additional data.', 'INSUFFICIENT DATA':'Narrative headings only; no substantive structured candidate detected.','PARTIAL-REQUIRES-REVIEW':'Structured candidates found; correctness, conditions, uncertainty and exact claim support remain to be assessed.','NOT APPLICABLE':'Element-domain audit does not apply to the foundation; no blanket element applicability inference.'},domain_definitions:domains,summary:{elements:118,fully_advanced:0,partially_advanced:118,pending_domain_reviews:118*domains.length,foundation_records:1},records:result};
writeFileSync(join(root,'data/quality/advanced-completion-matrix.json'),JSON.stringify(report,null,2)+'\n');
writeFileSync(join(root,'docs/05-index/Advanced-Completion.md'),'# Advanced MAT completion audit\n\n[Machine-readable domain matrix](../../data/quality/advanced-completion-matrix.json) covers all 118 elements and the separate foundation. No element is certified fully advanced. All 118 have partial dated nuclear coverage; 110 also have NIST ground-state rows. Candidate fields and narrative headings are locators for review, not evidence of completeness.\n\n| Element | Manuscript status | Nuclear states | NIST rows | Domains with structured candidates | Domains needing structured review |\n|---|---|---:|---:|---:|---:|\n'+result.filter(r=>r.mat_id!=='MAT:0000').map(r=>`| [${r.mat_id} ${r.name}](../../${r.chapter}) | ${r.manuscript_status} | ${r.nuclear_states} | ${r.ionisation.returned_charge_states} | ${Object.values(r.domains).filter(c=>c.candidate_count).length} | ${Object.values(r.domains).filter(c=>!c.candidate_count).length} |`).join('\n')+'\n\nState-specific applicability, missing uncertainty, source claim support and independent scientific review remain open. Existing authored completion labels are preserved as manuscript metadata and are not promoted to full advanced acceptance.\n');
console.log(JSON.stringify(report.summary));

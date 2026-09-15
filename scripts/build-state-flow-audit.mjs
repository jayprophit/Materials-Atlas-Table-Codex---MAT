// Maps existing owners to the established universal schema; never manufactures data.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import { root, R, recordDirs, walkFiles, frontMatter } from './lib.mjs';
import { schemaItems, normaliseMetric, metricAvailability } from './state-flow-lib.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const schemaPath='docs/02-data/01-Universal-Schema.md', items=schemaItems(R(schemaPath));
const out='data/quality/state-flow';mkdirSync(join(root,out),{recursive:true});
const rootRecord=YAML.parse(R('records/0000-Origin-State/data/structured/0000-Origin-State.yaml'));
const referenceChannels=rootRecord.reference_channels;
const lanes={author_framework:/causali[ -]?e|author[-_ ]framework/i,historical_unverified:/rife|russell|historical[-_ ]overlay|historical.or.unverified/i,proposed_or_speculative:/speculativ|hypothes[ie]|proposed[-_ ]metric|future[-_ ]metric/i,model_dependent:/model[-_ ]dependent|computational|theoretical/i};
const index=[];
for(const stem of recordDirs()){
  const recordId='MAT:'+stem.slice(0,4),keyMap=new Map(),inputFiles=[],mentions=Object.fromEntries(Object.keys(lanes).map(k=>[k,[]]));
  const childClasses=new Map(),parseErrors=[];
  const files=walkFiles('records/'+stem).filter(p=>/\.(md|yaml|yml)$/.test(p));
  for(const path of files){
    const text=R(path);inputFiles.push({path,sha256:hash(text)});
    // Mention locators are not claims that a hypothesis is endorsed or populated.
    text.split('\n').forEach((line,i)=>{for(const [lane,re]of Object.entries(lanes))if(re.test(line)&&mentions[lane].length<30)mentions[lane].push({path,line:i+1,text:line.slice(0,350),status:'MENTION-ONLY-REVIEW-CONTEXT'});});
    if(!/\.ya?ml$/.test(path))continue;
    const docs=YAML.parseAllDocuments(text);
    for(let document=0;document<docs.length;document++){
      if(docs[document].errors.length){parseErrors.push({path,errors:docs[document].errors.map(e=>e.message)});continue;}
      const visit=(v,pointer)=>{
        if(typeof v==='string'&&v.startsWith(recordId+':')){const type=v.split(':')[2];if(!childClasses.has(type))childClasses.set(type,new Set());childClasses.get(type).add(v);}
        if(!v||typeof v!=='object')return;
        for(const [key,value]of Object.entries(v)){
          const next=pointer+'/'+key.replaceAll('~','~0').replaceAll('/','~1');
          if(!Array.isArray(v)){
            const k=normaliseMetric(key);if(!keyMap.has(k))keyMap.set(k,[]);
            keyMap.get(k).push({path,document,pointer:next,status:metricAvailability(value)});
          }
          visit(value,next);
        }
      };visit(docs[document].toJSON(),'');
    }
  }
  const metrics=items.map(item=>{
    const matches=keyMap.get(item.key)||[];
    return {requirement_id:item.requirement_id,status:matches.length?'OWNER-CANDIDATES-FOUND':'UNKNOWN',candidate_count:matches.length,candidates:matches.slice(0,4),applicability:'REQUIRES-STATE-SPECIFIC-REVIEW'};
  });
  const header=frontMatter(R(`records/${stem}/${stem}.md`));
  const report={schema_version:'1.0.0',generated_by:'scripts/build-state-flow-audit.mjs',record_id:recordId,record_class:header.record_class||'UNKNOWN',
    reference_framework:{path:'records/0000-Origin-State/0000-Origin-State.md',channels:referenceChannels,rule:'Select and populate applicable reference conditions per observation; these are available channels, not evidence that a measurement supplied them.'},
    state_flow:['ELEMENT-OR-REFERENCE-IDENTITY','ISOTOPE/CHARGE/QUANTUM/MOLECULE/PHASE/MATERIAL-STATE','REFERENCE/ENVIRONMENT/TIME/SCALE/GEOMETRY','PROCESS/INTERVENTION/HISTORY','OBSERVATION/CALCULATION/OUTCOME','SOURCE/UNCERTAINTY/EVIDENCE','RELATIONSHIPS/TABLES/GRAPHS/IMAGES'],
    child_identifiers_seen:[...childClasses].map(([child_class,ids])=>({child_class,count:ids.size,examples:[...ids].slice(0,8),status:'IDENTIFIERS-SEEN-NOT-EXISTENCE-VERIFIED'})),
    metrics,non_conventional_and_model_lanes:Object.fromEntries(Object.entries(mentions).map(([lane,locators])=>[lane,{status:locators.length?'CONTEXT-REVIEW-REQUIRED':'UNKNOWN',core_property:false,locators}])),
    foundation_scope:stem.startsWith('0000-')?{intrinsic_element_properties:'NOT-APPLICABLE',reason:'0000 is a reference framework, not an atom or material. Schema-item matches may describe comparison inputs, not intrinsic properties.'}:null,
    completion:'PARTIAL-REVIEW-REQUIRED',parse_errors:parseErrors,input_files:inputFiles};
  const path=`${out}/${stem}.json`;writeFileSync(join(root,path),JSON.stringify(report,null,2)+'\n');
  index.push({record_id:recordId,path,requirements:metrics.length,requirements_with_key_candidates:metrics.filter(m=>m.candidate_count).length,requirements_without_key_candidates:metrics.filter(m=>!m.candidate_count).length,parse_errors:parseErrors.length});
}
const catalog={schema_version:'1.0.0',schema_source:{path:schemaPath,sha256:hash(R(schemaPath))},templates:['records/0000-Origin-State/0000-Origin-State.md','records/0001-Hydrogen-H/0001-Hydrogen-H.md'],
  method:'Exact normalised YAML-key candidate mapping to existing universal-schema list items. Narrative text, synonyms and alternate ownership may require manual reconciliation. Presence is not acceptance; UNKNOWN means no exact-key candidate, not proven scientific absence.',
  non_conventional_rule:'Preserve source-attributed historical/proposed metrics separately. Record hypotheses, model assumptions, tests and counterevidence; never fabricate element-specific values or universal frequencies.',
  extension_rule:'Enumerate every existing four-digit record directory, including future records above 0118. No unobserved element or placeholder record is created.',
  requirements:items,records:index};
writeFileSync(join(root,out,'index.json'),JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({records:index.length,requirements_per_record:items.length,parse_errors:index.reduce((n,r)=>n+r.parse_errors,0),existing_records_above_0118:index.filter(r=>Number(r.record_id.slice(4))>118).length}));

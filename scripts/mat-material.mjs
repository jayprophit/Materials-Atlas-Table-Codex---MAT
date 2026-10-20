// Reviewed source adapter. Arithmetic components and source metrology stay separate.
import {readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {root} from './lib.mjs';
import {projectObject,validateObject,loadOwner,canonicalIdentity,hash} from './mat-universal-object.mjs';
import {validateComposition} from './mat-composition.mjs';

export const materialOwnerPath='records/0026-Iron-Fe/data/properties/0026-Iron-Fe-SRM-126c.yaml';
const inside=p=>{
  const full=resolve(root,p),rel=relative(root,full);
  if(isAbsolute(rel)||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\'))throw Error('Source snapshot must remain inside repository');
  return full;
};

export function projectMaterial(document,owner,source,catalogue) {
  const d=document;
  if(d.object_class!=='ALLOY'||d.evidence_type!=='EVALUATED'||d.source_id!==source.source_id||d.certificate_issue!==source.certificate_issue)throw Error('Material/source identity or version mismatch');
  const snapshot=readFileSync(inside(source.local_path));
  if(hash(snapshot)!==source.sha256)throw Error('Stale scientific source snapshot');
  if(source.source_type!=='CERTIFICATE-OF-ANALYSIS')throw Error('Reviewed certificate source required');
  const current=loadOwner(owner.path,owner.pointer);
  if(current.owner.sha256!==owner.sha256)throw Error('Stale material owner hash');
  if(!isDeepStrictEqual(current.document,d))throw Error('Material document does not match its owner');
  if(['properties','readings'].some(key=>Object.hasOwn(d,key)))throw Error('Material property readings require a reviewed property adapter');
  const provenance=pointer=>[{...owner,pointer:owner.pointer+pointer},{path:source.local_path,pointer:'',sha256:source.sha256}];
  const object=projectObject({object_ref:canonicalIdentity(d),object_class:d.object_class,recognition:'NOT-AN-ELEMENT',owner});
  const states=new Map(d.states.map((s,i)=>[s.id,i]));
  if(states.size!==d.states.length||!states.has(d.state.state_ref)||!d.state.validity)throw Error('Unique source states and validity required');
  for(const id of states.keys())if(!id.startsWith(object.object_ref+':STATE:'))throw Error('State ownership mismatch');
  object.state={state_ref:d.state.state_ref,conditions:[],reference_frame_ref:null,time_ref:null,scale:d.state.scale,validity:d.state.validity,status:'EXPLICIT-CANDIDATE'};
  const c=d.composition;
  if(c.unit!=='wt%'||c.basis!=='MASS'||c.coverage!=='PARTIAL'||c.uncertainty_kind!=='EXPANDED'||c.confidence_level!==0.95||c.covariance!==null||c.unreported_constituents!=='UNKNOWN')throw Error('Reviewed partial mass-fraction metrology required');
  object.composition={unit:c.unit,basis:c.basis,constraint:c.constraint,coverage:c.coverage,components:c.components.map(r=>({object_ref:r.object_ref,value:r.value}))};
  const summary=validateComposition(object.composition);
  const allowed=['object_ref','value','uncertainty','coverage_factor','source_value_status','source_locator','analytical_method_codes'];
  object.readings=c.components.map((r,i)=>{
    if(Object.keys(r).some(k=>!allowed.includes(k)))throw Error('Unmodelled component metadata');
    if(!catalogue.some(e=>e.matId===r.object_ref)||!r.source_locator)throw Error('Unresolved constituent or source locator');
    if(!r.analytical_method_codes?.length||r.analytical_method_codes.some(k=>!d.analytical_methods[k]))throw Error('Unresolved analytical method');
    if(r.source_value_status==='INFORMATION'?(r.uncertainty!==null||r.coverage_factor!==null):(r.uncertainty===null||r.coverage_factor===null))throw Error('Source uncertainty classification mismatch');
    return {metric:'composition.mass_fraction',component_ref:r.object_ref,value:r.value,null_state:null,unit:c.unit,uncertainty:r.uncertainty,
      ...(r.uncertainty===null?{}:{uncertainty_context:{kind:c.uncertainty_kind,confidence_level:c.confidence_level,coverage_factor:r.coverage_factor}}),
      source_value_status:r.source_value_status,evidence_type:'EVALUATED',provenance:provenance('/composition/components/'+i),state_ref:d.state.state_ref,reference_frame_ref:null,validity:d.state.validity};
  });
  const processes=new Set();let preceding=[];
  object.process_genome=d.process_history.map((s,i)=>{
    if(processes.has(s.process_id)||!s.process_id.startsWith(object.object_ref+':PROC:')||!s.source_locator)throw Error('Unique owned process and locator required');
    processes.add(s.process_id);
    if([...s.input_state_refs,...s.output_state_refs].some(id=>!states.has(id)))throw Error('Unresolved process state');
    if(i&& !s.input_state_refs.some(id=>preceding.includes(id)))throw Error('Disconnected process history');
    preceding=s.output_state_refs;
    return {process_ref:s.process_id,input_state_refs:s.input_state_refs,output_state_refs:s.output_state_refs,
      parameters:s.parameters.map((p,j)=>{
        if(!s.output_state_refs.includes(p.state_ref)||p.qualifier!=='APPROXIMATE')throw Error('Process parameter state or qualifier mismatch');
        return {...p,null_state:null,uncertainty:null,evidence_type:'EVALUATED',provenance:provenance(`/process_history/${i}/parameters/${j}`),reference_frame_ref:null,validity:'Approximate geometry reported in the dated certificate; measurement uncertainty and machining conditions are unavailable.'};
      }),provenance:provenance('/process_history/'+i)};
  });
  if(!preceding.includes(d.state.state_ref))throw Error('Process history does not reach source material state');
  object.links=[...c.components.map(r=>({relation:'COMPOSITION',target_ref:r.object_ref,evidence_refs:[source.source_id]})),...d.process_history.map(s=>({relation:'PROCESS',target_ref:s.process_id,evidence_refs:[source.source_id]})),{relation:'SOURCE',target_ref:source.source_id,evidence_refs:[source.source_id]}];
  validateObject(object);
  return {schema_version:'1.0.0',object,source:{source_id:source.source_id,title:source.title,url:source.url,local_path:source.local_path,sha256:source.sha256,certificate_issue:source.certificate_issue,retrieved:source.retrieved,verification_status:source.verification_status},
    composition_summary:{...summary,unassigned_identity:'UNKNOWN',combined_uncertainty:null,covariance_status:'NOT-REPORTED'},
    observation_context:c.components.map(r=>({component_ref:r.object_ref,source_locator:r.source_locator,analytical_methods:r.analytical_method_codes.map(k=>({code:k,description:d.analytical_methods[k]}))})),
    preparation_history:d.process_history.map(s=>({process_ref:s.process_id,description:s.description,source_locator:s.source_locator})),
    applicability:d.applicability,limitations:[c.note,d.scope,'REFERENCE assignments are noncertified and their uncertainties may omit contributions. INFORMATION values have no established uncertainty or metrological traceability.','Certificate transcription and software validation are not independent laboratory replication. No property prediction, complete alloy recipe or uncertainty aggregation is made.']};
}

export function loadMaterialExample() {
  const {document,owner}=loadOwner(materialOwnerPath);
  const registry=loadOwner('data/registries/sources.yaml').document;
  const source=registry.sources.find(s=>s.source_id===document.source_id);
  if(!source)throw Error('Unregistered material source');
  return projectMaterial(document,owner,source,loadOwner('data/catalog/elements-baseline.json').document.elements);
}

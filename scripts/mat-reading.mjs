// Read-only projection of explicitly reviewed bindings to existing MAT values.
// This is not a universal prediction engine or an alternate scientific owner.
import {readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import YAML from 'yaml';
import {root} from './lib.mjs';

export function resolvePointer(object,pointer){
  if(!pointer.startsWith('/'))throw new Error('A non-empty JSON pointer is required');
  return pointer.slice(1).split('/').reduce((value,token)=>{
    const key=token.replace(/~1/g,'/').replace(/~0/g,'~');
    if(value===null||typeof value!=='object'||!Object.hasOwn(value,key))throw new Error('Missing metric pointer '+pointer);
    return value[key];
  },object);
}

export function projectReading(binding,document,registry,identityDocument=document){
  if((document.mat_id??document.record_id)!==binding.owner||identityDocument.mat_id!==binding.owner)throw new Error('Metric owner mismatch');
  const atomic=binding.object_ref===identityDocument.charge_states?.find(s=>s.charge===0)?.id;
  const molecular=binding.object_ref===identityDocument.molecular_states?.H2?.id;
  if(!atomic&&!molecular)throw new Error('Object is not defined by its canonical owner');
  if(binding.state.species!==(atomic?'H':'H2'))throw new Error('Species and canonical object disagree');
  if(molecular!==binding.pointer.startsWith('/phase_reference/equilibrium_H2_'))throw new Error('Atomic and molecular metric contexts must remain separate');
  let experiment=null;
  if(binding.experiment_pointer){
    experiment=resolvePointer(document,binding.experiment_pointer);
    if(experiment.experiment_id!==binding.experiment_id||!binding.pointer.startsWith(binding.experiment_pointer+'/measured/')||molecular||experiment.system?.isotope!==binding.state.isotope||experiment.system?.state!==binding.state.electronic_state)throw new Error('Experiment identity, state or metric context mismatch');
  }
  const metric=resolvePointer(document,binding.pointer);
  if(!metric||typeof metric!=='object')throw new Error('Metric must be a structured object');
  const sourceId=metric.source_id??experiment?.source_id;
  const source=registry.sources.find(s=>s.source_id===sourceId);
  if(!source||sourceId!==binding.source_id)throw new Error('Unresolved or changed metric source');
  if(/USER-SUPPLIED|IMAGE|PROJECT-HISTORICAL|AUTHOR-FRAMEWORK/.test(source.source_type??''))throw new Error('Design or author reference is not a scientific value source');
  if(metric.unit!==binding.unit)throw new Error('Metric unit mismatch');
  const value=metric[binding.value_key];
  if(typeof value!=='number'||!Number.isFinite(value))throw new Error('A finite numeric value is required; missing values must not become zero');
  const uncertainty=metric.uncertainty??null;
  if(uncertainty!==null&&(typeof uncertainty!=='number'||!Number.isFinite(uncertainty)||uncertainty<0))throw new Error('Unsupported uncertainty representation');
  const reading={binding_id:binding.binding_id,owner:binding.owner,object_ref:binding.object_ref,state:binding.state,
    metric:binding.metric,value,unit:metric.unit,uncertainty,uncertainty_status:uncertainty===null?'UNKNOWN':'REPORTED-IN-OWNER',
    evidence_type:metric.evidence_type??experiment?.evidence_type??'UNVERIFIED',conditions:binding.conditions,
    provenance:{path:binding.path,pointer:binding.pointer+'/'+binding.value_key,source_id:sourceId,source_locator:metric.source_locator??binding.source_locator??null,source_url:source.url??null},
    acceptance:'SOURCE-BOUND-CANDIDATE; INDEPENDENT-REVIEW-PENDING',limitations:binding.limitations};
  if(binding.derive_period){
    if(metric.unit!=='Hz'||value<=0)throw new Error('A positive frequency in Hz is required for a period');
    reading.derived_period={value:1/value,unit:'s',equation:'T = 1 / frequency',evidence_type:'DERIVED',
      uncertainty:uncertainty===null?null:uncertainty/value**2,uncertainty_status:uncertainty===null?'UNKNOWN':'FIRST-ORDER-PROPAGATED',
      assumption:'Same defined transition; no universal frequency or period is assigned to the element.'};
  }
  return reading;
}

export function loadReading(binding,repoRoot=root){
  const absolute=resolve(repoRoot,binding.path),rel=relative(repoRoot,absolute);
  if(isAbsolute(rel)||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\')||!/^records[\\/]/.test(rel))throw new Error('Binding must resolve inside canonical records');
  if(!/\.yaml$/.test(absolute))throw new Error('Only canonical YAML metric owners are supported in this adapter');
  const document=YAML.parse(readFileSync(absolute,'utf8'));
  const identity=binding.experiment_pointer?YAML.parse(readFileSync(resolve(repoRoot,'records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml'),'utf8')):document;
  return projectReading(binding,document,YAML.parse(readFileSync(resolve(repoRoot,'data/registries/sources.yaml'),'utf8')),identity);
}

export function loadReadingComparison(repoRoot=root){
  const bindings=JSON.parse(readFileSync(resolve(repoRoot,'data/research/mat-dashboard-bindings.json'),'utf8')).bindings;
  const readings=bindings.map(b=>loadReading(b,repoRoot));
  const subjects=new Set(readings.flatMap(r=>[r.owner,r.object_ref]));
  const path='records/0001-Hydrogen-H/relationships/0001-Hydrogen-H-Relationships.yaml';
  const registry=YAML.parse(readFileSync(resolve(repoRoot,path),'utf8'));
  if(registry.record_id!=='MAT:0001')throw Error('Relationship owner mismatch');
  const relationships=registry.relationships.flatMap((r,i)=>subjects.has(r.source)&&subjects.has(r.target)?[{
    relationship_id:r.relationship_id,source:r.source,type:r.type,target:r.target,evidence:r.evidence??null,
    provenance:{path,pointer:'/relationships/'+i},acceptance:'CANONICAL-RELATIONSHIP-REFERENCE; NO-AUTOMATIC-TRUTH-PROMOTION'
  }]:[]);
  return {readings,relationships,comparison_policy:'CONTEXTUAL-COMPARISON-ONLY; NO-AVERAGING-OR-FREQUENCY-SIMILARITY-INFERENCE',historical_overlay_status:'NO-ACCEPTED-HYDROGEN-MAPPING-IN-EXISTING-RUSSELL-EXTRACTION'};
}

export function checkFrequencyPeriod(frequencyHz,periodSeconds,relativeTolerance=0.001){
  if(![frequencyHz,periodSeconds].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0))throw new Error('Positive finite frequency and period required');
  if(!Number.isFinite(relativeTolerance)||relativeTolerance<0)throw new Error('Non-negative tolerance required');
  const product=frequencyHz*periodSeconds;
  return {consistent:Math.abs(product-1)<=relativeTolerance,product,expected_period_s:1/frequencyHz,relative_tolerance:relativeTolerance,
    interpretation:'Arithmetic consistency only; does not validate the physical interpretation of either input.'};
}

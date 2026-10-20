// Tasks 011/063/136: admission for explicitly contextualised temporal frequencies.
// Source lists remain textual references. Admission permits conditional arithmetic,
// never verification, a common-mechanism inference, or therapeutic efficacy.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {root} from './lib.mjs';

const FREQUENCY_UNITS = Object.freeze({Hz:1, kHz:1e3, MHz:1e6, GHz:1e9, THz:1e12});
const PHYSICAL_KINDS = new Set(['measured transition','measured oscillation','drive frequency',
  'modulation','pulse repetition','equipment limit','calculated']);
const UNKNOWN = /^(UNKNOWN|UNVERIFIED|UNRESOLVED|NOT-AVAILABLE|NOT-MEASURED|NOT-ESTABLISHED|PENDING)$/i;
const TEXTUAL_FIELDS = new Set(['older_entry_id','newer_entry_id','match_basis',
  'exact_token_sequence','shared_literal_tokens','comparison_status','boundary']);
// Reuse the canonical measurement vocabularies; never invent a claim status.
const measurementSchema=JSON.parse(readFileSync(resolve(root,'data/schema/1.0.0/mat-measurement.schema.json'),'utf8'));
const universalSchema=JSON.parse(readFileSync(resolve(root,'data/schema/1.0.0/mat-universal-object.schema.json'),'utf8'));
const EVIDENCE_TYPES=new Set([...measurementSchema.properties.evidence_type.enum,
  ...universalSchema.$defs.reading.properties.evidence_type.enum]);
const nonEmpty = value => typeof value==='string' && value.trim().length>0;
const finite = value => typeof value==='number' && Number.isFinite(value);
const knownText = value => nonEmpty(value)&&!UNKNOWN.test(value.trim());
function known(value) {
  if(typeof value==='string')return nonEmpty(value)&&!UNKNOWN.test(value.trim());
  if(typeof value==='number')return finite(value);
  if(typeof value==='boolean')return true;
  if(!value||typeof value!=='object')return false;
  const values=Object.values(value);
  return values.length>0&&values.every(known);
}
const context = value => knownText(value)||(value&&typeof value==='object'&&!Array.isArray(value)&&known(value));
function canonical(value) {
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  return value;
}
const same = (a,b) => JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
function rejected(operation,reasons) {
  return {operation,status:'NOT-ADMITTED',reasons,result:null,scientific_status:'NOT-ASSESSED'};
}

/**
 * Narrow contract: inputs are positive scalar temporal frequencies, with exact
 * supported units, phenomenon/kind/mechanism, object_ref/state, reference_frame,
 * method/conditions, standard uncertainty, evidence_type, source_id/locator.
 * Explicit propagation_model declares no spatial conversion is required, or
 * documents a model already applied in the source. This module never applies a
 * wave speed, wavelength, Doppler, frame or medium transformation.
 * uncertainty_model declares first-order applicability; pair operations also
 * require a supplied covariance in Hz^2 and its basis (zero is never inferred).
 * Ratio/harmonic operations require matching physical contexts. harmonic_order
 * is supplied in advance; no match threshold, order search or significance test.
 */
export function assessFrequencyOperation(request={}) {
  const operation=request?.operation;
  if(operation==='textual') {
    const c=request.comparison,reasons=[];
    if(!c||typeof c!=='object'||Array.isArray(c))reasons.push('comparison: textual record required');
    else {
      if(c.comparison_status!=='TEXTUAL-REFERENCE-COMPARISON-ONLY')reasons.push('comparison_status: textual boundary required');
      for(const field of ['older_entry_id','newer_entry_id','match_basis','boundary'])
        if(!nonEmpty(c[field]))reasons.push(field+': explicit textual reference required');
      if(typeof c.exact_token_sequence!=='boolean'||!Array.isArray(c.shared_literal_tokens)||
        c.shared_literal_tokens.some(v=>!nonEmpty(v)))reasons.push('comparison: literal-token context required');
      for(const field of Object.keys(c))if(!TEXTUAL_FIELDS.has(field))reasons.push(field+': unsupported field in textual comparison');
    }
    return reasons.length?rejected(operation,reasons):{operation,status:'TEXTUAL-REFERENCE-COMPARISON-ONLY',
      comparison:structuredClone(c),result:null,scientific_status:'NOT-ASSESSED'};
  }
  if(!['period','ratio','harmonic'].includes(operation))return rejected(operation??null,['operation: unsupported operation']);
  const count=operation==='period'?1:2;
  if(!Array.isArray(request.inputs)||request.inputs.length!==count)return rejected(operation,['inputs: expected '+count+' scalar frequency reading(s)']);
  const reasons=[],normalised=[];
  request.inputs.forEach((input,index)=>{
    const p='inputs['+index+'].',r=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
    for(const field of ['phenomenon','mechanism','object_ref','reference_frame','method'])
      if(!knownText(r[field]))reasons.push(p+field+': resolved textual context required');
    for(const field of ['state','conditions'])
      if(!context(r[field]))
        reasons.push(p+field+': resolved state/conditions context required');
    if(!PHYSICAL_KINDS.has(r.frequency_kind))reasons.push(p+'frequency_kind: explicit physical frequency kind required');
    if(!Object.hasOwn(FREQUENCY_UNITS,r.unit??''))reasons.push(p+'unit: explicit supported temporal frequency unit required');
    if(!finite(r.value)||r.value<=0)reasons.push(p+'value: positive finite frequency required');
    if(!finite(r.uncertainty)||r.uncertainty<0)reasons.push(p+'uncertainty: finite non-negative standard uncertainty required');
    if(r.uncertainty_context?.kind!=='STANDARD'||!knownText(r.uncertainty_context?.basis))
      reasons.push(p+'uncertainty_context: STANDARD kind and reported basis required');
    if(!EVIDENCE_TYPES.has(r.evidence_type))reasons.push(p+'evidence_type: explicit canonical measurement evidence status required');
    for(const field of ['source_id','source_locator'])
      if(!knownText(r.provenance?.[field]))reasons.push(p+'provenance.'+field+': source-owned reference required');
    const model=r.propagation_model;
    if(model?.status==='NOT-APPLICABLE') {
      if(!knownText(model.reason))reasons.push(p+'propagation_model.reason: explicit non-applicability required');
    } else if(model?.status==='ALREADY-APPLIED-IN-SOURCE') {
      for(const field of ['model_ref','source_id','source_locator','validity'])
        if(!knownText(model[field]))reasons.push(p+'propagation_model.'+field+': applicable source-model context required');
      if(!context(model.conditions))reasons.push(p+'propagation_model.conditions: applicable source-model context required');
    } else reasons.push(p+'propagation_model: explicit non-applicability or already-applied source model required');
    const scale=FREQUENCY_UNITS[r.unit],frequency=r.value*scale,uncertainty=r.uncertainty*scale;
    if(scale&&(!finite(frequency)||frequency<=0||!finite(uncertainty)))
      reasons.push(p+'unit: normalised frequency/uncertainty is not representable');
    normalised.push({frequency,uncertainty});
  });
  const model=request.uncertainty_model;
  if(model?.method!=='FIRST-ORDER'||!knownText(model?.applicability))
    reasons.push('uncertainty_model: explicit FIRST-ORDER applicability required');
  let covariance=0;
  if(count===2) {
    for(const field of ['phenomenon','frequency_kind','mechanism','object_ref','state','reference_frame','conditions'])
      if(!same(request.inputs[0]?.[field],request.inputs[1]?.[field]))
        reasons.push(field+': incompatible contexts; no transformation or equivalence is inferred');
    const c=model?.covariance;
    if(!finite(c?.value)||c?.unit!=='Hz^2'||!knownText(c?.basis))
      reasons.push('uncertainty_model.covariance: explicit Hz^2 value and dependence basis required');
    else {
      covariance=c.value;
      if(Math.abs(covariance)>normalised[0].uncertainty*normalised[1].uncertainty)
        reasons.push('uncertainty_model.covariance: incompatible with supplied standard uncertainties');
    }
  }
  if(operation==='harmonic'&&(!Number.isSafeInteger(request.harmonic_order)||request.harmonic_order<1))
    reasons.push('harmonic_order: positive safe integer supplied before comparison required');
  if(reasons.length)return rejected(operation,reasons);
  const [a,b]=normalised;
  let result;
  if(operation==='period') {
    result={value:1/a.frequency,unit:'s',uncertainty:(a.uncertainty/a.frequency)/a.frequency,equation:'T = 1 / f'};
    if(a.uncertainty>0&&result.uncertainty===0)
      return rejected(operation,['result: positive propagated uncertainty underflowed; no zero placeholder is emitted']);
  }
  else {
    const ratio=a.frequency/b.frequency;
    const left=a.uncertainty/b.frequency,right=ratio*(b.uncertainty/b.frequency);
    if(!finite(left)||!finite(right)||(a.uncertainty>0&&left===0)||(b.uncertainty>0&&right===0))
      return rejected(operation,['uncertainty_model: positive uncertainty contribution is not representable']);
    // Correlation form plus hypot avoids overflow/underflow from squared values.
    // The original covariance bound was already checked; clamp division rounding.
    const rho=a.uncertainty&&b.uncertainty?
      Math.max(-1,Math.min(1,(covariance/a.uncertainty)/b.uncertainty)):0;
    const uncertainty=Math.hypot(left-rho*right,right*Math.sqrt(Math.max(0,1-rho*rho)));
    result={value:ratio,unit:'1',uncertainty,equation:'r = f_left / f_right'};
    if(operation==='harmonic')result={...result,harmonic_order:request.harmonic_order,
      relative_residual:(ratio-request.harmonic_order)/request.harmonic_order,
      relative_residual_uncertainty:result.uncertainty/request.harmonic_order,
      interpretation:'Numerical residual from the supplied order; no physical harmonic identification or significance is inferred.'};
    if(operation==='harmonic'&&result.uncertainty>0&&result.relative_residual_uncertainty===0)
      return rejected(operation,['result: harmonic residual uncertainty underflowed; no zero placeholder is emitted']);
  }
  if(!finite(result.value)||result.value<=0||!finite(result.uncertainty)||
    (operation==='harmonic'&&(!finite(result.relative_residual)||!finite(result.relative_residual_uncertainty))))
    return rejected(operation,['result: arithmetic is not representable; no zero or infinite placeholder is emitted']);
  return {operation,status:'ADMITTED-FOR-CALCULATION',reasons:[],result,
    inputs:structuredClone(request.inputs),uncertainty_model:structuredClone(model),
    evidence_type:'DERIVED',scientific_status:'NOT-ASSESSED',
    interpretation:'Conditional arithmetic from supplied context; does not verify sources, infer a common mechanism or establish therapeutic efficacy.'};
}

// Read-only integration with the existing source/index/comparison owners.
// Overview bands and publisher tokens are not re-labelled as observations.
export function auditFrequencyReferences(repoRoot=root) {
  const read=name=>JSON.parse(readFileSync(resolve(repoRoot,'data/research',name),'utf8'));
  const index=read('frequency-reference-index.json');
  const datasets=new Map(['spooky2-frequency-list-2015.json','spooky2-frequency-list-2021.json'].map(name=>[name,read(name)]));
  const entries=new Map();
  const errors=[];
  for(const [name,dataset] of datasets)for(const entry of dataset.entries) {
    if(entries.has(entry.id))errors.push(entry.id+': duplicate source-occurrence identity');
    entries.set(entry.id,{entry,dataset:name});
  }
  let notAdmitted=0;
  for(const reference of index.entries) {
    const source=entries.get(reference.entry_id);
    if(!source||source.dataset!==reference.dataset||source.entry.source_id!==reference.source_id) {
      errors.push(reference.entry_id+': unresolved or mismatched canonical source occurrence');continue;
    }
    if(reference.classification_status!=='LEXICAL-CANDIDATE-REVIEW-REQUIRED')
      errors.push(reference.entry_id+': lexical classification boundary changed');
    const raw=source.entry;
    const admission=assessFrequencyOperation({operation:'period',inputs:[{
      value:(raw.tokens??raw.values)?.find(t=>typeof t.value==='number')?.value,
      unit:raw.unit,frequency_kind:'publisher association',evidence_type:'UNVERIFIED',
      provenance:{source_id:raw.source_id,source_locator:source.dataset+'#'+raw.id}
    }]});
    if(admission.status==='NOT-ADMITTED')notAdmitted++;
    else errors.push(reference.entry_id+': publisher association admitted as physical frequency');
  }
  let textual=0;
  for(const comparison of read('frequency-source-comparisons.json').comparisons) {
    const result=assessFrequencyOperation({operation:'textual',comparison});
    if(result.status==='TEXTUAL-REFERENCE-COMPARISON-ONLY')textual++;
    else errors.push('textual comparison: '+result.reasons.join('; '));
    for(const id of [comparison.older_entry_id,comparison.newer_entry_id])
      if(!entries.has(id))errors.push(String(id)+': unresolved comparison source occurrence');
  }
  const discipline=read('frequency-cross-discipline.json');
  const required=['explicit unit','frequency kind','subject/state','coupling mechanism','waveform',
    'power or amplitude','exposure','outcome evidence'];
  for(const context of required)if(!discipline.comparison_gate?.includes(context))errors.push('cross-discipline: missing comparison boundary '+context);
  for(const overview of discipline.entries) {
    if(assessFrequencyOperation({operation:'period',inputs:[overview]}).status!=='NOT-ADMITTED')
      errors.push(overview.id+': overview admitted as a contextual scalar observation');
  }
  return {status:errors.length?'FAIL':'PASS',source_occurrences:index.entries.length,
    textual_comparisons_preserved:textual,not_admitted_source_occurrences:notAdmitted,
    cross_discipline_overviews:discipline.entries.length,errors,
    scientific_status:'NOT-ASSESSED',writes_performed:false};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  if(process.argv.length!==3||process.argv[2]!=='--check') {
    console.error('Usage: node scripts/frequency-comparison.mjs --check');
    process.exitCode=1;
  } else {
    const report=auditFrequencyReferences();
    console.log(JSON.stringify(report,null,2));
    process.exitCode=report.errors.length?1:0;
  }
}

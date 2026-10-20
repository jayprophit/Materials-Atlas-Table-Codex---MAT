import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessFrequencyOperation,auditFrequencyReferences} from '../frequency-comparison.mjs';

// Constructed oscillator arithmetic fixtures. These are not MAT measurements.
function reading(overrides={}) {
  return {value:1000,unit:'Hz',uncertainty:1,frequency_kind:'measured oscillation',
    phenomenon:'CONSTRUCTED oscillation',mechanism:'CONSTRUCTED periodic oscillator',
    object_ref:'FIXTURE:oscillator',state:{configuration:'CONSTRUCTED test state'},
    reference_frame:'FIXTURE:stationary laboratory',
    method:'CONSTRUCTED fixture; no measurement was performed',
    conditions:{environment:'CONSTRUCTED identical conditions'},
    uncertainty_context:{kind:'STANDARD',basis:'CONSTRUCTED standard uncertainty'},
    evidence_type:'THEORETICAL',
    provenance:{source_id:'FIXTURE:source',source_locator:'constructed fixture only'},
    propagation_model:{status:'NOT-APPLICABLE',reason:'Temporal frequency supplied directly; no wavelength, medium or frame conversion.'},
    ...overrides};
}
function request(operation='period',inputs=[reading()],overrides={}) {
  return {operation,inputs,uncertainty_model:{method:'FIRST-ORDER',
    applicability:'CONSTRUCTED small-uncertainty local linear approximation',
    covariance:{value:0,unit:'Hz^2',basis:'CONSTRUCTED independent fixtures'}},...overrides};
}
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=Math.max(1e-15,Math.abs(expected)*1e-12),actual+' != '+expected);

test('temporal units normalise dimensionally and preserve provenance/evidence without verification',()=>{
  const a=assessFrequencyOperation(request('period',[reading({value:2,unit:'kHz',uncertainty:0.002})]));
  const b=assessFrequencyOperation(request('period',[reading({value:2000,unit:'Hz',uncertainty:2})]));
  assert.deepEqual(a.result,b.result);close(a.result.value,0.0005);close(a.result.uncertainty,0.0000005);
  assert.equal(a.status,'ADMITTED-FOR-CALCULATION');assert.equal(a.result.unit,'s');
  assert.equal(a.scientific_status,'NOT-ASSESSED');assert.equal(a.inputs[0].evidence_type,'THEORETICAL');
  assert.equal(a.inputs[0].provenance.source_id,'FIXTURE:source');assert.equal(a.evidence_type,'DERIVED');
  assert.equal(auditFrequencyReferences().writes_performed,false);
});

test('missing and explicitly unknown physical context never supplies a number or a zero',()=>{
  const required=['phenomenon','mechanism','object_ref','state','reference_frame','method','conditions',
    'uncertainty','uncertainty_context','propagation_model','provenance','frequency_kind','unit','evidence_type'];
  for(const field of required) {
    const r=reading();delete r[field];
    const result=assessFrequencyOperation(request('period',[r]));
    assert.equal(result.status,'NOT-ADMITTED',field);assert.equal(result.result,null,field);
    assert.ok(result.reasons.some(reason=>reason.includes(field)),field);
  }
  for(const field of ['phenomenon','mechanism','object_ref','state','reference_frame','method','conditions'])
    assert.equal(assessFrequencyOperation(request('period',[reading({[field]:'UNKNOWN'})])).status,'NOT-ADMITTED',field);
  for(const uncertainty of [null,'UNKNOWN',-1,NaN,Infinity])
    assert.equal(assessFrequencyOperation(request('period',[reading({uncertainty})])).status,'NOT-ADMITTED');
  const nested=reading({conditions:{temperature:null}});
  assert.equal(assessFrequencyOperation(request('period',[nested])).status,'NOT-ADMITTED');
  const missingLocator=reading({provenance:{source_id:'FIXTURE:source',source_locator:'UNRESOLVED'}});
  assert.equal(assessFrequencyOperation(request('period',[missingLocator])).status,'NOT-ADMITTED');
  for(const change of [{method:true},{phenomenon:42},{state:true},{conditions:[]},
    {provenance:{source_id:42,source_locator:true}},{evidence_type:'VERIFIED'}])
    assert.equal(assessFrequencyOperation(request('period',[reading(change)])).status,'NOT-ADMITTED');
});

test('unit codes, spatial quantities and publisher associations do not become temporal frequencies',()=>{
  for(const unit of ['KHZ','UNKNOWN','nm','m/s','s','MHz acoustic?','']) {
    const result=assessFrequencyOperation(request('period',[reading({unit})]));
    assert.equal(result.status,'NOT-ADMITTED',unit);assert.equal(result.result,null);
  }
  for(const frequency_kind of ['publisher association','symbolic','unknown'])
    assert.equal(assessFrequencyOperation(request('period',[reading({frequency_kind})])).status,'NOT-ADMITTED');
  for(const value of [null,0,-1,'1000',NaN,Infinity])
    assert.equal(assessFrequencyOperation(request('period',[reading({value})])).status,'NOT-ADMITTED');
});

test('ratio is dimensionless after conversion and dependence is explicit rather than assumed',()=>{
  const inputs=[reading({value:2,unit:'kHz',uncertainty:0.002}),reading({value:1000,uncertainty:1})];
  const result=assessFrequencyOperation(request('ratio',inputs));
  assert.equal(result.result.unit,'1');close(result.result.value,2);
  close(result.result.uncertainty,2*Math.sqrt(2)*0.001);
  const noCovariance=request('ratio',inputs);delete noCovariance.uncertainty_model.covariance;
  assert.equal(assessFrequencyOperation(noCovariance).status,'NOT-ADMITTED');
  const positive=request('ratio',inputs);positive.uncertainty_model.covariance.value=2;
  close(assessFrequencyOperation(positive).result.uncertainty,0);
  const negative=request('ratio',inputs);negative.uncertainty_model.covariance.value=-2;
  close(assessFrequencyOperation(negative).result.uncertainty,0.004);
  const invalid=request('ratio',inputs);invalid.uncertainty_model.covariance.value=3;
  assert.equal(assessFrequencyOperation(invalid).status,'NOT-ADMITTED');
  invalid.uncertainty_model.covariance={value:0,unit:'kHz^2',basis:'fixture'};
  assert.equal(assessFrequencyOperation(invalid).status,'NOT-ADMITTED');
});

test('equal numbers with incompatible physical contexts cannot manufacture a match',()=>{
  for(const change of [
    {mechanism:'CONSTRUCTED electromagnetic excitation'}, {phenomenon:'CONSTRUCTED different mode'},
    {object_ref:'FIXTURE:other-subject'}, {state:{configuration:'different state'}},
    {reference_frame:'FIXTURE:moving frame'}, {conditions:{environment:'different conditions'}},
    {frequency_kind:'drive frequency'}
  ]) {
    const result=assessFrequencyOperation(request('ratio',[reading(),reading(change)]));
    assert.equal(result.status,'NOT-ADMITTED',JSON.stringify(change));assert.equal(result.result,null);
  }
  const a=reading({conditions:{temperature:10,pressure:20}}),b=reading({conditions:{pressure:20,temperature:10}});
  assert.equal(assessFrequencyOperation(request('ratio',[a,b])).status,'ADMITTED-FOR-CALCULATION');
});

test('harmonic comparison requires a supplied order and emits a residual without match or significance claims',()=>{
  const inputs=[reading({value:3000,uncertainty:3}),reading()];
  const result=assessFrequencyOperation(request('harmonic',inputs,{harmonic_order:3}));
  close(result.result.value,3);close(result.result.relative_residual,0);
  assert.equal(result.result.harmonic_order,3);
  assert.equal(Object.hasOwn(result.result,'matched'),false);
  assert.equal(Object.hasOwn(result.result,'significance'),false);
  assert.equal(result.scientific_status,'NOT-ASSESSED');
  for(const harmonic_order of [undefined,0,2.5,Infinity,Number.MAX_SAFE_INTEGER+1])
    assert.equal(assessFrequencyOperation(request('harmonic',inputs,{harmonic_order})).status,'NOT-ADMITTED');
});

test('uncertainty and propagation models are declared, and unusable arithmetic is refused',()=>{
  const noModel=request();delete noModel.uncertainty_model;
  assert.equal(assessFrequencyOperation(noModel).status,'NOT-ADMITTED');
  const propagated=reading({propagation_model:{status:'ALREADY-APPLIED-IN-SOURCE',model_ref:'FIXTURE:wave-model',
    source_id:'FIXTURE:source',source_locator:'constructed fixture model only',validity:'CONSTRUCTED same medium and frame',
    conditions:{medium:'CONSTRUCTED fixture medium'}}});
  assert.equal(assessFrequencyOperation(request('period',[propagated])).status,'ADMITTED-FOR-CALCULATION');
  delete propagated.propagation_model.validity;
  assert.equal(assessFrequencyOperation(request('period',[propagated])).status,'NOT-ADMITTED');
  assert.equal(assessFrequencyOperation(request('period',[reading({value:Number.MAX_VALUE,unit:'THz'})])).status,'NOT-ADMITTED');
  assert.equal(assessFrequencyOperation(request('period',[reading({value:Number.MIN_VALUE,uncertainty:0})])).status,'NOT-ADMITTED');
  const large=assessFrequencyOperation(request('period',[reading({value:1e200,uncertainty:1e197})]));
  assert.equal(large.status,'ADMITTED-FOR-CALCULATION');assert.ok(large.result.uncertainty>0);
  assert.equal(assessFrequencyOperation(request('period',[reading({value:1e200,uncertainty:1})])).status,'NOT-ADMITTED');
  const tiny=assessFrequencyOperation(request('ratio',[reading({uncertainty:1e-200}),reading({uncertainty:1e-200})]));
  assert.equal(tiny.status,'ADMITTED-FOR-CALCULATION');assert.ok(tiny.result.uncertainty>0);
  const zero=assessFrequencyOperation(request('period',[reading({uncertainty:0})]));
  assert.equal(zero.result.uncertainty,0);
});

test('textual history remains literal and rejects physical fields without promoting claim status',()=>{
  const comparison={older_entry_id:'FIXTURE:older',newer_entry_id:'FIXTURE:newer',
    match_basis:'normalised label and publisher database code',exact_token_sequence:true,
    shared_literal_tokens:['UNKNOWN units','1000'],comparison_status:'TEXTUAL-REFERENCE-COMPARISON-ONLY',
    boundary:'Constructed historical reference only; no physical or clinical inference.'};
  const before=structuredClone(comparison);
  const result=assessFrequencyOperation({operation:'textual',comparison});
  assert.equal(result.status,'TEXTUAL-REFERENCE-COMPARISON-ONLY');assert.deepEqual(result.comparison,before);
  assert.deepEqual(comparison,before);assert.equal(result.result,null);
  assert.equal(assessFrequencyOperation({operation:'textual',comparison:{...comparison,ratio:1}}).status,'NOT-ADMITTED');
  assert.equal(assessFrequencyOperation({operation:'textual',comparison:{...comparison,comparison_status:'VERIFIED'}}).status,'NOT-ADMITTED');
});

test('existing canonical source comparisons integrate without source edits or physical admission',()=>{
  const audit=auditFrequencyReferences();
  assert.equal(audit.status,'PASS');assert.deepEqual(audit.errors,[]);
  assert.equal(audit.source_occurrences,6548);assert.equal(audit.not_admitted_source_occurrences,6548);
  assert.ok(audit.textual_comparisons_preserved>0);assert.equal(audit.cross_discipline_overviews,4);
  assert.equal(audit.scientific_status,'NOT-ASSESSED');
});

test('unsupported operations and malformed input shapes fail closed',()=>{
  for(const input of [null,{}, {operation:'wavelength'}, {operation:'ratio',inputs:[reading()]},
    {operation:'period',inputs:[null]}, {operation:'textual',comparison:null}])
    assert.equal(assessFrequencyOperation(input).status,'NOT-ADMITTED');
});

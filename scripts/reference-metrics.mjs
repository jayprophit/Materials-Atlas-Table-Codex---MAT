// Implements the typed comparison defined by MAT:0000; no universal state distance.
export function compareQuantity({observation, reference, covariance, scale}) {
  for(const q of [observation,reference]){
    if(!q||typeof q.property!=='string'||!q.property||typeof q.unit!=='string'||!q.unit||typeof q.state_id!=='string'||!q.state_id)throw new Error('Property, canonical unit and state identity are required');
    if(typeof q.value!=='number'||!Number.isFinite(q.value))throw new Error('Missing values cannot be converted to zero');
    if(q.uncertainty!=null&&(typeof q.uncertainty!=='number'||!Number.isFinite(q.uncertainty)||q.uncertainty<0))throw new Error('Invalid uncertainty');
  }
  if(observation.property!==reference.property||observation.unit!==reference.unit)throw new Error('Compare only matching properties in matching canonical units');
  const difference=observation.value-reference.value;
  let uncertainty=null;
  if(covariance!=null){
    if(!Number.isFinite(covariance)||observation.uncertainty==null||reference.uncertainty==null)throw new Error('Covariance requires both input uncertainties');
    const a=observation.uncertainty,b=reference.uncertainty;
    if(Math.abs(covariance)>a*b+Number.EPSILON*Math.max(a*b,Number.MIN_VALUE)*8)throw new Error('Covariance violates Cauchy-Schwarz bound');
    uncertainty=Math.sqrt(Math.max(0,a*a+b*b-2*covariance));
  }
  let normalised=null;
  if(scale!==undefined){
    if(!scale||scale.unit!==observation.unit||!Number.isFinite(scale.value)||scale.value<=0||scale.exact_by_definition!==true)throw new Error('Normalisation requires a positive explicitly exact scale in the same unit; uncertain scales need a fuller covariance model');
    normalised={value:difference/scale.value,unit:'1',uncertainty:uncertainty===null?null:uncertainty/scale.value,equation:'z = (q - q_ref) / s'};
  }
  return {property:observation.property,source_state:reference.state_id,target_state:observation.state_id,value:difference,unit:observation.unit,uncertainty,
    uncertainty_status:uncertainty===null?'INSUFFICIENT DATA':'PROPAGATED',equation:'delta_q = q - q_ref',uncertainty_equation:'u(delta_q)^2 = u(q)^2 + u(q_ref)^2 - 2 cov(q,q_ref)',normalised,
    interpretation:'CALCULATED-COMPARISON; physical comparability and reference conditions require domain review; no universal material distance is implied'};
}

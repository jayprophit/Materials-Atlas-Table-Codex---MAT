// Arithmetic constraints only. No material properties or physical acceptance inferred.
const scales = {'wt%':100,'at%':100,'mol%':100,'vol%':100,ppm:1e6,ppb:1e9,phase_fraction:1,isotope_fraction:1};
const bases = {'wt%':'MASS','at%':'ATOM_COUNT','mol%':'AMOUNT','vol%':'VOLUME'};
const fractionBases = ['MASS','ATOM_COUNT','AMOUNT','VOLUME'];
export function validateComposition(input) {
  if (!input || !Object.hasOwn(scales,input.unit)) throw Error('Unsupported composition unit');
  if(Object.keys(input).some(k=>!['unit','basis','constraint','coverage','components'].includes(k)))throw Error('Unsupported composition metadata; source uncertainty requires a reviewed model');
  const expected=bases[input.unit];
  if (expected ? input.basis!==expected : !fractionBases.includes(input.basis)) throw Error('Explicit compatible composition basis required');
  if (!['VARIABLE','FIXED_STOICHIOMETRIC'].includes(input.constraint)) throw Error('Composition constraint required');
  if (!['COMPLETE','PARTIAL'].includes(input.coverage)) throw Error('Explicit coverage required');
  if (!Array.isArray(input.components)||!input.components.length) throw Error('Components required');
  const scale=scales[input.unit],ids=new Set();
  let sum=0;
  for (const c of input.components) {
    if(!c||Object.keys(c).some(k=>!['object_ref','value'].includes(k)))throw Error('Unsupported component metadata; cannot propagate unmodelled claims or uncertainty');
    if(typeof c.object_ref!=='string'||!c.object_ref.trim()||ids.has(c.object_ref)) throw Error('Unique component references required');
    ids.add(c.object_ref);
    if(typeof c.value!=='number'||!Number.isFinite(c.value)||c.value<0||c.value>scale) throw Error('Finite nonnegative in-range fractions required');
    sum+=c.value/scale;
  }
  // Fixed numerical roundoff allowance, not a scientific uncertainty allowance.
  if(sum>1+1e-12 || (input.coverage==='COMPLETE' && Math.abs(sum-1)>1e-12)) throw Error('Composition balance fails');
  return {sum_fraction:sum,unassigned_fraction:Math.max(0,1-sum),basis:input.basis,physical_validation:'NOT-PERFORMED'};
}

export function convertComposition(input,unit) {
  validateComposition(input);
  if(!Object.hasOwn(scales,unit)) throw Error('Unsupported composition unit');
  // Phase/isotope fractions describe different component populations: no implicit conversion.
  const special=u=>u==='phase_fraction'||u==='isotope_fraction';
  if((special(input.unit)||special(unit))&&input.unit!==unit) throw Error('Fraction population conversion needs an explicit model');
  if(bases[unit]&&bases[unit]!==input.basis) throw Error('Cross-basis conversion needs state-specific masses/densities/species');
  const result=structuredClone(input);
  result.components=result.components.map(c=>({...c,value:c.value/scales[input.unit]*scales[unit]}));
  result.unit=unit;
  validateComposition(result);
  return result;
}

export function adjustComposition(input,changes,{mode='LOCK_REMAINDER',remainder_ref}={}) {
  validateComposition(input);
  if(input.constraint!=='VARIABLE') throw Error('Fixed stoichiometry requires a different physical system');
  if(input.coverage!=='COMPLETE') throw Error('Adjustments require a complete composition');
  if(!['LOCK_REMAINDER','LOCK_RATIO','FREE_OPTIMISATION'].includes(mode)) throw Error('Unknown adjustment mode');
  if(!changes||typeof changes!=='object'||Array.isArray(changes)||!Object.keys(changes).length) throw Error('Explicit changes required');
  const result=structuredClone(input),ids=new Set(result.components.map(c=>c.object_ref));
  for(const id of Object.keys(changes))if(!ids.has(id))throw Error('Unknown component '+id);
  const changed=c=>Object.hasOwn(changes,c.object_ref);
  if(mode==='LOCK_REMAINDER'&&(!ids.has(remainder_ref)||Object.hasOwn(changes,remainder_ref)))throw Error('An unchanged remainder component is required');
  const scale=scales[input.unit];
  for(const c of result.components)if(changed(c)){
    const value=changes[c.object_ref];
    if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>scale)throw Error('Invalid component adjustment');
    c.value=value;
  }
  if(mode==='LOCK_REMAINDER') {
    const used=result.components.filter(c=>c.object_ref!==remainder_ref).reduce((n,c)=>n+c.value,0);
    result.components.find(c=>c.object_ref===remainder_ref).value=scale-used;
  } else if(mode==='LOCK_RATIO') {
    const rest=result.components.filter(c=>!changed(c)),total=rest.reduce((n,c)=>n+c.value,0);
    const available=scale-result.components.filter(changed).reduce((n,c)=>n+c.value,0);
    if(total<=0||available<0)throw Error('Cannot preserve remaining ratios');
    rest.forEach(c=>{c.value=c.value/total*available;});
  }
  // FREE_OPTIMISATION accepts a caller-supplied balanced candidate; it is not an optimiser.
  validateComposition(result);
  return {composition:result,evidence_type:'CALCULATED',mode,source_composition:structuredClone(input),changes:structuredClone(changes),
    uncertainty_status:'NOT-PROPAGATED',property_predictions:[],acceptance:'ARITHMETIC-ONLY; PHYSICAL-REVIEW-REQUIRED'};
}

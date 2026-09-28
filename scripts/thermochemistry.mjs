// NIST's Shomate convention: t = T/K / 1000. Coefficients are mixed-unit.
export function shomate(fit, temperatureK) {
  const r = fit.temperature_range;
  if (!Number.isFinite(temperatureK) || temperatureK <= 0 || temperatureK < r.min || temperatureK > r.max) {
    throw new RangeError('Temperature is outside this source fit; extrapolation is disabled');
  }
  const {A,B,C,D,E,F,G,H} = Object.fromEntries(Object.entries(fit.coefficients).map(([k,v])=>[k,v.value]));
  if (![A,B,C,D,E,F,G,H].every(Number.isFinite)) throw new TypeError('All eight source coefficients are required');
  const t = temperatureK/1000;
  return {heat_capacity_J_mol_K: A+B*t+C*t*t+D*t*t*t+E/(t*t),
    entropy_J_mol_K: A*Math.log(t)+B*t+C*t*t/2+D*t*t*t/3-E/(2*t*t)+G,
    enthalpy_increment_kJ_mol: A*t+B*t*t/2+C*t*t*t/3+D*t*t*t*t/4-E/t+F-H,
    uncertainty: 'UNKNOWN', evidence_status: 'CALCULATED-FROM-PUBLISHED-FIT'};
}

export function fitSamples(fit, intervals=100) {
  if (!Number.isInteger(intervals) || intervals<1) throw new RangeError('Positive interval count required');
  const {min,max} = fit.temperature_range;
  return Array.from({length:intervals+1},(_,i)=>{
    const temperature_K=i===intervals?max:min+(max-min)*i/intervals;
    return {temperature_K,...shomate(fit,temperature_K)};
  });
}

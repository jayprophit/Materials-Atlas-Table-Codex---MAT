// Energy equivalents only; these are not observed lines or recoil-corrected thresholds.
export function energyEquivalents(energy,constants){
 if(energy.value===null)return {status:'NOT-CALCULATED',reason:'UNKNOWN source energy',frequency:null,vacuum_wavelength:null};
 const {value:E,uncertainty:u}=energy,{speed_of_light:{value:c},Planck_constant:{value:h},elementary_charge:{value:e}}=constants;
 if(!(E>0)||![c,h,e].every(v=>v>0&&Number.isFinite(v)))throw new Error('Positive finite energy and constants required');
 if(u!==null&&(!(u>=0)||!Number.isFinite(u)))throw new Error('Invalid energy uncertainty');
 const frequency=E*e/h,wavelength=c/frequency;
 return {status:'DERIVED',input_value_status:energy.value_status,
  frequency:{value:frequency,unit:'Hz',uncertainty:u===null?null:u*e/h,evidence_type:'DERIVED'},
  vacuum_wavelength:{value:wavelength,unit:'m',medium:'VACUUM',uncertainty:u===null?null:wavelength*u/E,evidence_type:'DERIVED'},
  uncertainty_method:u===null?'UNKNOWN source uncertainty; not invented':'Frequency: exact linear propagation; wavelength: first-order propagation of source uncertainty. Constants exact by SI definition. No new confidence level assigned.'};
}

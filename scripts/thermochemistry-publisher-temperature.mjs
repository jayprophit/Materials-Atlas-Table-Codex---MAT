// Compare printed calculation rows without treating a fitted endpoint choice as a measurement.
import {isDeepStrictEqual} from 'node:util';
import {shomate} from './thermochemistry.mjs';

export const publisherTemperatureBasis='SOURCE-FIT-BOUNDARY-WITHIN-PRINTED-TEMPERATURE-ROUNDING-CELL';
const quantities=[['heat_capacity_J_mol_K',1],['entropy_J_mol_K',2],['enthalpy_increment_kJ_mol',4]];
function requireValue(condition,message){if(!condition)throw new Error('Thermochemistry publisher comparison: '+message);}
function printedNumber(raw){
 requireValue(typeof raw==='string','raw printed cells must be strings');
 const normalized=raw.replace('×10','e').replace('−','-');
 requireValue(/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/.test(normalized),'invalid printed numeric cell');
 const value=Number(normalized);requireValue(Number.isFinite(value),'non-finite printed number');
 const [mantissa,exponent]=normalized.split(/[eE]/),decimals=mantissa.split('.')[1]?.length??0;
 return {value,halfDigit:.5*10**(Number(exponent??0)-decimals)};
}

export function resolvePublisherCalculationTemperature(check,fit){
 requireValue(check&&typeof check==='object'&&!Array.isArray(check),'a comparison row is required');
 requireValue(fit&&typeof fit.fit_id==='string'&&Array.isArray(check.candidate_fit_ids)&&check.candidate_fit_ids.length===1&&check.candidate_fit_ids[0]===fit.fit_id,'exact source-fit binding is required');
 requireValue(Array.isArray(check.raw)&&check.raw.length===5,'five original printed cells are required');
 const printed=printedNumber(check.raw[0]);
 requireValue(typeof check.temperature_K==='number'&&check.temperature_K===printed.value,'nominal temperature must equal its original printed cell');
 for(const [field,index]of quantities){const cell=printedNumber(check.raw[index]);requireValue(typeof check[field]==='number'&&check[field]===cell.value,field+' must equal its original printed cell');}
 const range=fit.temperature_range;
 requireValue(range&&range.unit==='K'&&Number.isFinite(range.min)&&Number.isFinite(range.max)&&range.min<range.max,'finite source range in kelvin is required');
 const agrees=T=>{if(!Number.isFinite(T)||T<range.min||T>range.max)return false;const values=shomate(fit,T);return quantities.every(([field,index])=>Math.abs(values[field]-check[field])<=printedNumber(check.raw[index]).halfDigit+1e-7);};
 if(check.calculation_temperature_K===undefined){
  for(const field of ['calculation_temperature_basis','calculation_temperature_evidence','printed_temperature_rounding_interval_K'])requireValue(check[field]===undefined,'orphan '+field+' without an override');
  requireValue(agrees(check.temperature_K),'nominal temperature does not agree with the printed calculation');
  return {temperature_K:check.temperature_K,evidence:'PUBLISHER-PRINTED-CALCULATION-CHECK',legacy_untagged:false};
 }
 requireValue(check.calculation_temperature_basis===publisherTemperatureBasis,'unsupported comparison-temperature basis');
 requireValue(check.calculation_temperature_evidence===undefined||check.calculation_temperature_evidence==='INTERPRETATION','endpoint comparison evidence must be INTERPRETATION, never MEASURED or EXACT');
 requireValue(typeof check.calculation_temperature_K==='number'&&Number.isFinite(check.calculation_temperature_K),'finite chosen comparison temperature is required');
 requireValue(!agrees(check.temperature_K),'override must not replace an already agreeing nominal temperature');
 const interval={min:printed.value-printed.halfDigit,max:printed.value+printed.halfDigit};
 requireValue(isDeepStrictEqual(check.printed_temperature_rounding_interval_K,interval),'printed-temperature rounding cell mismatch');
 const candidates=[...new Set([range.min,range.max])].filter(T=>interval.min<=T&&T<=interval.max&&agrees(T));
 requireValue(isDeepStrictEqual(candidates,[check.calculation_temperature_K]),'only one agreeing source-fit endpoint may be chosen among the endpoints');
 return {temperature_K:check.calculation_temperature_K,evidence:'INTERPRETATION',legacy_untagged:check.calculation_temperature_evidence===undefined};
}

function comparisonRows(item){
 requireValue(Array.isArray(item.heat_capacity_fits),'source fits must be an array');
 // Per-element/legacy generation inputs may omit publisher checks. An omission
 // supplies no comparison evidence; it must not invent a row or interpretation.
 if(item.publisher_calculation_checks===undefined)return [];
 requireValue(Array.isArray(item.publisher_calculation_checks),'publisher comparison rows must be an array when supplied');
 const fits=new Map(item.heat_capacity_fits.map(f=>[f.fit_id,f]));requireValue(fits.size===item.heat_capacity_fits.length,'duplicate source-fit identity');
 return item.publisher_calculation_checks.map(check=>({check,resolution:resolvePublisherCalculationTemperature(check,fits.get(check.candidate_fit_ids?.[0]))}));
}

export function effectivePublisherTemperatureReviewNotes(item){
 const original=item.review_notes??[];requireValue(Array.isArray(original),'review notes must be an array');
 const projected=structuredClone(original);
 const overrides=comparisonRows(item).filter(r=>r.resolution.evidence==='INTERPRETATION');
 if(!overrides.length)return projected;
 const choices=overrides.map(({check,resolution})=>`printed ${check.raw[0]} K; chosen ${resolution.temperature_K} K for ${check.candidate_fit_ids[0]}`).join('; ');
 const note={note_id:item.record_id+':NOTE:NIST-PUBLISHER-TEMPERATURE-INTERPRETATION',status:'COMPARISON-CHOICE-NOT-EXACT-PUBLISHER-TEMPERATURE',evidence_status:'INTERPRETATION',text:`Publisher temperature comparison interpretation: ${choices}. The original printed labels are preserved. Each chosen point is the uniquely agreeing candidate among the source-fit endpoints within that label's rounding cell; this does not establish a unique temperature throughout the cell or the publisher's exact internal temperature. These are rounded calculation checks, not independent measurements or experimental replication.`};
 const collisions=original.filter(n=>n?.note_id===note.note_id);requireValue(collisions.length<=1,'duplicate interpretation-note identity');
 if(collisions.length){requireValue(isDeepStrictEqual(collisions[0],note),'conflicting authored interpretation note must not be replaced');return projected;}
 return [...projected,note];
}

export function validatePublisherTemperatureReviewNotes(item,storedNotes){
 const effective=effectivePublisherTemperatureReviewNotes(item),rows=comparisonRows(item),tagged=rows.some(r=>r.resolution.evidence==='INTERPRETATION'&&!r.resolution.legacy_untagged);
 const stored=storedNotes??[],original=item.review_notes??[];
 requireValue(isDeepStrictEqual(stored,effective)||!tagged&&isDeepStrictEqual(stored,original),'generated review notes must retain the comparison interpretation; legacy untagged notes remain compatible');
 return effective;
}

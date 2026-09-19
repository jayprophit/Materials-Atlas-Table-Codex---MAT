// Fixed-width AME2020 formats come from the retained files' own headers.
export const massSnapshot='data/catalog/sources/ame2020-mass_1.mas20.txt';
export const reactionSnapshot='data/catalog/sources/ame2020-rct1.mas20.txt';
export const metricKeys=['mass_excess','binding_energy_per_nucleon','q_beta_minus','separation_two_neutrons','separation_two_protons','q_alpha'];
export function ameNumber(raw,uncertaintyRaw,locator){
 const text=raw.trim(),u=uncertaintyRaw.trim();
 const parse=s=>{if(!s||s==='*')return null;const n=s.replace('#','.');if(!/^[+-]?\d+(?:\.\d*)?$/.test(n))throw new Error('Unexpected AME number '+s);return Number(n);};
 const value=parse(text),uncertainty=parse(u),estimated=text.includes('#')||u.includes('#');
 if(uncertainty!==null&&uncertainty<0)throw new Error('Negative AME uncertainty');
 return {value,unit:'keV',uncertainty,raw:text,uncertainty_raw:u,estimated,
  evidence_type:'EVALUATED',value_status:value===null?'INSUFFICIENT DATA':estimated?'ESTIMATED-FROM-SYSTEMATICS':'EVALUATED',
  ...(value===null?{null_state:'UNKNOWN',null_reason:text==='*'?'SOURCE-NOT-CALCULABLE':'SOURCE-BLANK'}:{}),
  uncertainty_status:uncertainty===null?'UNKNOWN':'SOURCE-REPORTED',source_id:'SRC-000304',source_locator:locator,
  reference_state:'AME2020 ground-state atomic-mass convention'};
}
function rowsAfter(text,header){const lines=text.replace(/\r\n/g,'\n').split('\n'),start=lines.findIndex(l=>l.startsWith(header));if(start<0)throw new Error('Missing AME table header');return lines.slice(start+1).map((line,i)=>({line,source_line:start+i+2})).filter(x=>x.line.trim());}
export function parseAmeMass(text){
 if(!text.includes('f14.6,f12.6,f13.5'))throw new Error('Unexpected AME mass format');
 const out=[],seen=new Set();
 for(const {line,source_line}of rowsAfter(text,'1N-Z')){
  if(line.includes('(keV)'))continue;
  const N=Number(line.slice(4,9)),Z=Number(line.slice(9,14)),A=Number(line.slice(14,19)),symbol=line.slice(20,23).trim(),key=`${Z}:${A}`;
  if(!Number.isInteger(A)||A<1||!Number.isInteger(Z)||Z<0||N+Z!==A||!/^[A-Za-z]{1,2}$/.test(symbol)||seen.has(key))throw new Error('Invalid/duplicate AME mass row '+source_line);
  if(line.slice(79,81)!=='B-')throw new Error('Unexpected beta convention '+source_line);
  seen.add(key);const at=massSnapshot+'#line='+source_line;
  out.push({A,Z,N,symbol,origin_raw:line.slice(23,27).trim(),mass_source_line:source_line,mass_raw_line:line,
   mass_excess:ameNumber(line.slice(28,42),line.slice(42,54),at),binding_energy_per_nucleon:ameNumber(line.slice(54,67),line.slice(68,78),at),q_beta_minus:ameNumber(line.slice(81,94),line.slice(94,105),at)});
 }
 return out;
}
export function parseAmeReactions(text){
 if(!text.includes('6(f12.4,f10.4)'))throw new Error('Unexpected AME reaction format');
 const out=[],seen=new Set();
 for(const {line,source_line}of rowsAfter(text,'1 A')){
  const A=Number(line.slice(1,4)),symbol=line.slice(5,8).trim(),Z=Number(line.slice(8,11)),key=`${Z}:${A}`;
  if(!Number.isInteger(A)||A<1||!Number.isInteger(Z)||Z<0||Z>A||!/^[A-Za-z]{1,2}$/.test(symbol)||seen.has(key))throw new Error('Invalid/duplicate AME reaction row '+source_line);
  seen.add(key);const at=reactionSnapshot+'#line='+source_line,metric=i=>ameNumber(line.slice(12+i*22,24+i*22),line.slice(24+i*22,34+i*22),at);
  out.push({A,Z,symbol,reaction_source_line:source_line,reaction_raw_line:line,separation_two_neutrons:metric(0),separation_two_protons:metric(1),q_alpha:metric(2)});
 }
 return out;
}
export function joinAmeTables(masses,reactions){
 const byId=new Map(reactions.map(r=>[`${r.Z}:${r.A}`,r]));
 if(masses.length!==reactions.length)throw new Error('AME table coverage mismatch');
 return masses.map(m=>{const r=byId.get(`${m.Z}:${m.A}`);if(!r||r.symbol!==m.symbol)throw new Error('AME identity mismatch');return {...m,...r};});
}

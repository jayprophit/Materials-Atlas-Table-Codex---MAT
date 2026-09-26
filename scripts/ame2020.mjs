// Fixed-width AME2020 formats come from the retained files' own headers.
export const massSnapshot='data/catalog/sources/ame2020-mass_1.mas20.txt';
export const reactionSnapshot='data/catalog/sources/ame2020-rct1.mas20.txt';
export const reaction2Snapshot='data/catalog/sources/ame2020-rct2.mas20.txt';
export const reaction1Keys=['separation_two_neutrons','separation_two_protons','q_alpha','q_double_beta_minus','q_electron_capture_proton','q_beta_minus_neutron'];
export const reaction2Keys=['separation_neutron','separation_proton','q_quadruple_beta_minus','q_deuteron_alpha','q_proton_alpha','q_neutron_alpha'];
export const metricKeys=['mass_excess','binding_energy_per_nucleon','q_beta_minus',...reaction1Keys,...reaction2Keys];
export function ameNumber(raw,uncertaintyRaw,locator){
 const text=raw.trim(),u=uncertaintyRaw.trim();
 const parse=s=>{if(!s||s==='*')return null;const n=s.replace('#','.');if(!/^[+-]?\d+(?:\.\d*)?$/.test(n))throw new Error('Unexpected AME number '+s);return Number(n)===0?0:Number(n);}; // Preserve signed-zero spelling in raw; JSON/YAML numeric zero is canonical.
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
export function parseAmeReactions(text,part=1){
 if(![1,2].includes(part)||!text.includes(`* file : rct${part}.mas20 *`))throw new Error('Wrong AME reaction table part');
 if(!text.includes('6(f12.4,f10.4)'))throw new Error('Unexpected AME reaction format');
 const header=text.split(/\r?\n/).find(l=>l.startsWith('1 A'));
 if(!header?.includes(part===1?'S(2n)':'S(n)'))throw new Error('Wrong AME reaction column headings');
 const normalized=text.replace(/\r\n/g,'\n'),footer='\n1\n USE of ARRAYS :';
 const tableText=part===2?normalized.split(footer)[0]:normalized;
 if(part===2&&(!normalized.includes(footer)||!normalized.split(footer)[1].includes('NORMAL END OF PHASE 4')))throw new Error('Unexpected AME part 2 footer');
 const out=[],seen=new Set();
 for(const {line,source_line}of rowsAfter(tableText,'1 A')){
  if(line===header)continue; // Repeated print-page headings in the original rct2 file.
  const A=Number(line.slice(1,4)),symbol=line.slice(5,8).trim(),Z=Number(line.slice(8,11)),key=`${Z}:${A}`;
  if(!Number.isInteger(A)||A<1||!Number.isInteger(Z)||Z<0||Z>A||!/^[A-Za-z]{1,2}$/.test(symbol)||seen.has(key))throw new Error('Invalid/duplicate AME reaction row '+source_line);
  seen.add(key);const at=(part===1?reactionSnapshot:reaction2Snapshot)+'#line='+source_line,metric=i=>ameNumber(line.slice(12+i*22,24+i*22),line.slice(24+i*22,34+i*22),at);
  const prefix=part===1?'reaction':'reaction2',keys=part===1?reaction1Keys:reaction2Keys;
  out.push({A,Z,symbol,[prefix+'_source_line']:source_line,[prefix+'_raw_line']:line,...Object.fromEntries(keys.map((k,i)=>[k,metric(i)]))});
 }
 return out;
}
export function joinAmeTables(masses,reactions,reactions2){
 if(!Array.isArray(reactions2))throw new Error('AME reaction part 2 is required');
 const tables=[reactions,reactions2].map(rows=>new Map(rows.map(r=>[`${r.Z}:${r.A}`,r])));
 if([reactions,reactions2].some((rows,i)=>rows.length!==masses.length||tables[i].size!==rows.length))throw new Error('AME table coverage mismatch');
 return masses.map(m=>{const rows=tables.map(t=>t.get(`${m.Z}:${m.A}`));if(rows.some(r=>!r||r.symbol!==m.symbol))throw new Error('AME identity mismatch');return Object.assign({},m,...rows);});
}

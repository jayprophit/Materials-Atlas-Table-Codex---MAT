// Source-bound subset of the NIST Handbook, preserving air rather than vacuum wavelengths.
export const hydrogenStrong='data/catalog/sources/nist-hydrogen-strong-lines-2026-09-26.html.txt';
export const hydrogenPersistent='data/catalog/sources/nist-hydrogen-persistent-lines-2026-09-26.html.txt';
export const balmerData='records/0001-Hydrogen-H/data/spectra/0001-Hydrogen-H-Balmer-Reference.yaml';
export const balmerChart='records/0001-Hydrogen-H/graphs/0001-Hydrogen-H-GRAPH-Balmer-Air.svg';
const groups=[['4101.74','delta',6],['4340.462','gamma',5],['4861.2786','beta',4],['4861.2870','beta',4],['4861.3615','beta',4],['6562.7110','alpha',3],['6562.7248','alpha',3],['6562.8518','alpha',3]];
export function parseHydrogenBalmer(html){
 const lines=html.replace(/\r\n/g,'\n').split('\n');
 const air=lines.findIndex(l=>l.includes('>Air<br>Wavelength (&Aring;)'));
 if(air<0)throw Error('Missing source air-medium header');
 return groups.map(([raw,series,n],i)=>{
  const row=lines.findIndex(l=>l.includes('name="'+raw+'"'));
  if(row<=air||!lines[row].includes('<td>H I</td>'))throw Error('Missing visible H I air line '+raw);
  const reference=lines[row].match(/hydrogentable7.htm#([A-Za-z0-9]+)/)?.[1];if(!reference)throw Error('Missing native reference');
  return {line_id:'MAT:0001:LINE:BALMER-'+String(i+1).padStart(2,'0'),species:'H I',charge_state:0,series:'Balmer',member:series,
   principal_transition:{upper_n:n,lower_n:2,scope:'Principal-series grouping; not an assertion of a single resolved fine-structure transition.'},
   wavelength:{value:Number((Number(raw)/10).toFixed(8)),unit:'nm',medium:'AIR',uncertainty:null,uncertainty_status:'UNKNOWN',evidence_type:'EVALUATED',source_id:'SRC-000305',source_locator:hydrogenStrong+'#line='+(row+1)},
   source_wavelength:{raw,value:Number(raw),unit:'angstrom',medium:'AIR',reference_key:reference},
   conversion:{equation:'wavelength_nm = wavelength_angstrom / 10',factor:0.1,factor_status:'EXACT-UNIT-CONVERSION',status:'CALCULATED-UNIT-CONVERSION',uncertainty:'The source table supplies no numeric wavelength uncertainty; none is inferred from digit count.'},
   source_line:row+1};
 });
}

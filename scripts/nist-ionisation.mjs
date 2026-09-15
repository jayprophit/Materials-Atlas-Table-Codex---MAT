// Parse a retained NIST ASD CSV export as data, never spreadsheet formulae.
export function csvFields(line){
 const fields=[];let value='',quoted=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){fields.push(value);value='';}else value+=c;
 }
 if(quoted)throw new Error('Unclosed CSV quote');fields.push(value);
 return fields.map(v=>/^="[\s\S]*"$/.test(v)?v.slice(2,-1):v);
}
export function parseIonisation(text){
 const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/),header=csvFields(lines[0]);
 const expected=['At. num','Sp. Name','Ion Charge','El. Name','Isoel. Seq.','Ground Shells (a)','Ground Config.','Ground Level','Prefix','Ionization Energy (b) (eV)','Suffix','Uncertainty (c) (eV)','References',''];
 if(JSON.stringify(header)!==JSON.stringify(expected))throw new Error('Unexpected NIST CSV columns or units');
 const rows=[],seen=new Set();let notes=false;
 const numeric=(s,label)=>{if(s==='')return null;if(!/^\d+(?:\.\d*)?(?:[eE][+-]?\d+)?$/.test(s))throw new Error('Unsupported '+label+': '+s);const v=Number(s);if(!Number.isFinite(v))throw new Error('Non-finite '+label);return v;};
 for(let i=1;i<lines.length;i++){
  if(lines[i]==='Notes:'){notes=true;break;}if(!lines[i].trim())continue;
  const f=csvFields(lines[i]);if(f.length!==header.length)throw new Error('Column count at line '+(i+1));
  const [zRaw,spectrum,chargeRaw,element,sequence,shells,configuration,level,prefix,energy,suffix,uncertainty,references]=f;
  if(!/^\d+$/.test(zRaw)||!/^\+?\d+$/.test(chargeRaw))throw new Error('Invalid Z/charge');
  const z=Number(zRaw),charge=Number(chargeRaw),key=z+':'+charge;
  if(z<1||z>118||charge<0||charge>=z||seen.has(key))throw new Error('Duplicate or invalid charge state '+key);seen.add(key);
  if(!['','[]','()'].includes(prefix+suffix))throw new Error('Unrecognised energy qualifier '+prefix+suffix);
  const value=numeric(energy,'energy'),u=numeric(uncertainty,'uncertainty');
  if(value!==null&&value<=0)throw new Error('Nonpositive ionisation energy');
  if(value===null&&u!==null)throw new Error('Uncertainty without value');
  rows.push({z,charge,spectrum,source_element_name:element,isoelectronic_sequence:sequence||'UNKNOWN',ground_shells_raw:shells||'UNKNOWN',ground_configuration_raw:configuration||'UNKNOWN',ground_level_raw:level||'UNKNOWN',
   ionisation_energy:{value,unit:'eV',uncertainty:u,raw:energy,prefix,suffix,uncertainty_raw:uncertainty,
    ...(value===null?{null_state:'UNKNOWN'}:{evidence_type:prefix==='('? 'THEORETICAL':'EVALUATED'}),
    value_status:value===null?'UNKNOWN':prefix==='('? 'THEORETICAL':prefix==='['?'SEMIEMPIRICAL':'EVALUATED-UNBRACKETED',
    uncertainty_status:u===null?'UNKNOWN':'SOURCE-REPORTED',source_id:'SRC-000005'},
   bibliography_keys:references?references.split(',').map(s=>s.trim()):[],source_line:i+1,source_row:lines[i]});
 }
 if(!notes||!rows.length)throw new Error('Missing NIST footer or data');return rows;
}

// Compare established headline measurements to new dated reference rows without overwriting them.
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import YAML from 'yaml';
import {R,root} from './lib.mjs';
import {parseIonisation} from './nist-ionisation.mjs';
const catalog=JSON.parse(R('data/catalog/elements-baseline.json')),nist=parseIonisation(R('data/catalog/sources/nist-asd-ionisation-2026-09-14.csv'));
const rows=catalog.elements.map(e=>{
 const stem=e.chapterPath.split('/')[1],path=`records/${stem}/data/structured/${stem}.yaml`,master=YAML.parse(R(path));
 const selected=master.ionization?.first?{field:'$.ionization.first',measurement:master.ionization.first}:{field:'$.properties.first_ionization_energy',measurement:master.properties?.first_ionization_energy||null};
 const ref=nist.find(r=>r.z===e.z&&r.charge===0),old=selected.measurement;
 const delta=typeof old?.value==='number'&&ref?.ionisation_energy.value!==null&&ref?.ionisation_energy.value!==undefined?old.value-ref.ionisation_energy.value:null;
 return {mat_id:e.matId,name:e.name,path,...selected,nist_neutral:ref?{...ref.ionisation_energy,source_line:ref.source_line,source_row:ref.source_row}:null,difference_eV:delta,
  status:!ref?'INSUFFICIENT DATA':delta===null?'HEADLINE-OR-REFERENCE-UNKNOWN':delta===0?'NUMERIC-MATCH':'REVIEW-DIFFERENT-VALUE',
  uncertainty_review:'No significance conclusion from the difference alone: account for source date, rounding, uncertainty, isotope and state conventions.',action:'AUTHORED-NUMBERS-PRESERVED'};
});
const report={schema_version:'1.0.0',date:'2026-09-14',scope:'118 canonical headline fields compared with the retained NIST neutral rows. Does not audit every duplicate number in narrative or specialist files.',rows};
writeFileSync(join(root,'data/quality/ionisation-reconciliation.json'),JSON.stringify(report,null,2)+'\n');
console.log(Object.fromEntries([...new Set(rows.map(r=>r.status))].map(s=>[s,rows.filter(r=>r.status===s).length])));

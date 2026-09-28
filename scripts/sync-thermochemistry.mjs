// Build additive, state-specific element evaluations from immutable NIST snapshots.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {fitSamples,shomate} from './thermochemistry.mjs';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
const read=p=>fs.readFileSync(p,'utf8');
const catalogue=JSON.parse(read('data/catalog/thermochemistry-evaluation-index.json'));
const baseline=JSON.parse(read('data/catalog/elements-baseline.json')).elements;
const marker='generated-by: sync-thermochemistry.mjs';
const outputs=[];const plots=[];
function add(file,body){
 if(fs.existsSync(file)&&!read(file).includes(marker)){
  const receiptPath='data/quality/thermochemistry-chart-manifest.json';
  const receipt=file.endsWith('.csv')&&fs.existsSync(receiptPath)?JSON.parse(read(receiptPath)).elements.find(e=>e.csv===file):null;
  if(!receipt||createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==receipt.csv_sha256)throw new Error('Refusing to overwrite unrecognised or edited output '+file);
 }
 outputs.push({file,body});
}
const equations={temperature:'t = T / 1000, where T is numerical kelvin',
 heat_capacity:'Cp° = A + B*t + C*t^2 + D*t^3 + E/t^2; J mol^-1 K^-1',
 enthalpy_increment:'H°(T) - H°(298.15 K) = A*t + B*t^2/2 + C*t^3/3 + D*t^4/4 - E/t + F - H; kJ mol^-1',
 entropy:'S° = A*ln(t) + B*t + C*t^2/2 + D*t^3/3 - E/(2*t^2) + G; J mol^-1 K^-1'};
for(const item of catalogue.elements){
 const element=baseline.find(e=>e.z===item.z);if(element.name!==item.name)throw new Error('Canonical name mismatch');
 const stem=element.chapterPath.split('/')[1],dir='records/'+stem;
 for(const snapshot of [item.snapshot,item.publisher_table_snapshot])if(createHash('sha256').update(fs.readFileSync(snapshot.path)).digest('hex')!==snapshot.sha256)throw new Error('Source hash mismatch');
 const dataPath=`${dir}/data/structured/${stem}-NIST-Thermochemistry.yaml`,chapter=`${dir}/${stem}-Thermochemistry.md`;
 const csvPath=`${dir}/tables/${stem}-TABLE-010-Thermodynamic-Functions.csv`,tablePath=csvPath.replace('.csv','.md');
 const graphPath=`${dir}/graphs/${stem}-GRAPH-009-Heat-Capacity.svg`;
 const model={registry_id:item.record_id+':REG:NIST-THERMOCHEMISTRY',record_id:item.record_id,schema_version:'1.0.0',record_version:'1.0.0',
  status:'RESEARCHED-IN-PROGRESS',source_id:item.source_id,source_ids:[item.source_id],evaluation:{retrieved:item.retrieved,snapshot:item.snapshot,publisher_table_snapshot:item.publisher_table_snapshot},
  species:{source_formula:item.source_formula,molar_basis:item.molar_basis,atoms_per_source_formula:item.atoms_per_source_formula,
   gas_species:item.source_formula==='Cl2'?'ISOLATED-MOLECULAR-SPECIES':'ISOLATED-ATOMIC-SPECIES',
   pressure:{value:null,unit:'bar',status:'SOURCE-STANDARD-STATE-CONVENTION',note:'This is a standard thermochemical fit, not an equation of state at arbitrary applied pressure. No pressure-dependent data are inferred.'}},
  interpretation:{scope:'Dated NIST/JANAF Shomate fits. Each phase, variant and temperature interval is separate; range limits do not establish melting, boiling or thermodynamic stability.',
   gas:'The gas fits describe the printed species; they do not compute temperature-dependent dissociation, ionisation or equilibrium speciation.',
   phase:'Overlapping solid allotrope fits are alternatives, not segments to blend. Unspecified phase structure remains UNKNOWN.',
   enthalpy:'The publisher formula reports H°(T)-H°(298.15 K) with the coefficient H subtracted. Phase-dependent reference offsets are retained. Do not join curves across phases or interpret coefficient H as latent heat.',
   uncertainty:'Coefficient errors and covariance are not supplied. Calculated uncertainty remains UNKNOWN; extra floating-point digits are computational, not measurement precision.',
   extrapolation:'DISABLED. The 298.15 K reference in the formula does not authorise evaluating a liquid or gas fit outside its published interval.',
   pressure:'Standard-state thermochemical convention; no pressure-temperature phase diagram, thermal conductivity or diffusivity follows from these fits.'},
  equations,heat_capacity_fits:item.heat_capacity_fits,table:{path:tablePath,csv:csvPath,samples_per_fit:101},graph:{path:graphPath,scope:'Calculated molar heat capacity; not a measured phase diagram'},
  remaining:{thermal_conductivity:'INSUFFICIENT DATA',thermal_diffusivity:'INSUFFICIENT DATA',thermal_expansion:'INSUFFICIENT DATA',pressure_dependence:'INSUFFICIENT DATA',latent_heats:'SEPARATE-SOURCE-REVIEW-REQUIRED',independent_scientific_review:'PENDING'}};
 add(dataPath,'# '+marker+'\n'+YAML.stringify(model,{lineWidth:120}));
 const series=item.heat_capacity_fits.map(fit=>({fit_id:fit.fit_id,phase:fit.phase,label:fit.phase_label_as_reported,
  temperature_range:fit.temperature_range,source_id:item.source_id,points:fitSamples(fit)}));
 const csv=['fit_id,source_id,source_formula,phase,phase_variant,temperature_K,heat_capacity_J_mol_K,entropy_J_mol_K,enthalpy_increment_kJ_mol,uncertainty,evidence_status'];
 const csvCell=v=>'"'+String(v).replaceAll('"','""')+'"';
 for(const curve of series)for(const p of curve.points)csv.push([curve.fit_id,item.source_id,item.source_formula,curve.phase,curve.label,p.temperature_K,p.heat_capacity_J_mol_K,p.entropy_J_mol_K,p.enthalpy_increment_kJ_mol,p.uncertainty,p.evidence_status].map(csvCell).join(','));
 add(csvPath,csv.join('\n')+'\n');
 const cell=v=>String(v).replaceAll('|','\\|');
 const fixed=n=>n.toFixed(4);
 const rows=item.heat_capacity_fits.flatMap(fit=>[fit.temperature_range.min,(fit.temperature_range.min+fit.temperature_range.max)/2,fit.temperature_range.max].map(T=>{
  const p=shomate(fit,T);return `| ${cell(fit.fit_id.split(':').slice(-2).join(':'))} | ${cell(fit.phase_label_as_reported)} | ${T} | ${fixed(p.heat_capacity_J_mol_K)} | ${fixed(p.entropy_J_mol_K)} | ${fixed(p.enthalpy_increment_kJ_mol)} |`; }));
 add(tablePath,`# ${item.name} — calculated thermodynamic functions\n\n<!-- ${marker} -->\n\nSource: ${item.source_id}, NIST Chemistry WebBook / Chase (1998), retrieved ${item.retrieved}. These are calculations from dated fits, not new measurements. Values below are rounded to four decimal places for computational comparison; this is not a statement of physical precision. Uncertainty: UNKNOWN. Basis: **${item.molar_basis}**.\n\n[Full calculation and limits](../${stem}-Thermochemistry.md) · [Complete 101-point-per-fit CSV](${path.basename(csvPath)}) · [Exact coefficients](../data/structured/${stem}-NIST-Thermochemistry.yaml)\n\n| Fit | Variant | T / K | Cp° / J mol⁻¹ K⁻¹ | S° / J mol⁻¹ K⁻¹ | H°(T)−H°(298.15 K) / kJ mol⁻¹ |\n|---|---|---:|---:|---:|---:|\n${rows.join('\n')}\n\nEach row uses only the named phase and fit interval. Do not subtract rows from different phases to obtain transition enthalpy without first resolving their standard-state reference offsets.\n`);
 const fitRows=item.heat_capacity_fits.map(f=>`| ${f.phase}:${f.source_column} | ${cell(f.phase_label_as_reported)} | ${f.temperature_range.min}–${f.temperature_range.max} | ${cell(f.comment_as_reported)} |`).join('\n');
 const speciesNote=item.source_formula==='Cl2'?'The chlorine basis is one mole of Cl₂ molecules, containing two moles of chlorine atoms. No factor-of-two conversion to atomic chlorine has been applied.':`The source formula is ${item.source_formula}. Condensed data are expressed per mole of this elemental formula; the gas entry describes atomic ${item.source_formula}, not all species in an equilibrium vapour.`;
 add(chapter,`# ${item.name} — thermal functions and phase-specific heat capacity\n\n<!-- ${marker} -->\n\n${item.heat_capacity_fits.length} published Shomate fits are available in this dated NIST Chemistry WebBook extraction. ${speciesNote} The element's wider thermal domain remains PARTIAL.\n\n[Parent record](${stem}.md) · [Structured coefficients](data/structured/${stem}-NIST-Thermochemistry.yaml) · [Calculated table](tables/${path.basename(tablePath)}) · [CSV](tables/${path.basename(csvPath)})\n\nSource: **${item.source_id}**, [NIST Chemistry WebBook](${item.snapshot.url}), retrieved ${item.retrieved}. [Retained coefficient source](../../${item.snapshot.path}) and [publisher's rounded comparison table](../../${item.publisher_table_snapshot.path}) preserve the exact downloaded bytes and their SHA-256 hashes. The original evaluation is Chase (1998), with each earlier review date retained below.\n\n## Applicable states and intervals\n\n| Fit | Source phase variant | Valid T / K | Source comment |\n|---|---|---:|---|\n${fitRows}\n\nA fit interval describes where the publisher supplies coefficients. Its endpoints are not automatically melting points, boiling points or equilibrium phase boundaries. Alternative solid phases may have overlapping ranges. The source's unspecified crystal structure is UNKNOWN. Each gas fit concerns its listed species; dissociation and ionisation equilibria are not calculated. Standard thermochemical functions do not supply arbitrary-pressure behaviour.\n\n## Equations and reference states\n\nWith t = T/1000 and T in kelvin, use the exact source A–H coefficients in their published mixed-unit convention:\n\n- Cp° = A + B·t + C·t² + D·t³ + E/t², in J mol⁻¹ K⁻¹.\n- H°(T)−H°(298.15 K) = A·t + B·t²/2 + C·t³/3 + D·t⁴/4 − E/t + F − H, in kJ mol⁻¹.\n- S° = A·ln(t) + B·t + C·t²/2 + D·t³/3 − E/(2·t²) + G, in J mol⁻¹ K⁻¹.\n\nThe last H is a coefficient, not the temperature-dependent enthalpy. Phase-specific reference offsets matter: do not splice enthalpy increments from different phases or interpret coefficient H as latent heat. The 298.15 K reference does not permit extrapolating a high-temperature fit down to 298.15 K. Outside-range evaluation is rejected. Unpublished coefficient uncertainty and covariance remain UNKNOWN; no error bars or extra physical precision are invented.\n\n## Heat-capacity chart\n\n![${item.name}: molar heat capacity calculated separately for each published phase and valid fit range](graphs/${path.basename(graphPath)})\n\nEach panel uses its own temperature scale. Lines sample the published equation; they are not observations or phase-stability predictions. Unknown uncertainties are not zero. These calculated charts supplement the chapter and do not replace any of the 22 requested illustrations.\n\n## Validation and outstanding thermal data\n\nThe calculation is checked against the publisher's separately tabulated rounded values and the thermodynamic identities dH/dT = Cp and dS/dT = Cp/T. These checks verify transcription and arithmetic, not independent experimental validity. The source tables retain older evaluations; later measurements and application-specific state conditions need separate review. Thermal conductivity, diffusivity, expansion, pressure dependence, transition enthalpies and a phase diagram remain INSUFFICIENT DATA in this supplement. Existing phase-reference values are preserved for later source reconciliation.\n`);
 const masterPath=`${dir}/data/structured/${stem}.yaml`;
 let master=read(masterPath);
 // Record the additive revision without changing BASELINE scientific status.
 const priorMaster=YAML.parse(master);
 const parentVersion=priorMaster.record_version==='1.1.1'?'1.2.0':priorMaster.record_version;
 const parentUpdated=String(priorMaster.updated)<item.retrieved?item.retrieved:String(priorMaster.updated);
 master=master.replace(/^record_version:.*$/m,'record_version: '+parentVersion).replace(/^updated:.*$/m,'updated: '+parentUpdated);
 const thermal=YAML.stringify({thermal:{status:'PARTIAL',evaluation_file:dataPath,evaluation_chapter:chapter,source_id:item.source_id,heat_capacity_fit_count:item.heat_capacity_fits.length,scientific_review_status:'PARTIAL-REQUIRES-REVIEW'}},{lineWidth:120});
 if(!/^thermal:\r?\n  status: PLANNED\r?\n/m.test(master)&&!master.includes(dataPath))throw new Error('Authored thermal state needs manual merge');
 master=master.replace(/^thermal:\r?\n(?:[ \t]+.*\r?\n|\r?\n)+/m,thermal).replace(/^  thermal: PLANNED$/m,'  thermal: PARTIAL');
 outputs.push({file:masterPath,body:master});
 const mainPath=`${dir}/${stem}.md`;
 let main=read(mainPath);const start='<!-- NIST-THERMOCHEMISTRY-SUPPLEMENT -->',end='<!-- /NIST-THERMOCHEMISTRY-SUPPLEMENT -->';
 main=main.replace(/^record_version:.*$/m,'record_version: "'+parentVersion+'"').replace(/^updated:.*$/m,'updated: "'+parentUpdated+'"');
 // Repair the blank line that split the existing baseline revision table.
 main=main.replace(/(\| 1\.0\.0 \|[^\r\n]+)\r?\n\r?\n(\| 1\.1\.0 \|)/,'$1\n$2');
 const revision='| 1.2.0 | '+item.retrieved+' | Added source-bound NIST thermal fits, calculated functions and charts; wider thermal review remains PARTIAL. |';
 if(!main.includes(revision))main=main.replace(/(\| 1\.1\.0 \|[^\r\n]+)/,'$1\n'+revision);
 const block=`${start}\n[${item.name} thermal functions](${stem}-Thermochemistry.md) provides ${item.heat_capacity_fits.length} NIST Shomate fits, explicit species/phase limits, equations, a heat-capacity chart and tables. Calculated uncertainty remains UNKNOWN. Source: ${item.source_id}. Wider thermal properties remain PARTIAL.\n\n![${item.name} heat capacity by phase and valid source temperature interval](graphs/${path.basename(graphPath)})\n${end}`;
 if(main.includes(start))main=main.replace(new RegExp(start+'[\\s\\S]*?'+end),block);
 else main=main.replace(/(# 12\. Thermal and Thermodynamic Properties\r?\n)/,'$1\n'+block+'\n');
 if(!main.includes(start))throw new Error('Locked thermal heading not found');
 main=main.replace(/^thermal: PLANNED$/m,'thermal: PARTIAL');outputs.push({file:mainPath,body:main});
 for(const [kind,key,identifier,entry]of [
  ['Table','tables','table_id',{table_id:item.record_id+':TABLE:010',filename:path.basename(tablePath),data_filename:path.basename(csvPath),title:item.name+' calculated thermodynamic functions',status:'GENERATED',evidence_status:'CALCULATED-FROM-PUBLISHED-FIT',source_ids:[item.source_id]}],
  ['Graph','graphs','graph_id',{graph_id:item.record_id+':GRAPH:009',filename:path.basename(graphPath),data_filename:'../../tables/'+path.basename(csvPath),title:item.name+' phase-specific heat capacity',status:'GENERATED',evidence_status:'CALCULATED-FROM-PUBLISHED-FIT',source_ids:[item.source_id]}]]){
   const manifestPath=`${dir}/data/structured/${stem}-${kind}-Manifest.yaml`,manifest=YAML.parse(read(manifestPath));
   const existing=manifest[key].find(e=>e[identifier]===entry[identifier]);if(existing&&existing.filename!==entry.filename)throw new Error('Manifest slot already owned');
   const doc=YAML.parseDocument(read(manifestPath));
   if(existing)doc.setIn([key,manifest[key].indexOf(existing)],entry);else doc.get(key).add(entry);
   outputs.push({file:manifestPath,body:doc.toString({lineWidth:120})});
 }
 plots.push({record_id:item.record_id,name:item.name,stem,source_id:item.source_id,molar_basis:item.molar_basis,input:dataPath,csv:csvPath,chart:graphPath,series});
}
// Preflight every target before writing generated data or additive authored links.
for(const {file,body}of outputs){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);}
fs.mkdirSync('.mat-local',{recursive:true});fs.writeFileSync('.mat-local/thermochemistry-plot-input.json',JSON.stringify(plots,null,2)+'\n');
console.log(JSON.stringify({elements:plots.length,fits:plots.reduce((n,e)=>n+e.series.length,0),calculated_rows:plots.reduce((n,e)=>n+e.series.reduce((s,f)=>s+f.points.length,0),0)}));

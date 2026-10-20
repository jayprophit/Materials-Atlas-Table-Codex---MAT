// Build additive, state-specific element evaluations from immutable NIST snapshots.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import YAML from 'yaml';
import {fitSamples,shomate} from './thermochemistry.mjs';
import {parseThermochemistryArgs,selectThermochemistryOwners} from './thermochemistry-selection.mjs';
import {loadThermochemistryContext,validateThermochemistryContext,resolveThermochemistryAssetSlots,validateThermochemistryReviewNotes} from './thermochemistry-context.mjs';
import {effectivePublisherTemperatureReviewNotes} from './thermochemistry-publisher-temperature.mjs';
const root=path.resolve(import.meta.dirname,'..');
export function elementalFormulaAtoms(formula,symbol) {
 const match=typeof formula==='string'&&/^([A-Z][a-z]?)([1-9][0-9]*)?$/.exec(formula);
 if(!match||match[1]!==symbol||match[2]==='1')throw new Error('Unsupported elemental formula '+formula+' for '+symbol);
 const count=Number(match[2]??1);
 if(!Number.isSafeInteger(count))throw new Error('Unsupported elemental atom count '+formula);
 return count;
}
export function syncThermochemistry({repoRoot=root,elements=null}={}) {
const previousDirectory=process.cwd();
process.chdir(repoRoot);
try {
const read=p=>fs.readFileSync(p,'utf8');
// Selection validation precedes planning, directory creation and every output write.
const catalogue=selectThermochemistryOwners(JSON.parse(read('data/catalog/thermochemistry-evaluation-index.json')),elements);
// Validate all selected comparison rows before planning or writing any outputs.
// Notes are a local read projection; the catalogue and its authored notes stay intact.
const effectiveReviewNotes=new Map(catalogue.elements.map(item=>[item.record_id,effectivePublisherTemperatureReviewNotes(item)]));
const baseline=JSON.parse(read('data/catalog/elements-baseline.json')).elements;
const marker='generated-by: sync-thermochemistry.mjs';
const outputs=[];const plots=[];
const curatedIdentities=[];
const receiptPath='data/quality/thermochemistry-chart-manifest.json';
const receipts=fs.existsSync(receiptPath)?JSON.parse(read(receiptPath)).elements:[];
function add(file,body,{immutable=false}={}){
 if(immutable&&fs.existsSync(file)&&read(file)!==body)throw new Error('Refusing to overwrite edited or changed source-gap output '+file);
 const receipt=receipts.find(e=>e.csv===file||e.input===file);
 if(receipt&&fs.existsSync(file)){
  const expected=file===receipt.csv?receipt.csv_sha256:receipt.input_sha256;
  if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==expected)throw new Error('Refusing to overwrite edited output '+file);
 }
 if(fs.existsSync(file)&&!read(file).includes(marker)){
  if(!receipt||createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==receipt.csv_sha256)throw new Error('Refusing to overwrite unrecognised or edited output '+file);
 }
 outputs.push({file,body});
}
function preflightPhysicalSlot(folder,prefix,allowed,recordId){
 if(!fs.existsSync(folder))return;
 const slot=prefix.slice(0,-1).toLowerCase();
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  const name=entry.name.toLowerCase(),tail=name.slice(slot.length);
  if(!name.startsWith(slot)||!(tail===''||tail.startsWith('-')||tail.startsWith('.')))continue;
  const file=folder+'/'+entry.name;
  if(!entry.isFile()||!allowed.includes(file))throw new Error('Physical numeric slot already owned '+file);
  const receipt=receipts.find(r=>r.record_id===recordId&&(r.csv===file||r.chart===file));
  if(receipt){
   const hash=receipt.csv===file?receipt.csv_sha256:receipt.chart_sha256;
   if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==hash)throw new Error('Refusing to overwrite edited output '+file+' (physical slot target)');
  }else if(!file.endsWith('.md')||!read(file).includes('<!-- '+marker+' -->'))throw new Error('Refusing to overwrite unrecognised physical slot target '+file);
 }
}
function appendApprovedBlock(original,start,end,block){
 const eol=original.includes('\r\n')?'\r\n':'\n',expected=block.replace(/\r?\n/g,eol);
 const starts=original.split(start).length-1,ends=original.split(end).length-1;
 if(starts||ends){
  if(starts!==1||ends!==1)throw new Error('Curated append marker is missing or duplicated');
  const from=original.indexOf(start),to=original.indexOf(end,from);
  if(to<from||original.slice(from,to+end.length)!==expected)throw new Error('Refusing to overwrite edited or changed curated append block');
  return original;
 }
 return original+(original.endsWith(eol)?eol:eol+eol)+expected+eol;
}
const equations={temperature:'t = T / 1000, where T is numerical kelvin',
 heat_capacity:'Cp° = A + B*t + C*t^2 + D*t^3 + E/t^2; J mol^-1 K^-1',
 enthalpy_increment:'H°(T) - H°(298.15 K) = A*t + B*t^2/2 + C*t^3/3 + D*t^4/4 - E/t + F - H; kJ mol^-1',
 entropy:'S° = A*ln(t) + B*t + C*t^2/2 + D*t^3/3 - E/(2*t^2) + G; J mol^-1 K^-1'};
for(const item of catalogue.elements){
 validateThermochemistryReviewNotes(item);
 const reviewNotes=effectiveReviewNotes.get(item.record_id);
 const element=baseline.find(e=>e.z===item.z);if(element.name!==item.name)throw new Error('Canonical name mismatch');
 const atomCount=elementalFormulaAtoms(item.source_formula,element.symbol);
 if(item.atoms_per_source_formula!==atomCount||item.molar_basis!=='mol '+item.source_formula)throw new Error('Elemental species molar basis mismatch');
 const slots=resolveThermochemistryAssetSlots(item),tableSlot=String(slots.table).padStart(3,'0'),graphSlot=String(slots.graph).padStart(3,'0');
 const stem=element.chapterPath.split('/')[1],dir='records/'+stem;
 const identityPath=`${dir}/data/structured/${stem}.yaml`;
 let curatedSubject=null;
 if(item.parent_integration!==undefined||item.subject!==undefined){
  const context=loadThermochemistryContext(item,{identityPath,readBytes:file=>fs.readFileSync(file)});
  curatedSubject=validateThermochemistryContext(item,context);
  curatedIdentities.push(...context.owners);
 }
 for(const snapshot of [item.snapshot,item.publisher_table_snapshot])if(createHash('sha256').update(fs.readFileSync(snapshot.path)).digest('hex')!==snapshot.sha256)throw new Error('Source hash mismatch');
 const dataPath=`${dir}/data/structured/${stem}-NIST-Thermochemistry.yaml`,chapter=`${dir}/${stem}-Thermochemistry.md`;
 const csvPath=`${dir}/tables/${stem}-TABLE-${tableSlot}-Thermodynamic-Functions.csv`,tablePath=csvPath.replace('.csv','.md');
 const graphPath=`${dir}/graphs/${stem}-GRAPH-${graphSlot}-Heat-Capacity.svg`;
 preflightPhysicalSlot(dir+'/tables',stem+'-TABLE-'+tableSlot+'-',[tablePath,csvPath],item.record_id);
 preflightPhysicalSlot(dir+'/graphs',stem+'-GRAPH-'+graphSlot+'-',[graphPath],item.record_id);
 const model={registry_id:item.record_id+':REG:NIST-THERMOCHEMISTRY',record_id:item.record_id,schema_version:'1.0.0',record_version:'1.0.0',
  status:'RESEARCHED-IN-PROGRESS',source_id:item.source_id,source_ids:[item.source_id],evaluation:{retrieved:item.retrieved,snapshot:item.snapshot,publisher_table_snapshot:item.publisher_table_snapshot},
  ...(curatedSubject?{parent_integration:item.parent_integration,subject:curatedSubject}:{}),
  ...(item.asset_slots!==undefined?{asset_slots:item.asset_slots}:{}),
  species:{source_formula:item.source_formula,molar_basis:item.molar_basis,atoms_per_source_formula:item.atoms_per_source_formula,
   gas_species:atomCount>1?'ISOLATED-MOLECULAR-SPECIES':'ISOLATED-ATOMIC-SPECIES',
   pressure:{value:null,unit:'bar',status:'SOURCE-STANDARD-STATE-CONVENTION',note:'This is a standard thermochemical fit, not an equation of state at arbitrary applied pressure. No pressure-dependent data are inferred.'}},
  interpretation:{scope:'Dated NIST/JANAF Shomate fits. Each phase, variant and temperature interval is separate; range limits do not establish melting, boiling or thermodynamic stability.',
   gas:'The gas fits describe the printed species; they do not compute temperature-dependent dissociation, ionisation or equilibrium speciation.',
   phase:'Overlapping solid allotrope fits are alternatives, not segments to blend. Unspecified phase structure remains UNKNOWN.',
   enthalpy:'The publisher formula reports H°(T)-H°(298.15 K) with the coefficient H subtracted. Phase-dependent reference offsets are retained. Do not join curves across phases or interpret coefficient H as latent heat.',
   uncertainty:'Coefficient errors and covariance are not supplied. Calculated uncertainty remains UNKNOWN; extra floating-point digits are computational, not measurement precision.',
   extrapolation:'DISABLED. The 298.15 K reference in the formula does not authorise evaluating a liquid or gas fit outside its published interval.',
   pressure:'Standard-state thermochemical convention; no pressure-temperature phase diagram, thermal conductivity or diffusivity follows from these fits.'},
  equations,heat_capacity_fits:item.heat_capacity_fits,...(reviewNotes.length?{review_notes:reviewNotes}:{}),table:{path:tablePath,csv:csvPath,samples_per_fit:101},graph:{path:graphPath,scope:'Calculated molar heat capacity; not a measured phase diagram'},
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
  const p=shomate(fit,T);return `| ${cell(fit.fit_id.split(':').slice(-2).join(':'))} | ${cell(fit.phase_label_as_reported)} | ${fixed(T)} | ${fixed(p.heat_capacity_J_mol_K)} | ${fixed(p.entropy_J_mol_K)} | ${fixed(p.enthalpy_increment_kJ_mol)} |`; }));
 add(tablePath,`# ${item.name} — calculated thermodynamic functions\n\n<!-- ${marker} -->\n\nSource: ${item.source_id}, NIST Chemistry WebBook / Chase (1998), retrieved ${item.retrieved}. These are calculations from dated fits, not new measurements. Values below are rounded to four decimal places for computational comparison; this is not a statement of physical precision. Uncertainty: UNKNOWN. Basis: **${item.molar_basis}**.\n\n[Full calculation and limits](../${stem}-Thermochemistry.md) · [Complete 101-point-per-fit CSV](${path.basename(csvPath)}) · [Exact coefficients](../data/structured/${stem}-NIST-Thermochemistry.yaml)\n\n| Fit | Variant | T / K | Cp° / J mol⁻¹ K⁻¹ | S° / J mol⁻¹ K⁻¹ | H°(T)−H°(298.15 K) / kJ mol⁻¹ |\n|---|---|---:|---:|---:|---:|\n${rows.join('\n')}\n\nEach row uses only the named phase and fit interval. Do not subtract rows from different phases to obtain transition enthalpy without first resolving their standard-state reference offsets.\n`);
 const fitRows=item.heat_capacity_fits.map(f=>`| ${f.phase}:${f.source_column} | ${cell(f.phase_label_as_reported)} | ${f.temperature_range.min}–${f.temperature_range.max} | ${cell(f.comment_as_reported)} |`).join('\n');
 const subscript=value=>String(value).replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]),atomWord=atomCount===2?'two':String(atomCount);
 const speciesNote=atomCount>1?`The ${item.name.toLowerCase()} basis is one mole of ${element.symbol+subscript(atomCount)} molecules, containing ${atomWord} moles of ${item.name.toLowerCase()} atoms. No factor-of-${atomWord} conversion to atomic ${item.name.toLowerCase()} has been applied.`:curatedSubject?.object_class==='ATOM'?`The ${item.name.toLowerCase()} basis is one mole of neutral ${item.source_formula} atoms. The listed monatomic gas species is not a dimer, an isotope-specific equation of state or all species in an equilibrium vapour.`:`The source formula is ${item.source_formula}. Condensed data are expressed per mole of this elemental formula; the gas entry describes atomic ${item.source_formula}, not all species in an equilibrium vapour.`;
 const subjectOwnerLink=curatedSubject?`data/structured/${path.basename(curatedSubject.owner.path)}`:null;
 const parentIdentityNote=curatedSubject?.identity_owner?` Parent element identity: [unchanged master](data/structured/${path.basename(curatedSubject.identity_owner.path)}) at \`${curatedSubject.identity_owner.pointer}\`. This DEFINITIONAL identifier supplies no measured state, isotope, excitation, medium or measurement conditions.`:'';
 const subjectNote=curatedSubject?`\n\nCanonical subject: **${curatedSubject.object_ref}** (${curatedSubject.object_class}), defined by the [unchanged curated owner](${subjectOwnerLink}) at \`${curatedSubject.owner.pointer}\`.${parentIdentityNote} `+(curatedSubject.object_class==='ATOM'?`Molecular spin-isomer scope is **NOT-APPLICABLE-TO-MONATOMIC-SPECIES**. Isotopic composition is **UNSPECIFIED-IN-RETAINED-FIT**. No particular isotope, dimer population, cryogenic equilibrium or superfluid transition is inferred.\n`:`Spin-isomer scope and isotopic composition are **UNSPECIFIED-IN-RETAINED-FIT**. No normal/para/ortho composition, cryogenic equilibrium, atomic-species substitution or dissociation calculation is inferred.\n`):'';
 add(chapter,`# ${item.name} — thermal functions and phase-specific heat capacity\n\n<!-- ${marker} -->\n\n${item.heat_capacity_fits.length} published Shomate fits are available in this dated NIST Chemistry WebBook extraction. ${speciesNote} The element's wider thermal domain remains PARTIAL.\n\n[Parent record](${stem}.md) · [Structured coefficients](data/structured/${stem}-NIST-Thermochemistry.yaml) · [Calculated table](tables/${path.basename(tablePath)}) · [CSV](tables/${path.basename(csvPath)})\n\nSource: **${item.source_id}**, [NIST Chemistry WebBook](${item.snapshot.url}), retrieved ${item.retrieved}. [Retained coefficient source](../../${item.snapshot.path}) and [publisher's rounded comparison table](../../${item.publisher_table_snapshot.path}) preserve the exact downloaded bytes and their SHA-256 hashes. The original evaluation is Chase (1998), with each earlier review date retained below.\n\n## Applicable states and intervals\n\n| Fit | Source phase variant | Valid T / K | Source comment |\n|---|---|---:|---|\n${fitRows}\n\nA fit interval describes where the publisher supplies coefficients. Its endpoints are not automatically melting points, boiling points or equilibrium phase boundaries. Alternative solid phases may have overlapping ranges. The source's unspecified crystal structure is UNKNOWN. Each gas fit concerns its listed species; dissociation and ionisation equilibria are not calculated. Standard thermochemical functions do not supply arbitrary-pressure behaviour.\n\n## Equations and reference states\n\nWith t = T/1000 and T in kelvin, use the exact source A–H coefficients in their published mixed-unit convention:\n\n- Cp° = A + B·t + C·t² + D·t³ + E/t², in J mol⁻¹ K⁻¹.\n- H°(T)−H°(298.15 K) = A·t + B·t²/2 + C·t³/3 + D·t⁴/4 − E/t + F − H, in kJ mol⁻¹.\n- S° = A·ln(t) + B·t + C·t²/2 + D·t³/3 − E/(2·t²) + G, in J mol⁻¹ K⁻¹.\n\nThe last H is a coefficient, not the temperature-dependent enthalpy. Phase-specific reference offsets matter: do not splice enthalpy increments from different phases or interpret coefficient H as latent heat. The 298.15 K reference does not permit extrapolating a high-temperature fit down to 298.15 K. Outside-range evaluation is rejected. Unpublished coefficient uncertainty and covariance remain UNKNOWN; no error bars or extra physical precision are invented.\n\n## Heat-capacity chart\n\n![${item.name}: molar heat capacity calculated separately for each published phase and valid fit range](graphs/${path.basename(graphPath)})\n\nEach panel uses its own temperature scale. Lines sample the published equation; they are not observations or phase-stability predictions. Unknown uncertainties are not zero. These calculated charts supplement the chapter and do not replace any of the 22 requested illustrations.\n\n## Validation and outstanding thermal data\n\nThe calculation is checked against the publisher's separately tabulated rounded values and the thermodynamic identities dH/dT = Cp and dS/dT = Cp/T. These checks verify transcription and arithmetic, not independent experimental validity. The source tables retain older evaluations; later measurements and application-specific state conditions need separate review. Thermal conductivity, diffusivity, expansion, pressure dependence, transition enthalpies and a phase diagram remain INSUFFICIENT DATA in this supplement. Existing phase-reference values are preserved for later source reconciliation.\n`);
 if(curatedSubject){
  const output=outputs.find(o=>o.file===chapter);
  output.body=output.body.replace(speciesNote,speciesNote+subjectNote);
 }
 if(reviewNotes.length){
  const output=outputs.find(o=>o.file===chapter);
  const notes='## Fit-specific scientific review\n\n'+reviewNotes.map(n=>`**${n.status}: ${n.note_id}.** ${n.text} Source: ${item.source_id}. Evidence: ${n.evidence_status}.`).join('\n\n')+'\n\n';
  output.body=output.body.replace('## Heat-capacity chart',notes+'## Heat-capacity chart');
 }
 const masterPath=`${dir}/data/structured/${stem}.yaml`;
 if(curatedSubject){
  const mainPath=`${dir}/${stem}.md`,main=read(mainPath);
  const start='<!-- NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->',end='<!-- /NIST-THERMOCHEMISTRY-CURATED-SUPPLEMENT -->';
  const intervals=item.heat_capacity_fits.map(f=>`${f.phase_label_as_reported}: ${f.temperature_range.min}–${f.temperature_range.max} K`).join('; ');
  const scopeNote=curatedSubject.object_class==='ATOM'?`Molecular spin-isomer scope is **NOT-APPLICABLE-TO-MONATOMIC-SPECIES**. Isotopic composition is **UNSPECIFIED-IN-RETAINED-FIT**. These monatomic gas-species fits do not supply dimer data, infer an isotope mixture or establish cryogenic equilibrium, a superfluid transition or a phase envelope.`:`Spin-isomer scope and isotopic composition are **UNSPECIFIED-IN-RETAINED-FIT**. These gas-species fits do not substitute atomic data, infer a normal/para/ortho mixture, calculate dissociation or establish a cryogenic phase envelope.`;
  const block=`${start}\n[${item.name} thermal functions](${stem}-Thermochemistry.md) adds ${item.heat_capacity_fits.length} source-bound NIST Shomate fits for **${curatedSubject.object_ref}** (${curatedSubject.object_class}), defined by the unchanged [canonical owner](${subjectOwnerLink}) at \`${curatedSubject.owner.pointer}\`.${parentIdentityNote} Source: **${item.source_id}**, retrieved ${item.retrieved}. Basis: **${item.molar_basis}**; ${atomCount} ${atomCount===1?'atom':'atoms'} per source formula. Valid source intervals: ${intervals}.\n\n${scopeNote} Published fit limits forbid extrapolation. Calculated uncertainty remains UNKNOWN; wider thermal properties remain PARTIAL. This additive supplement preserves the authored parent, its metadata and existing scientific classifications.\n\n![${item.name} heat capacity by phase and valid source temperature interval](graphs/${path.basename(graphPath)})\n${end}`;
  outputs.push({file:mainPath,body:appendApprovedBlock(main,start,end,block),before:main});
 }else{
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
 }
 for(const [kind,key,identifier,entry]of [
  ['Table','tables','table_id',{table_id:item.record_id+':TABLE:'+tableSlot,filename:path.basename(tablePath),data_filename:path.basename(csvPath),title:item.name+' calculated thermodynamic functions',status:'GENERATED',evidence_status:'CALCULATED-FROM-PUBLISHED-FIT',source_ids:[item.source_id]}],
  ['Graph','graphs','graph_id',{graph_id:item.record_id+':GRAPH:'+graphSlot,filename:path.basename(graphPath),data_filename:'../../tables/'+path.basename(csvPath),title:item.name+' phase-specific heat capacity',status:'GENERATED',evidence_status:'CALCULATED-FROM-PUBLISHED-FIT',source_ids:[item.source_id]}]]){
   const manifestPath=`${dir}/data/structured/${stem}-${kind}-Manifest.yaml`,manifestText=read(manifestPath),manifest=YAML.parse(manifestText);
   if(!Array.isArray(manifest[key]))throw new Error('Unrecognised manifest layout '+manifestPath);
   const identityKeys=['id','table_id','graph_id'],ownerId=entry[identifier];
   const matches=manifest[key].filter(e=>identityKeys.some(k=>e[k]===ownerId));
   if(matches.length>1)throw new Error('Duplicate manifest slot owners '+ownerId);
   const existing=matches[0];
   if(existing){
    const aliases=identityKeys.map(k=>existing[k]).filter(v=>v!==undefined&&v!==null);
    if(aliases.some(v=>v!==ownerId))throw new Error('Conflicting manifest slot identities '+ownerId);
    const filenames=[existing.filename,existing.file].filter(v=>v!==undefined&&v!==null);
    if(!filenames.length||filenames.some(v=>v!==entry.filename))throw new Error('Manifest slot already owned '+ownerId);
   }
   const targetPath=path.resolve(dir,key,entry.filename);
   for(const other of manifest[key])if(other!==existing&&[other.filename,other.file].some(file=>typeof file==='string'&&path.resolve(dir,key,file)===targetPath))throw new Error('Manifest physical target already owned '+entry.filename);
   if(kind==='Graph'&&fs.existsSync(graphPath)){
    const receipt=receipts.find(r=>r.record_id===item.record_id&&r.chart===graphPath);
    if(!receipt||createHash('sha256').update(fs.readFileSync(graphPath)).digest('hex')!==receipt.chart_sha256)throw new Error('Refusing to overwrite unrecognised or edited chart target '+graphPath);
   }
   if(curatedSubject){
    // The block sequence must be the final root field so appending cannot change authored YAML structure.
    if(Object.keys(manifest).at(-1)!==key||!new RegExp('^'+key+':[ \\t]*\\r?$', 'm').test(manifestText))throw new Error('Curated manifest needs a terminal block sequence '+manifestPath);
    const start=`# NIST-THERMOCHEMISTRY-CURATED-ENTRY ${ownerId}`,end=`# /NIST-THERMOCHEMISTRY-CURATED-ENTRY ${ownerId}`;
    const entryText=YAML.stringify({[key]:[entry]},{lineWidth:120}).replace(new RegExp('^'+key+':\\n'),'').trimEnd();
    const block=start+'\n'+entryText+'\n'+end;
    if(existing&&!isDeepStrictEqual(existing,entry))throw new Error('Refusing to overwrite changed curated manifest entry '+ownerId);
    if(existing&&!manifestText.includes(start))throw new Error('Curated manifest slot lacks its approved append marker '+ownerId);
    if(!existing&&(manifestText.includes(start)||manifestText.includes(end)))throw new Error('Curated manifest append markers have lost their entry '+ownerId);
    const body=appendApprovedBlock(manifestText,start,end,block),parsed=YAML.parse(body);
    const expected={...manifest,[key]:existing?manifest[key]:[...manifest[key],entry]};
    if(!isDeepStrictEqual(parsed,expected))throw new Error('Curated manifest append changed authored structure '+manifestPath);
    outputs.push({file:manifestPath,body,before:manifestText});
   }else{
    const doc=YAML.parseDocument(manifestText);
    if(existing)doc.setIn([key,manifest[key].indexOf(existing)],entry);else doc.get(key).add(entry);
    outputs.push({file:manifestPath,body:doc.toString({lineWidth:120})});
   }
 }
 plots.push({record_id:item.record_id,name:item.name,stem,source_id:item.source_id,retrieved:item.retrieved,molar_basis:item.molar_basis,...(curatedSubject?{subject:curatedSubject}:{}),...(item.asset_slots!==undefined?{asset_slots:item.asset_slots,parent_integration:item.parent_integration}:{}),input:dataPath,csv:csvPath,chart:graphPath,series});
}
for(const gap of catalogue.source_gaps??[]){
 const element=baseline.find(e=>e.z===gap.z);if(element.name!==gap.name)throw new Error('Gap canonical name mismatch');
 const gapDate=gap.reviewed??gap.retrieved,sourceIds=[gap.source_id,gap.coverage_index.source_id].filter(Boolean);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(gapDate??''))throw new Error('Gap review date is missing');
 if(gap.source_formula!==null)elementalFormulaAtoms(gap.source_formula,element.symbol);
 else if(gap.species_identity_status!=='UNRESOLVED')throw new Error('An unresolved lookup cannot assert an elemental identity');
 for(const snapshot of [gap.snapshot,gap.coverage_index.snapshot].filter(Boolean))if(createHash('sha256').update(fs.readFileSync(snapshot.path)).digest('hex')!==snapshot.sha256)throw new Error('Gap source hash mismatch');
 const stem=element.chapterPath.split('/')[1],dir='records/'+stem;
 const dataPath=`${dir}/data/structured/${stem}-Thermochemistry-Source-Review.yaml`,chapter=`${dir}/${stem}-Thermochemistry-Source-Review.md`;
 const extended=gap.source_review_result!=='NO-SHOMATE-IN-RETAINED-PAGE'||gap.coverage_index.element_cell_status;
 const review={registry_id:gap.record_id+':REG:THERMOCHEMISTRY-SOURCE-REVIEW',record_id:gap.record_id,schema_version:'1.0.0',record_version:'1.0.0',
  status:'INSUFFICIENT DATA',source_ids:sourceIds,source_review:gap,
  heat_capacity:{value:null,unit:'J mol^-1 K^-1',status:'INSUFFICIENT DATA',uncertainty:'UNKNOWN',
   reason:extended?'This bounded source review accepts no elemental heat-capacity value or fit. Retrieval and index limitations do not establish absence from the wider literature.':'This source review accepts no elemental heat-capacity value or fit. Absence from these two dated sources is not absence from all literature.'},
  derived_tables_and_charts:'NOT-GENERATED; NO-ACCEPTED-FIT',scientific_completion:'PENDING'};
 add(dataPath,'# '+marker+'\n'+YAML.stringify(review,{lineWidth:120}),{immutable:true});
 const indexStatus=gap.coverage_index.element_cell_status??'UNLINKED';
 const indexNote={UNLINKED:`Its ${gap.name} cell is unlinked.`, 'LINKED-REQUIRES-SEPARATE-REVIEW':`Its ${gap.name} cell links an element-organised PDF. That PDF requires a separate species, phase and molar-basis review; no values from it have been accepted here.`, ABSENT:`No cell matching the canonical ${gap.name} identity was found in this retained index.`}[indexStatus];
 if(!indexNote)throw new Error('Unknown JANAF index review status');
 let gapChapter=`# ${gap.name} — thermal source review and remaining gap\n\n<!-- ${marker} -->\n\n**Heat-capacity fit: INSUFFICIENT DATA in this accession.** The search result is source-specific and does not establish that measurements are absent from the scientific literature. No heat-capacity curve or calculated thermodynamic table has been generated from it.\n\n[Parent record](${stem}.md) · [Structured review](data/structured/${stem}-Thermochemistry-Source-Review.yaml)\n\n## Sources checked\n\n- **${gap.source_id}:** [NIST Chemistry WebBook, elemental ${gap.source_formula}](${gap.snapshot?.url}), retrieved ${gap.retrieved}. The retained page has no Shomate heat-capacity table. [Exact downloaded page](../../${gap.snapshot?.path}).\n- **${gap.coverage_index.source_id}:** [NIST-JANAF PDF catalogue](${gap.coverage_index.snapshot.url}), retrieved ${gap.coverage_index.retrieved}. Its ${gap.name} cell is unlinked and marked inactive. This records the coverage of this dated index. [Exact downloaded index](../../${gap.coverage_index.snapshot.path}).\n\nBoth files retain their original bytes, byte counts and SHA-256 hashes in the structured review. Existing parent-record density and melting/boiling references are preserved; they do not supply a heat-capacity function.\n\n## Next source review\n\n${gap.next_action} Record experimental method, sample purity, phase, temperature/pressure range, stated uncertainty and any reference-state conversions. A compound containing ${gap.name} has a different molar basis and must not be substituted for elemental ${gap.source_formula}. Heat capacity, standard entropy, enthalpy increments and their uncertainties remain UNKNOWN in this supplement until an applicable source is accepted. Wider thermal completion remains pending.\n`;
 if(extended){
  const lookupNote=gap.snapshot?(gap.source_review_result==='NO-MATCH-IN-RETAINED-PAGE'?`- **${gap.source_id}:** [NIST Chemistry WebBook lookup response](${gap.snapshot.url}), retrieved ${gap.retrieved}. The query returned no matching species. The requested formula ${gap.requested_formula} is a search input, not a verified source identity. [Exact downloaded response](../../${gap.snapshot.path}).`:`- **${gap.source_id}:** [NIST Chemistry WebBook, elemental ${gap.source_formula}](${gap.snapshot.url}), retrieved ${gap.retrieved}. The identity-checked page has no Shomate heat-capacity table. [Exact downloaded page](../../${gap.snapshot.path}).`):`- **WebBook lookup: NOT-RETRIEVED.** Reviewed ${gapDate}. No source page, retrieval date or elemental species identity is claimed. Requested formula: ${gap.requested_formula}; returned species: UNKNOWN.${gap.requested_url?` [Requested lookup URL](${gap.requested_url}).`:''}`;
  gapChapter=`# ${gap.name} — thermal source review and remaining gap\n\n<!-- ${marker} -->\n\n**Heat-capacity fit: INSUFFICIENT DATA in this accession.** This bounded source review accepts no heat-capacity value, fit, curve or calculated thermodynamic table. It does not establish absence from the wider scientific literature.\n\n[Parent record](${stem}.md) · [Structured review](data/structured/${stem}-Thermochemistry-Source-Review.yaml)\n\n## Sources checked and retrieval limits\n\n${lookupNote}\n- **${gap.coverage_index.source_id}:** [NIST-JANAF PDF catalogue](${gap.coverage_index.snapshot.url}), retrieved ${gap.coverage_index.retrieved}. ${indexNote} [Exact downloaded index](../../${gap.coverage_index.snapshot.path}).\n\n${gap.scope} Retained files carry their original byte counts and SHA-256 hashes in the structured review. Existing parent-record density and melting/boiling references are preserved; they do not supply a heat-capacity function.\n\n## Next source review\n\n${gap.next_action} Record experimental method, sample purity, phase, temperature/pressure range, stated uncertainty and reference-state conversions. A compound containing ${gap.name} must not be substituted for the elemental species. Heat capacity, entropy, enthalpy increments and their uncertainties remain UNKNOWN until an applicable source is accepted. Wider thermal completion remains pending.\n`;
 }
 add(chapter,gapChapter,{immutable:true});
 const masterPath=`${dir}/data/structured/${stem}.yaml`,mainPath=`${dir}/${stem}.md`;
 const doc=YAML.parseDocument(read(masterPath));
 if(doc.getIn(['thermal','status'])!=='PLANNED')throw new Error('Existing authored thermal data requires manual gap review');
 const parentVersion=doc.get('record_version')==='1.1.1'?'1.1.2':doc.get('record_version');
 const parentUpdated=String(doc.get('updated'))<gapDate?gapDate:String(doc.get('updated'));
 doc.set('record_version',parentVersion);doc.set('updated',parentUpdated);
 doc.setIn(['thermal','source_review_file'],dataPath);doc.setIn(['thermal','source_review_chapter'],chapter);
 doc.setIn(['thermal','source_review_status'],'INSUFFICIENT DATA');
 doc.setIn(['thermal','source_ids'],sourceIds);
 outputs.push({file:masterPath,body:doc.toString({lineWidth:120})});
 let main=read(mainPath).replace(/^record_version:.*$/m,'record_version: "'+parentVersion+'"').replace(/^updated:.*$/m,'updated: "'+parentUpdated+'"');
 main=main.replace(/(\| 1\.0\.0 \|[^\r\n]+)\r?\n\r?\n(\| 1\.1\.0 \|)/,'$1\n$2');
 const revision='| 1.1.2 | '+gapDate+' | Recorded bounded thermal source-availability review; no heat-capacity fit accepted. |';
 if(!main.includes(revision))main=main.replace(/(\| 1\.1\.0 \|[^\r\n]+)/,'$1\n'+revision);
 const start='<!-- NIST-THERMOCHEMISTRY-SOURCE-GAP -->',end='<!-- /NIST-THERMOCHEMISTRY-SOURCE-GAP -->';
 const block=extended?`${start}\n[${gap.name} thermal source review](${stem}-Thermochemistry-Source-Review.md): ${gap.scope} Sources: ${sourceIds.join(', ')}. No heat-capacity value or fit is accepted; applicable primary measurements still need review. Values remain UNKNOWN.\n${end}`:`${start}\n[${gap.name} thermal source review](${stem}-Thermochemistry-Source-Review.md): no Shomate heat-capacity fit was found in this dated WebBook accession; the JANAF index has no linked table. Sources ${gap.source_id} and ${gap.coverage_index.source_id}. Applicable primary measurements still need review. Values remain UNKNOWN; this is not a claim that no measurements exist.\n${end}`;
 if(main.includes(start))main=main.replace(new RegExp(start+'[\\s\\S]*?'+end),block);
 else main=main.replace(/(# 12\. Thermal and Thermodynamic Properties\r?\n)/,'$1\n'+block+'\n');
 if(!main.includes(start))throw new Error('Locked gap thermal heading not found');
 outputs.push({file:mainPath,body:main});
}
// Preflight every target before writing generated data or additive authored links.
for(const {file,sha256}of curatedIdentities)if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==sha256)throw new Error('Curated canonical owner changed during planning '+file);
for(const {file,before}of outputs)if(before!==undefined&&read(file)!==before)throw new Error('Curated authored file changed during planning '+file);
for(const {file,body}of outputs){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);}
fs.mkdirSync('.mat-local',{recursive:true});fs.writeFileSync('.mat-local/thermochemistry-plot-input.json',JSON.stringify(plots,null,2)+'\n');
return {elements:plots.length,source_gaps:catalogue.source_gaps.length,fits:plots.reduce((n,e)=>n+e.series.length,0),calculated_rows:plots.reduce((n,e)=>n+e.series.reduce((s,f)=>s+f.points.length,0),0)};
} finally { process.chdir(previousDirectory); }
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href) {
 const elements=parseThermochemistryArgs(process.argv.slice(2));
 console.log(JSON.stringify(syncThermochemistry({elements})));
}

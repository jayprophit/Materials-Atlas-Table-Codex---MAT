// One explicit read-time bridge; no automatic legacy-value or state inference.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {root} from './lib.mjs';
import {loadOwner,canonicalIdentity,projectObject,validateObject,verifyOwner,hash} from './mat-universal-object.mjs';
import {projectReading,resolvePointer} from './mat-reading.mjs';
import {parseIonisation} from './nist-ionisation.mjs';

export const atomicOwnerPath='records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml';
export const atomicBindingPath='data/research/mat-dashboard-bindings.json';
// These hashes identify the reviewed retained export/definitions, not a new source registry.
export const atomicSourcePaths={
  csv:'data/catalog/sources/nist-asd-ionisation-2026-09-14.csv',
  provenance:'data/catalog/sources/nist-asd-ionisation-2026-09-14.provenance.json',
  help:'data/catalog/sources/nist-asd-ionisation-help-2026-09-14.html'
};
const reviewedHashes={
  csv:'2b7b9f2fd1c38be09452b6650b33e35c1015fcbf91717d64c471314316be64d3',
  provenance:'2fe9c7075590a0c937334c384ac68bbe37f472cfa6e130b98ae5beac42469f5f',
  help:'83da2447e090e3b9833a69f94d807b22cc31958ec388de18f5bf272a0f715e19'
};

export function loadNeutralHydrogen(repoRoot=root){
  const parent=loadOwner(atomicOwnerPath,'',repoRoot),d=parent.document;
  const child=loadOwner(atomicOwnerPath,'/charge_states/1',repoRoot);
  if(child.owner.sha256!==parent.owner.sha256)throw Error('Atomic owner changed between parent and child reads');
  if(canonicalIdentity(d)!=='MAT:0001'||d.symbol!=='H'||d.atomic_number!==1||canonicalIdentity(child.document)!=='MAT:0001:ATOM:H'||child.document.charge!==0)throw Error('Neutral Hydrogen owner/species/charge mismatch');
  const bindings=loadOwner(atomicBindingPath,'',repoRoot);
  const binding=resolvePointer(bindings.document,'/bindings/0');
  const keys=['binding_id','owner','path','pointer','value_key','metric','source_id','unit','object_ref','state','conditions','limitations'];
  if(Object.keys(binding).some(k=>!keys.includes(k))||binding.binding_id!=='hydrogen-first-ionisation'||binding.owner!=='MAT:0001'||binding.path!==atomicOwnerPath||binding.pointer!=='/ionization/first'||binding.value_key!=='value'||binding.metric!=='First ionisation energy'||binding.object_ref!==child.document.id||binding.source_id!=='SRC-000005'||binding.unit!=='eV')throw Error('Unsupported atomic reading binding or pointer/unit/source drift');
  if(!isDeepStrictEqual(binding.limitations,['Preserves the NIST parenthetical theoretical classification already reviewed in the owner.','Not a newly measured value or a fresh independent scientific review.']))throw Error('Reviewed atomic binding limitations changed');
  if(!isDeepStrictEqual(binding.state,{species:'H',charge:0,electronic_state:'1s1; ground state',isotope:'NOT-SPECIFIED-IN-OWNER'})||!isDeepStrictEqual(binding.conditions,{basis:'Ground-state atomic ionisation; not a bulk H2 property',temperature:'NOT-SPECIFIED-IN-OWNER',pressure:'NOT-SPECIFIED-IN-OWNER'}))throw Error('Atomic binding species/charge/state/conditions mismatch');
  if(!isDeepStrictEqual(d.electronic_ground_state,{configuration:'1s1',term:'2S1/2'}))throw Error('Atomic ground-state owner changed');
  const registry=loadOwner('data/registries/sources.yaml','',repoRoot);
  if(registry.document.sources.filter(s=>s.source_id===binding.source_id).length!==1)throw Error('Atomic source ID must be unique');
  const sourceIndex=registry.document.sources.findIndex(s=>s.source_id===binding.source_id);
  const source=registry.document.sources[sourceIndex];
  if(!source||source.source_type!=='EVALUATED-DATABASE'||String(source.version)!=='5.12'||source.doi!=='10.18434/T4W30F'||source.url!=='https://physics.nist.gov/asd'||!source.dated_extractions?.some(e=>e.retrieved==='2026-09-14'&&e.snapshot===atomicSourcePaths.csv&&e.provenance===atomicSourcePaths.provenance&&e.verification_status==='REPRODUCIBLE-SOURCE-EXTRACTION'))throw Error('Atomic source identity/version/type drift');
  const snapshots=Object.fromEntries(Object.entries(atomicSourcePaths).map(([key,path])=>{
    const bytes=readFileSync(resolve(repoRoot,path)),sha256=hash(bytes);
    if(reviewedHashes[key]&&sha256!==reviewedHashes[key])throw Error('Changed reviewed atomic '+key+' snapshot');
    return [key,{path,pointer:'',sha256,bytes}];
  }));
  const metadata=JSON.parse(snapshots.provenance.bytes.toString('utf8'));
  if(metadata.source_id!==source.source_id||metadata.version!=='5.12'||metadata.retrieved!=='2026-09-14'||metadata.doi!==source.doi||metadata.sha256!==snapshots.csv.sha256||metadata.help_snapshot!==atomicSourcePaths.help||metadata.help_url!=='https://physics.nist.gov/PhysRefData/ASD/Html/iehelp.html'||metadata.verification_status!=='REPRODUCIBLE-SOURCE-EXTRACTION')throw Error('Atomic source provenance/version/hash drift');
  const rows=parseIonisation(snapshots.csv.bytes.toString('utf8'));
  const row=rows.find(r=>r.source_line===2),energy=row?.ionisation_energy;
  if(!row||row.z!==1||row.charge!==0||row.spectrum!=='H I'||row.isoelectronic_sequence!=='H'||row.ground_configuration_raw!=='1s'||row.ground_level_raw!=='2S<1/2>'||!isDeepStrictEqual(row.bibliography_keys,['HDEL'])||energy.prefix!=='('||energy.suffix!==')'||energy.evidence_type!=='THEORETICAL'||energy.value_status!=='THEORETICAL')throw Error('Reviewed neutral-H source row context changed');
  const metric=resolvePointer(d,binding.pointer);
  if(metric.evidence_type!=='THEORETICAL'||metric.value_status!=='THEORETICAL'||metric.value!==energy.value||metric.uncertainty!==energy.uncertainty||metric.unit!==energy.unit||metric.source_locator!==atomicSourcePaths.csv+'#line=2')throw Error('Atomic reading value/uncertainty/evidence/source-locator drift');
  const reading=projectReading(binding,d,registry.document);
  const groundPointer='/electronic_ground_state',stateLocator=atomicOwnerPath+'#'+groundPointer;
  const object=projectObject({object_ref:child.document.id,object_class:'ATOM',recognition:'NOT-AN-ELEMENT',owner:child.owner});
  const provenance=[{...parent.owner,pointer:binding.pointer},{...bindings.owner,pointer:'/bindings/0'},...Object.values(snapshots).map(({bytes,...ref})=>ref),{...registry.owner,pointer:'/sources/'+sourceIndex}];
  object.readings=[{metric:'ionization.first',value:reading.value,null_state:null,unit:reading.unit,uncertainty:reading.uncertainty,evidence_type:reading.evidence_type,provenance,state_ref:stateLocator,reference_frame_ref:null,validity:null}];
  object.links=[{relation:'SOURCE',target_ref:source.source_id,evidence_refs:[source.source_id]}];
  validateObject(object);verifyOwner(object,repoRoot);
  return {schema_version:'1.0.0',object,binding_reading:reading,
    state_context:{species:'H',charge:0,electronic_ground_state:{...d.electronic_ground_state,owner:{...parent.owner,pointer:groundPointer}},reading_state_reference_kind:'EXISTING-OWNER-LOCATOR; NOT-A-STATE-IDENTITY',isotope:null,temperature:null,pressure:null,unreported_conditions_status:'UNKNOWN',confidence_level:null,coverage_factor:null,uncertainty_kind:'SOURCE-DISPLAYED-EV; CONFIDENCE-AND-COVERAGE-UNKNOWN',legacy_owner_confidence_label:metric.confidence??null},
    source:{source_id:source.source_id,title:source.title,url:source.url,doi:source.doi,version:metadata.version,retrieved:metadata.retrieved,query_url:metadata.url,help_url:metadata.help_url,snapshots:Object.values(snapshots).map(({bytes,...ref})=>ref),source_locator:metric.source_locator,bibliography_keys:row.bibliography_keys,source_row:row,verification_status:metadata.verification_status,underlying_work_review:'REQUIRES-CLAIM-LEVEL-REVIEW',rights_status:'UNKNOWN',rights_admitted:false},
    acceptance:'SOURCE-BOUND-CANDIDATE; INDEPENDENT-SCIENTIFIC-REVIEW-PENDING',limitations:[...binding.limitations,'NIST ground-state one-electron removal for isolated atomic H; not a molecular H2 or bulk material property.','The existing owner configuration 1s1 corresponds to the retained one-electron 1s source notation; no isotope-resolved or full thermodynamic state is inferred.','NIST displayed eV uncertainty includes conversion-factor uncertainty; no confidence level or coverage factor is inferred from the owner label A.','HDEL remains a source bibliography key; source extraction and software checks do not independently accept the underlying work, scientific claim or reuse rights.']};
}

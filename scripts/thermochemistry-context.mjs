// Validate an explicitly configured subject against its unchanged canonical owner.
import {resolvePointer} from './mat-reading.mjs';
import {createHash} from 'node:crypto';
import YAML from 'yaml';

const masterPathMatch=path=>/^records\/([0-9]{4}-[A-Za-z0-9-]+)\/data\/structured\/\1\.yaml$/.exec(path??'');
const neutralScope='Neutral atomic identity only; no isotope, excitation, medium or measurement condition is implied.';

// Read exact bytes through the caller's repository-bounded reader. The same loader
// supplies both owners to import, validation and publication; it never repairs data.
export function loadThermochemistryContext(item,{identityPath,readBytes}={}){
 const match=masterPathMatch(identityPath);
 if(!match||match[1].slice(0,4)!==item.record_id?.slice(4)||typeof readBytes!=='function')throw new Error('Thermochemistry context loader requires the selected canonical master path and reader');
 const owners=[];
 const load=path=>{
  const bytes=Buffer.from(readBytes(path)),sha256=createHash('sha256').update(bytes).digest('hex');
  owners.push({file:path,sha256});return {document:YAML.parse(bytes.toString('utf8')),sha256};
 };
 const identity=load(identityPath),context={identityDocument:identity.document,identityPath,identitySha256:identity.sha256};
 if(item.subject&&Object.hasOwn(item.subject,'identity_owner')){
  const definitionPath=identityPath.replace(/\.yaml$/,'-Neutral-Atom.yaml');
  if(item.subject.owner?.path!==definitionPath)throw new Error('Thermochemistry definition path must be the same selected neutral-atom owner');
  const definition=load(definitionPath);
  Object.assign(context,{definitionDocument:definition.document,definitionPath,definitionSha256:definition.sha256});
 }
 validateThermochemistryContext(item,context);
 return {...context,owners};
}

function resolveNeutralDefinition(item,subject,context){
 const subjectKeys=['object_ref','object_class','owner','identity_owner','spin_isomer_scope','isotopic_composition'];
 if(Object.keys(subject).length!==subjectKeys.length||!subjectKeys.every(key=>Object.hasOwn(subject,key)))throw new Error('Thermochemistry separate definition subject has unreviewed fields');
 const {identityDocument:parent,identityPath,identitySha256,definitionDocument:definition,definitionPath,definitionSha256}=context;
 const match=masterPathMatch(identityPath),binding=subject.identity_owner,owner=subject.owner;
 const bindingShape=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===3&&['path','pointer','sha256'].every(key=>Object.hasOwn(value,key));
 if(!match||match[1].slice(0,4)!==item.record_id.slice(4)||!bindingShape(binding)||binding.path!==identityPath||!['/identity',''].includes(binding.pointer))throw new Error('Thermochemistry separate parent identity binding mismatch');
 if(!/^[a-f0-9]{64}$/.test(identitySha256??'')||binding.sha256!==identitySha256)throw new Error('Thermochemistry parent identity hash mismatch');
 if(!bindingShape(owner)||owner.path!==identityPath.replace(/\.yaml$/,'-Neutral-Atom.yaml')||owner.path!==definitionPath||owner.pointer!=='/entity')throw new Error('Thermochemistry separate neutral definition path/pointer mismatch');
 if(!/^[a-f0-9]{64}$/.test(definitionSha256??'')||owner.sha256!==definitionSha256)throw new Error('Thermochemistry neutral definition hash mismatch');
 // The empty JSON Pointer explicitly selects the existing root identity family.
 // Never fall back from a missing nested identity or rewrite the stored parent.
 const rootBinding=binding.pointer==='';
 const identity=rootBinding?parent:parent?.identity;
 if(rootBinding){
  if(!parent||parent.mat_id!==item.record_id||parent.record_class!=='CHEMICAL_ELEMENT'||parent.record_id!==undefined&&parent.record_id!==item.record_id||parent.registry_id!==undefined&&parent.registry_id!==item.record_id+':REG:MASTER')throw new Error('Thermochemistry separate canonical root parent identity mismatch');
  if(parent.identity?.proton_count!==parent.atomic_number||parent.identity?.neutral_electron_count!==parent.atomic_number)throw new Error('Thermochemistry root parent proton/neutral-electron identity mismatch');
  for(const key of ['mat_id','atomic_number','symbol'])if(parent.identity?.[key]!==undefined&&parent.identity[key]!==parent[key])throw new Error('Thermochemistry conflicting root/nested identity '+key);
 }else if(!identity||parent.record_id!==item.record_id||parent.registry_id!==item.record_id+':REG:MASTER'||parent.record_class!=='CHEMICAL_ELEMENT'||identity.mat_id!==item.record_id)throw new Error('Thermochemistry separate canonical parent identity mismatch');
 if(identity.atomic_number!==Number(item.record_id.slice(4))||(item.z!==undefined&&item.z!==identity.atomic_number)||typeof identity.symbol!=='string'||!match[1].endsWith('-'+identity.symbol))throw new Error('Thermochemistry separate atomic-number/symbol owner mismatch');
 for(const [key,value]of [['mat_id',item.record_id],['atomic_number',identity.atomic_number],['symbol',identity.symbol]])if(parent[key]!==undefined&&parent[key]!==value)throw new Error('Thermochemistry conflicting root/nested identity '+key);
 const entity=definition?.entity;
 if(subject.object_class!=='ATOM'||!definition||definition.record_id!==item.record_id||definition.registry_id!==item.record_id+':REG:NEUTRAL-ATOM'||definition.provenance?.parent_identity!==item.record_id)throw new Error('Thermochemistry separate neutral definition parent/class mismatch');
 const keys=['atom_id','atomic_number','charge_in_elementary_charge_units','electron_count','derivation','evidence','scope'];
 if(!entity||Array.isArray(entity)||Object.keys(entity).length!==keys.length||!keys.every(key=>Object.hasOwn(entity,key))||entity.atom_id!==subject.object_ref||entity.atomic_number!==identity.atomic_number||entity.charge_in_elementary_charge_units!==0||entity.electron_count!==identity.atomic_number||entity.derivation!=='electron_count = atomic_number - charge_in_elementary_charge_units'||entity.evidence!=='DEFINITIONAL'||entity.scope!==neutralScope)throw new Error('Thermochemistry neutral definition identity/charge/evidence/scope mismatch');
 // This local view interprets only this explicit definition format. It does not
 // rename stored fields or make atom_id a general identity fallback.
 return {identity,declared:{id:entity.atom_id,charge:entity.charge_in_elementary_charge_units,formula:identity.symbol}};
}

export function validateThermochemistryReviewNotes(item){
 const notes=item.review_notes;
 if(notes===undefined)return;
 if(!Array.isArray(notes))throw new Error('Thermochemistry review notes must be an array when supplied');
 const seen=new Set();
 for(const [index,note]of notes.entries()){
  if(!note||typeof note!=='object'||Array.isArray(note))throw new Error('Malformed thermochemistry review note at index '+index);
  for(const field of ['note_id','status','evidence_status','text'])if(typeof note[field]!=='string'||!note[field].trim())throw new Error('Thermochemistry review note requires nonempty '+field+' at index '+index);
  if(seen.has(note.note_id))throw new Error('Duplicate thermochemistry review note ID '+note.note_id);
  seen.add(note.note_id);
 }
}

export function resolveThermochemistryAssetSlots(item){
 if(item.asset_slots===undefined)return {table:10,graph:9};
 const slots=item.asset_slots;
 if(item.parent_integration!=='CURATED-APPEND-ONLY'||!slots||typeof slots!=='object'||Array.isArray(slots)||Object.keys(slots).length!==2||!Object.hasOwn(slots,'table')||!Object.hasOwn(slots,'graph'))throw new Error('Thermochemistry asset slots require reviewed curated table/graph slots');
 for(const key of ['table','graph'])if(!Number.isSafeInteger(slots[key])||slots[key]<1)throw new Error('Thermochemistry asset slot must be a positive safe integer: '+key);
 return {table:slots.table,graph:slots.graph};
}

export function validateThermochemistryContext(item,context={}){
 const {identityDocument,identityPath,identitySha256}=context;
 validateThermochemistryReviewNotes(item);
 resolveThermochemistryAssetSlots(item);
 if(item.parent_integration===undefined&&item.subject===undefined)return null;
 if(item.parent_integration!=='CURATED-APPEND-ONLY')throw new Error('Unsupported thermochemistry parent integration');
 const subject=item.subject;
 if(!subject||typeof subject!=='object'||Array.isArray(subject))throw new Error('Curated thermochemistry requires an explicit subject');
 // An atom/molecule identity does not bind a condensed phase or allotrope.
 // Keep this adapter bounded to gas until a separate phase-binding contract is reviewed.
 if(!Array.isArray(item.heat_capacity_fits)||!item.heat_capacity_fits.length||Array.from(item.heat_capacity_fits).some(fit=>fit?.phase!=='GAS'))throw new Error('Curated thermochemistry species context is GAS-only; an explicit phase binding is required for other phases');
 if(!identityDocument||!/^MAT:[0-9]{4}$/.test(item.record_id??'')||(identityDocument.mat_id??identityDocument.record_id)!==item.record_id)throw new Error('Thermochemistry subject canonical owner mismatch');
 let identity=identityDocument,declared;
 if(Object.hasOwn(subject,'identity_owner')){
  ({identity,declared}=resolveNeutralDefinition(item,subject,context));
 }else{
 const owner=subject.owner,match=masterPathMatch(identityPath);
 if(!owner||typeof owner!=='object'||Array.isArray(owner)||!match||match[1].slice(0,4)!==item.record_id.slice(4)||owner.path!==identityPath)throw new Error('Thermochemistry subject identity path mismatch');
 if(identityDocument.atomic_number!==Number(item.record_id.slice(4))||(item.z!==undefined&&item.z!==identityDocument.atomic_number))throw new Error('Thermochemistry subject atomic-number owner mismatch');
 if(!/^[a-f0-9]{64}$/.test(identitySha256??'')||owner.sha256!==identitySha256)throw new Error('Thermochemistry subject identity hash mismatch');
 if(typeof owner.pointer!=='string'||!owner.pointer.startsWith('/'))throw new Error('Thermochemistry subject identity pointer is required');
 try{declared=resolvePointer(identityDocument,owner.pointer);}catch{throw new Error('Thermochemistry subject identity pointer does not resolve');}
 }
 if(!declared||typeof declared!=='object'||Array.isArray(declared)||declared.id!==subject.object_ref)throw new Error('Thermochemistry subject identity mismatch');
 const namespace={MOLECULE:'MOL',ATOM:'ATOM'}[subject.object_class];
 if(!namespace||typeof subject.object_ref!=='string'||!subject.object_ref.startsWith(item.record_id+':'+namespace+':')||!new RegExp('^'+item.record_id+':'+namespace+':[A-Za-z0-9+-]+$').test(subject.object_ref))throw new Error('Thermochemistry subject namespace/class mismatch');
 const formula=item.source_formula??item.species?.source_formula,basis=item.molar_basis??item.species?.molar_basis,count=item.atoms_per_source_formula??item.species?.atoms_per_source_formula;
 if(item.source_formula!==undefined&&item.species?.source_formula!==undefined&&item.source_formula!==item.species.source_formula)throw new Error('Thermochemistry subject formula aliases disagree');
 if(item.molar_basis!==undefined&&item.species?.molar_basis!==undefined&&item.molar_basis!==item.species.molar_basis)throw new Error('Thermochemistry subject molar basis aliases disagree');
 if(item.atoms_per_source_formula!==undefined&&item.species?.atoms_per_source_formula!==undefined&&item.atoms_per_source_formula!==item.species.atoms_per_source_formula)throw new Error('Thermochemistry subject atom-count aliases disagree');
 const parsed=typeof formula==='string'&&/^([A-Z][a-z]?)([1-9][0-9]*)?$/.exec(formula),atoms=parsed?Number(parsed[2]??1):NaN;
 if(!parsed||parsed[1]!==identity.symbol||parsed[2]==='1'||!Number.isSafeInteger(atoms)||count!==atoms||basis!=='mol '+formula||subject.object_ref!==`${item.record_id}:${namespace}:${formula}`)throw new Error('Thermochemistry subject elemental species/molar basis mismatch');
 if(subject.object_class==='MOLECULE'){
  if(atoms<2||declared.formula!==formula)throw new Error('Thermochemistry molecular subject formula mismatch');
 }else if(atoms!==1||declared.charge!==0||(declared.formula??identity.symbol)!==formula)throw new Error('Thermochemistry atomic subject formula/charge mismatch');
 const spinScope=subject.object_class==='ATOM'?'NOT-APPLICABLE-TO-MONATOMIC-SPECIES':'UNSPECIFIED-IN-RETAINED-FIT';
 if(subject.spin_isomer_scope!==spinScope||subject.isotopic_composition!=='UNSPECIFIED-IN-RETAINED-FIT')throw new Error('Thermochemistry subject spin/isotope scope is incompatible with the source species');
 return subject;
}

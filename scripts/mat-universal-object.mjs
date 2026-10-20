import {readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import YAML from 'yaml';
import {root,recordDirs,validateSchema} from './lib.mjs';
import {resolvePointer} from './mat-reading.mjs';
import {validateComposition} from './mat-composition.mjs';

export const universalSchema='data/schema/1.0.0/mat-universal-object.schema.json';
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function canonicalIdentity(document) {
  const ids=[document.mat_id,document.record_id,document.entry_id,document.id,document.material_id,document.process_id,document.sample_id,document.identity?.mat_id].filter(v=>v!==undefined);
  if(new Set(ids).size!==1)throw Error('Missing or conflicting canonical identities');
  return ids[0];
}
export function loadOwner(path,pointer='',repoRoot=root) {
  const absolute=resolve(repoRoot,path),rel=relative(repoRoot,absolute);
  if(isAbsolute(rel)||rel==='..'||rel.startsWith('../')||rel.startsWith('..\\'))throw Error('Owner must remain inside repository');
  const bytes=readFileSync(absolute),text=bytes.toString('utf8');
  const doc=path.endsWith('.json')?JSON.parse(text):path.endsWith('.yaml')?YAML.parse(text):null;
  if(!doc)throw Error('Owner must be JSON or YAML');
  return {document:pointer?resolvePointer(doc,pointer):doc,owner:{path,pointer,sha256:hash(bytes)}};
}

// No numeric values are copied automatically from permissive legacy records.
export function projectObject({object_ref,object_class,recognition,atomic_number=null,owner}) {
  const value={schema_version:'1.0.0',object_ref,object_class,recognition,atomic_number,owner,
    state:{state_ref:null,conditions:[],reference_frame_ref:null,time_ref:null,scale:null,validity:null,status:'UNRESOLVED'},
    readings:[],composition:null,process_genome:[],links:[],
    layers:{MAT_RAW:'OWNER-REFERENCES-ONLY',MAT_VECTOR:'NOT-COMPUTED',MAT_FINGERPRINT:'NOT-COMPUTED'},
    requirement_profile:'docs/02-data/01-Universal-Schema.md'};
  validateObject(value);
  return value;
}

export function validateObject(value) {
  const errors=validateSchema(universalSchema,value);
  if(errors.length)throw Error(errors.join('; '));
  const parent=value.object_ref.match(/^MAT:(\d+)$/),candidate=value.object_ref.match(/^MAT-PROPOSED:(\d+)$/);
  const element=value.object_class==='CHEMICAL_ELEMENT';
  if(value.object_class==='FOUNDATION_REFERENCE') {
    if(value.object_ref!=='MAT:0000'||value.recognition!=='FOUNDATION'||value.atomic_number!==null)throw Error('Foundation is not a chemical element');
  } else if(element) {
    if(value.recognition==='RECOGNISED' ? !parent||Number(parent[1])!==value.atomic_number : value.recognition!=='PROPOSED-NOT-RECOGNISED'||!candidate||Number(candidate[1])!==value.atomic_number)throw Error('Element identity/recognition mismatch');
    if(value.recognition==='RECOGNISED'&&!loadOwner('data/catalog/elements-baseline.json').document.elements.some(e=>e.matId===value.object_ref&&e.z===value.atomic_number))throw Error('Identity absent from recognised catalogue');
  } else if(value.recognition!=='NOT-AN-ELEMENT'||value.atomic_number!==null||parent||candidate)throw Error('Non-element objects require canonical child identifiers');
  if(value.object_class==='ATOM'&&!/^MAT:\d+:ATOM:[A-Za-z0-9_+.-]+$/.test(value.object_ref))throw Error('Atom requires an existing atomic child namespace');
  if(value.object_ref==='MAT:0000'&&value.object_class!=='FOUNDATION_REFERENCE')throw Error('Origin must remain foundation');
  if(value.state.status==='EXPLICIT-CANDIDATE'&&!value.state.state_ref)throw Error('Explicit state reference required');
  const readings=[...value.readings,...value.state.conditions,...value.process_genome.flatMap(s=>s.parameters)];
  for(const r of readings) {
    if((r.value===null)!==(r.null_state!==null))throw Error('Zero and null states must remain distinct');
    if(r.value!==null&&!Number.isFinite(r.value))throw Error('Reading must be finite');
    if(r.uncertainty!==null&&!Number.isFinite(r.uncertainty))throw Error('Uncertainty must be finite');
    if(r.uncertainty_context&&(!Number.isFinite(r.uncertainty_context.confidence_level)||(r.uncertainty_context.coverage_factor!==null&&!Number.isFinite(r.uncertainty_context.coverage_factor))))throw Error('Expanded uncertainty context must be finite');
    if(r.value===null&&(r.evidence_type==='MEASURED'||r.uncertainty!==null))throw Error('Missing data cannot be a measured value');
    if(r.source_value_status!==undefined) {
      if(!r.component_ref||r.evidence_type!=='EVALUATED')throw Error('Source value status requires a component reference and evaluated evidence');
      if(r.source_value_status==='INFORMATION'&&r.uncertainty!==null)throw Error('Information values must retain unknown uncertainty');
      if(r.uncertainty!==null&&!r.uncertainty_context)throw Error('Source value uncertainty requires expanded uncertainty context');
    }
    if(/^(position|speed|velocity|acceleration|jerk|angular[._-]|time[._-]dilation)/.test(r.metric)&&!r.reference_frame_ref)throw Error('Dynamics require an explicit reference frame');
  }
  if(value.composition)validateComposition(value.composition);
  return value;
}

export function buildUniversalObjects(repoRoot=root) {
  if(repoRoot!==root)throw Error('Catalogue adapter currently reads the canonical repository only');
  const objects=[];
  const recognised=loadOwner('data/catalog/elements-baseline.json').document.elements;
  for(const stem of recordDirs()) {
    const {document:d,owner}=loadOwner(`records/${stem}/data/structured/${stem}.yaml`);
    const id=canonicalIdentity(d),foundation=id==='MAT:0000';
    const z=d.atomic_number??d.identity?.atomic_number;
    if(foundation&&(d.identity?.chemical_element!==false||d.record_class!=='FOUNDATION_REFERENCE'))throw Error('Canonical foundation changed');
    if(id==='MAT:0001'&&(d.record_name!=='Hydrogen'||d.symbol!=='H'||z!==1))throw Error('Canonical Hydrogen changed');
    if(!foundation&&!recognised.some(e=>e.matId===id&&e.z===z))throw Error('Identity absent from recognised catalogue');
    objects.push(projectObject({object_ref:id,object_class:d.record_class,recognition:foundation?'FOUNDATION':'RECOGNISED',atomic_number:foundation?null:z,owner}));
  }
  const proposed=loadOwner('data/catalog/proposed-elements-index.json').document;
  for(const entry of proposed.entries) {
    const {document:d,owner}=loadOwner(entry.path);
    if(d.entry_id!==entry.entry_id||d.atomic_number!==entry.z||d.recognition_status!=='PROPOSED-NOT-RECOGNISED')throw Error('Proposed catalogue identity mismatch');
    objects.push(projectObject({object_ref:d.entry_id,object_class:'CHEMICAL_ELEMENT',recognition:d.recognition_status,atomic_number:d.atomic_number,owner}));
  }
  // First real non-element round trip uses its existing owner, not a new molecule record.
  const {document:h2,owner}=loadOwner('records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml','/molecular_states/H2');
  objects.push(projectObject({object_ref:h2.id,object_class:'MOLECULE',recognition:'NOT-AN-ELEMENT',owner}));
  // A source-bound alloy owner uses the same contract; its reviewed numeric
  // projection is explicitly loaded by mat-material, never inferred here.
  const material=loadOwner('records/0026-Iron-Fe/data/properties/0026-Iron-Fe-SRM-126c.yaml');
  objects.push(projectObject({object_ref:canonicalIdentity(material.document),object_class:material.document.object_class,recognition:'NOT-AN-ELEMENT',owner:material.owner}));
  // Existing neutral atomic H is distinct from its elemental parent and H2.
  // Its source-bound numeric view is loaded explicitly by mat-atomic.
  const atom=loadOwner('records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml','/charge_states/1');
  if(atom.document.id!=='MAT:0001:ATOM:H'||atom.document.charge!==0)throw Error('Canonical neutral Hydrogen changed');
  objects.push(projectObject({object_ref:canonicalIdentity(atom.document),object_class:'ATOM',recognition:'NOT-AN-ELEMENT',owner:atom.owner}));
  if(new Set(objects.map(o=>o.object_ref)).size!==objects.length)throw Error('Duplicate universal object');
  return objects;
}

export function verifyOwner(object,repoRoot=root) {
  validateObject(object);
  const {document,owner}=loadOwner(object.owner.path,object.owner.pointer,repoRoot);
  if(owner.sha256!==object.owner.sha256)throw Error('Stale owner hash');
  if(canonicalIdentity(document)!==object.object_ref)throw Error('Unresolved canonical object reference');
  if(object.object_class==='ATOM'&&document.charge!==0)throw Error('Neutral atom owner requires charge zero');
  return true;
}

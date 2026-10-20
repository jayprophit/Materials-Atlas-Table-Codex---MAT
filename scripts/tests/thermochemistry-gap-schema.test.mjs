import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import Ajv from 'ajv';
import YAML from 'yaml';
const root=resolve(import.meta.dirname,'../..');
const schema=JSON.parse(readFileSync(resolve(root,'data/schema/1.0.0/thermochemistry-source-review.schema.json'),'utf8'));
const validate=new Ajv({allErrors:true}).compile(schema);
const original=YAML.parse(readFileSync(resolve(root,'records/0033-Arsenic-As/data/structured/0033-Arsenic-As-Thermochemistry-Source-Review.yaml'),'utf8'));

test('gap review schema preserves old reviews and distinguishes lookup absence from asserted identity',()=>{
 assert.ok(validate(original),JSON.stringify(validate.errors));
 const missing=structuredClone(original);
 Object.assign(missing.source_review,{source_review_result:'NO-MATCH-IN-RETAINED-PAGE',source_formula:null,requested_formula:'As',species_identity_status:'UNRESOLVED'});
 assert.ok(validate(missing),JSON.stringify(validate.errors));
 missing.source_review.source_formula='As';assert.equal(validate(missing),false,'A failed lookup must not assert a returned elemental formula.');
});

test('unretrieved gap schema accepts only actual index evidence and explicit null retrieval',()=>{
 const missing=structuredClone(original);missing.source_ids=['SRC-000341'];
 Object.assign(missing.source_review,{source_review_result:'LOOKUP-NOT-RETRIEVED',source_id:null,snapshot:null,retrieved:null,reviewed:'2026-10-05',source_formula:null,requested_formula:'As',species_identity_status:'UNRESOLVED',retrieval_status:'NOT-RETRIEVED'});
 assert.ok(validate(missing),JSON.stringify(validate.errors));
 missing.source_review.retrieved='2026-10-05';assert.equal(validate(missing),false,'A review date is not a successful retrieval date.');
 missing.source_review.retrieved=null;missing.source_review.snapshot=original.source_review.snapshot;assert.equal(validate(missing),false);
});

test('linked index reviews remain pending and cannot contain a fake zero heat-capacity value',()=>{
 const linked=structuredClone(original);linked.source_review.coverage_index.element_cell_status='LINKED-REQUIRES-SEPARATE-REVIEW';
 assert.ok(validate(linked),JSON.stringify(validate.errors));
 linked.heat_capacity.value=0;assert.equal(validate(linked),false);
 linked.heat_capacity.value=null;linked.scientific_completion='COMPLETE';assert.equal(validate(linked),false);
});

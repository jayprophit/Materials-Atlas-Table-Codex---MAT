import {test} from 'node:test';
import assert from 'node:assert/strict';
import {substantive,domains} from '../advanced-domains.mjs';
test('completeness detector does not count sourced nulls or planned status as numeric coverage',()=>{
 assert.equal(substantive({value:null,source_id:'SRC-000005',unit:'eV',status:'UNKNOWN'}),false);
 assert.equal(substantive({status:'PLANNED',note:'future review',source_id:'SRC-000005'}),false);
 for(const value of ['UNKNOWN','NOT-APPLICABLE','INSUFFICIENT DATA','PLANNED','PENDING',''])assert.equal(substantive(value),false);
 assert.equal(substantive({value:0,unit:'C'}),true);
 assert.equal(substantive({value:13.6,unit:'eV'}),true);
 assert.equal(domains.length,36);assert.equal(new Set(domains.map(d=>d.id)).size,36);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareQuantity} from '../reference-metrics.mjs';
const q=(value,uncertainty,state_id)=>({property:'temperature',unit:'K',value,uncertainty,state_id});
test('reference differences preserve covariance and defined dimensionless scaling',()=>{
 const r=compareQuantity({observation:q(25,2,'sample'),reference:q(20,1,'baseline'),covariance:1,scale:{value:5,unit:'K',exact_by_definition:true}});
 assert.equal(r.value,5);assert.equal(r.uncertainty,Math.sqrt(3));assert.equal(r.normalised.value,1);
});
test('unknown covariance is not silently treated as independence',()=>{
 const r=compareQuantity({observation:q(25,2,'sample'),reference:q(20,1,'baseline')});assert.equal(r.uncertainty,null);
 assert.throws(()=>compareQuantity({observation:q(null,2,'sample'),reference:q(20,1,'baseline')}));
});
test('comparison rejects mismatched units, impossible covariance and uncertain scale',()=>{
 assert.throws(()=>compareQuantity({observation:q(25,2,'sample'),reference:{...q(20,1,'baseline'),unit:'degC'}}));
 assert.throws(()=>compareQuantity({observation:q(25,2,'sample'),reference:q(20,1,'baseline'),covariance:3}));
 assert.throws(()=>compareQuantity({observation:q(25,2,'sample'),reference:q(20,1,'baseline'),scale:{value:5,unit:'K'}}));
});

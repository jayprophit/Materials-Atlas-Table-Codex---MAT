import test from 'node:test';import assert from 'node:assert/strict';import {systematicElement} from '../proposed-elements.mjs';
test('systematic names match IUPAC examples and elision rules without claiming discovery',()=>{
 for(const [z,name,symbol]of [[119,'Ununennium','Uue'],[120,'Unbinilium','Ubn'],[121,'Unbiunium','Ubu'],[122,'Unbibium','Ubb'],[123,'Unbitrium','Ubt'],[180,'Unoctnilium','Uon'],[188,'Unoctoctium','Uoo'],[190,'Unennilium','Uen'],[900,'Ennilnilium','Enn']])assert.deepEqual(systematicElement(z),{name,symbol});
 const names=Array.from({length:70},(_,i)=>systematicElement(i+119));assert.equal(new Set(names.map(x=>x.symbol)).size,70);
 for(const invalid of [0,100,118.5,1000,'119'])assert.throws(()=>systematicElement(invalid));
});

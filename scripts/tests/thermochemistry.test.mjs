import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {shomate,fitSamples} from '../thermochemistry.mjs';
const data=JSON.parse(readFileSync(new URL('../../data/catalog/thermochemistry-evaluation-index.json',import.meta.url),'utf8'));

test('all source fits satisfy thermodynamic derivative identities within numerical tolerance',()=>{
 for(const element of data.elements)for(const fit of element.heat_capacity_fits){
  const T=(fit.temperature_range.min+fit.temperature_range.max)/2,epsilon=.001;
  const a=shomate(fit,T-epsilon),b=shomate(fit,T+epsilon),c=shomate(fit,T);
  const dH=(b.enthalpy_increment_kJ_mol-a.enthalpy_increment_kJ_mol)*1000/(2*epsilon);
  const dS=(b.entropy_J_mol_K-a.entropy_J_mol_K)/(2*epsilon);
  assert.ok(Math.abs(dH-c.heat_capacity_J_mol_K)<1e-5,fit.fit_id+' dH/dT');
  assert.ok(Math.abs(dS-c.heat_capacity_J_mol_K/T)<1e-7,fit.fit_id+' dS/dT');
 }
});

test('out-of-range temperatures and missing coefficients fail instead of extrapolating',()=>{
 const al=data.elements.find(e=>e.z===13),solid=al.heat_capacity_fits.find(f=>f.phase==='SOLID');
 for(const T of [0,-1,NaN,Infinity,933.2,297.99])assert.throws(()=>shomate(solid,T),RangeError);
 assert.ok(al.heat_capacity_fits.every(f=>933.2<f.temperature_range.min||933.2>f.temperature_range.max));
 const bad=structuredClone(solid);delete bad.coefficients.H;assert.throws(()=>shomate(bad,500),TypeError);
 assert.throws(()=>fitSamples(solid,0),RangeError);
 assert.equal(shomate(solid,500).uncertainty,'UNKNOWN');
});

test('overlapping allotropes and molecular chlorine retain separate source identities',()=>{
 const phosphorus=data.elements.find(e=>e.z===15).heat_capacity_fits.filter(f=>f.phase==='SOLID');
 assert.equal(phosphorus.length,4);assert.equal(new Set(phosphorus.map(f=>f.phase_label_as_reported)).size,4);
 assert.ok(phosphorus.every(f=>f.temperature_range.min===298&&f.temperature_range.max===317.3));
 const calcium=data.elements.find(e=>e.z===20).heat_capacity_fits.filter(f=>f.phase==='SOLID');
 assert.equal(calcium.length,3);assert.equal(calcium.filter(f=>f.phase_label_as_reported==='β phase').length,2);
 const chlorine=data.elements.find(e=>e.z===17);assert.equal(chlorine.molar_basis,'mol Cl2');assert.equal(chlorine.atoms_per_source_formula,2);
 assert.ok(shomate(chlorine.heat_capacity_fits[0],300).heat_capacity_J_mol_K>30);
});

test('transition-metal alternatives and a no-fit source review preserve their distinct meanings',()=>{
 const ti=data.elements.find(e=>e.z===22).heat_capacity_fits.filter(f=>f.phase==='SOLID');
 assert.deepEqual(ti.map(f=>f.phase_label_as_reported),['α phase','α phase','β phase']);
 assert.equal(ti.filter(f=>f.temperature_range.min<=500&&f.temperature_range.max>=500).length,2);
 const iron=data.elements.find(e=>e.z===26).heat_capacity_fits.filter(f=>f.phase==='SOLID');
 assert.equal(iron.filter(f=>f.phase_label_as_reported==='α-δ phase').length,4);
 assert.equal(iron.filter(f=>f.phase_label_as_reported==='γ phase').length,1);
 assert.equal(iron.filter(f=>f.temperature_range.min<=1000&&f.temperature_range.max>=1000).length,2);
 const mn=data.elements.find(e=>e.z===25).heat_capacity_fits.filter(f=>f.phase==='SOLID');
 assert.equal(mn.length,4);assert.ok(mn.every(f=>f.phase_label_as_reported==='UNSPECIFIED-IN-FIT-TABLE'));
 const scandium=data.source_gaps.find(e=>e.z===21);
 assert.equal(scandium.fit_count,0);assert.equal(scandium.heat_capacity_status,'INSUFFICIENT DATA');
 assert.ok(!data.elements.some(e=>e.z===21));
 assert.equal(data.elements.find(e=>e.z===13).retrieved,'2026-09-28');
 assert.equal(data.elements.find(e=>e.z===28).retrieved,'2026-09-29');
});

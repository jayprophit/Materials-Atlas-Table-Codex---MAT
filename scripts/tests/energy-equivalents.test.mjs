import {test} from 'node:test';
import assert from 'node:assert/strict';
import {energyEquivalents} from '../energy-equivalents.mjs';
const constants={speed_of_light:{value:299792458},Planck_constant:{value:6.62607015e-34},elementary_charge:{value:1.602176634e-19}};
test('1 eV energy equivalents and uncertainty propagation retain input evidence',()=>{
 const r=energyEquivalents({value:1,uncertainty:0.01,value_status:'THEORETICAL'},constants);
 assert(Math.abs(r.frequency.value/2.417989242084918e14-1)<1e-14);
 assert(Math.abs(r.vacuum_wavelength.value/1.2398419843320026e-6-1)<1e-14);
 assert.equal(r.frequency.uncertainty/r.frequency.value,0.01);
 assert(Math.abs(r.vacuum_wavelength.uncertainty/r.vacuum_wavelength.value-0.01)<1e-16);
 assert.equal(r.input_value_status,'THEORETICAL');
});
test('unknown energies and unknown uncertainty produce no invented precision',()=>{
 assert.equal(energyEquivalents({value:null},constants).frequency,null);
 assert.equal(energyEquivalents({value:1,uncertainty:null,value_status:'SEMIEMPIRICAL'},constants).frequency.uncertainty,null);
 assert.throws(()=>energyEquivalents({value:0,uncertainty:0},constants));
});

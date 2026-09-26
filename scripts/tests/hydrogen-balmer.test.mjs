import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {hydrogenStrong,parseHydrogenBalmer} from '../hydrogen-balmer.mjs';
const raw=readFileSync(hydrogenStrong,'utf8');
test('visible Balmer rows retain distinct air fine components and UNKNOWN uncertainties',()=>{
 const e=parseHydrogenBalmer(raw);assert.equal(e.length,8);assert.equal(e[0].wavelength.value,410.174);assert.equal(e[3].wavelength.value,486.1287);assert.equal(e[7].wavelength.value,656.28518);
 assert.equal(e.filter(x=>x.member==='alpha').length,3);assert.equal(e.filter(x=>x.member==='beta').length,3);
 assert(e.every(x=>x.wavelength.uncertainty===null&&x.wavelength.medium==='AIR'));
 assert.throws(()=>parseHydrogenBalmer(raw.replace('>Air<br>Wavelength (&Aring;)','>Vacuum<br>Wavelength (&Aring;)')));
 assert.throws(()=>parseHydrogenBalmer(raw.replace('name="4101.74"','name="bad"')));
});

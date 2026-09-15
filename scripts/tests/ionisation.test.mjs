import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseIonisation,csvFields} from '../nist-ionisation.mjs';
const raw=readFileSync(new URL('../../data/catalog/sources/nist-asd-ionisation-2026-09-14.csv',import.meta.url),'utf8');
test('NIST reference values retain theoretical, semiempirical and unknown semantics',()=>{
 const rows=parseIonisation(raw),find=(z,q)=>rows.find(r=>r.z===z&&r.charge===q);
 assert.equal(rows.length,6019);
 assert.equal(find(1,0).ionisation_energy.raw,'13.598434599702');
 assert.equal(find(1,0).ionisation_energy.evidence_type,'THEORETICAL');
 assert.equal(find(2,0).ionisation_energy.raw,'24.587389011');
 assert.equal(find(13,0).ionisation_energy.value,5.985769);
 assert.equal(find(13,1).ionisation_energy.value,18.82855);
 assert.equal(find(13,2).ionisation_energy.value,28.447642);
 assert.equal(find(13,5).ionisation_energy.value_status,'SEMIEMPIRICAL');
 assert.equal(find(110,107).ionisation_energy.value,null);
 assert.equal(find(110,107).ionisation_energy.null_state,'UNKNOWN');
 assert.equal(rows.some(r=>r.z>=111),false);
 const sourceLines=raw.split(/\r?\n/);for(const row of rows)assert.equal(sourceLines[row.source_line-1],row.source_row);
});
test('CSV parser treats formula wrappers as inert strings and retains quoted bibliography commas',()=>{
 assert.deepEqual(csvFields('"=""1""","=""L1,L2""",'),['1','L1,L2','']);
 assert.deepEqual(csvFields('"=SUM(A1)",'),['=SUM(A1)','']);
 assert.throws(()=>csvFields('"unclosed'));
});
test('NIST parser rejects wrong units, duplicate states, malformed numbers and truncated exports',()=>{
 assert.throws(()=>parseIonisation(raw.replace('Ionization Energy (b) (eV)','Ionization Energy (b) (cm-1)')));
 const lines=raw.split(/\r?\n/);assert.throws(()=>parseIonisation([lines[0],lines[1],lines[1],'Notes:'].join('\n')));
 assert.throws(()=>parseIonisation(raw.replace('13.598434599702','NaN')));
 assert.throws(()=>parseIonisation(raw.split('Notes:')[0]));
});

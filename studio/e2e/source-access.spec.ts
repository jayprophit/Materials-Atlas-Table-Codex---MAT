import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('dated scientific source files resolve as original bytes in the standalone publication',async({request})=>{
 const path='data/catalog/sources/nist-asd-ionisation-2026-09-14.csv';
 const expected=readFileSync(new URL('../../'+path,import.meta.url));
 const response=await request.get('/'+path);
 expect(response.status()).toBe(200);
 expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(createHash('sha256').update(expected).digest('hex'));
 const constants=await request.get('/data/constants/si-defining-constants.yaml');
 expect(constants.status()).toBe(200);expect(await constants.text()).toContain('6.62607015e-34');
 const matrix=await request.get('/data/quality/advanced-completion-matrix.json');
 expect(matrix.status()).toBe(200);expect((await matrix.json()).records).toHaveLength(119);
});

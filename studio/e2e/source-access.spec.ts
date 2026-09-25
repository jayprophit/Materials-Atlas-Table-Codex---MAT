import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('dated scientific source files resolve as original bytes in the standalone publication',async({request})=>{
 for(const path of ['data/catalog/sources/nist-asd-ionisation-2026-09-14.csv','data/catalog/sources/ame2020-mass_1.mas20.txt','data/catalog/sources/ame2020-rct1.mas20.txt']){
 const expected=readFileSync(new URL('../../'+path,import.meta.url));
 const response=await request.get('/'+path);
 expect(response.status()).toBe(200);
 expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(createHash('sha256').update(expected).digest('hex'));
 }
 const constants=await request.get('/data/constants/si-defining-constants.yaml');
 expect(constants.status()).toBe(200);expect(await constants.text()).toContain('6.62607015e-34');
 const matrix=await request.get('/data/quality/advanced-completion-matrix.json');
 expect(matrix.status()).toBe(200);expect((await matrix.json()).records).toHaveLength(119);
});

test('reviewed standalone panels and representative scientific charts are served without substitution',async({request})=>{
 const reviews=JSON.parse(readFileSync(new URL('../../data/quality/panel-image-reviews.json',import.meta.url),'utf8'));
 const charts=JSON.parse(readFileSync(new URL('../../data/quality/ionisation-chart-manifest.json',import.meta.url),'utf8'));
 const massCharts=JSON.parse(readFileSync(new URL('../../data/quality/ame2020-chart-manifest.json',import.meta.url),'utf8'));
 const assets=[...reviews.assets.map((a:any)=>({path:a.asset_path,sha256:a.sha256})),
  ...charts.elements.filter((a:any)=>['MAT:0001','MAT:0013','MAT:0092','MAT:0110'].includes(a.record_id)).map((a:any)=>({path:a.chart,sha256:a.sha256})),
  ...massCharts.elements.filter((a:any)=>['MAT:0001','MAT:0013','MAT:0092','MAT:0118'].includes(a.record_id)).map((a:any)=>({path:a.chart,sha256:a.sha256}))];
 for(const asset of assets){
  const response=await request.get('/'+asset.path);
  expect(response.status(),asset.path).toBe(200);
  const bytes=await response.body();
  expect(createHash('sha256').update(bytes).digest('hex'),asset.path).toBe(asset.sha256);
 }
 const plan=await (await request.get('/data/quality/panel-image-plan.json')).json();
 expect(plan.elements.flatMap((e:any)=>e.panels).filter((p:any)=>p.status==='REVIEWED-STANDALONE-ASSET')).toHaveLength(reviews.assets.length);
});

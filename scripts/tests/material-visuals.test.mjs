import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {dirname,join,resolve,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {root} from '../lib.mjs';
import {loadMaterialExample} from '../mat-material.mjs';
import {hash} from '../mat-universal-object.mjs';
import {compileMaterialVisualData,renderMaterialTable,renderMaterialSupplement,materialVisualPaths,
  materialVisualInputs,preflightMaterialVisualOutputs,checkMaterialVisuals} from '../material-visuals.mjs';

function removeFixture(base,prefix) {
  if(dirname(resolve(base))!==resolve(tmpdir())||!basename(base).startsWith(prefix))throw Error('Unexpected test cleanup target');
  rmSync(base,{recursive:true,force:true});
}

test('material visual rows retain source precision, distinct assignments and unknowns',()=>{
  const d=compileMaterialVisualData();
  assert.equal(d.material_ref,'MAT:0026:MATERIAL:NIST-SRM-126c');assert.equal(d.object_class,'ALLOY');
  assert.equal(d.rows.length,11);assert.equal(d.rows.filter(r=>r.status==='CERTIFIED').length,4);
  assert.equal(d.rows.filter(r=>r.status==='REFERENCE').length,6);assert.equal(d.rows.filter(r=>r.status==='INFORMATION').length,1);
  assert.equal(d.rows[0].value_text,'0.02540');assert.equal(d.rows[4].value_text,'0.0080');assert.equal(d.rows[8].value_text,'0.00350');
  assert.equal(d.rows[2].uncertainty_text,'0.029');assert.equal(d.rows[2].coverage_factor,2.8);
  assert.equal(d.rows.at(-1).uncertainty,null);assert.equal(d.rows.at(-1).coverage_factor,null);assert.equal(d.rows.at(-1).confidence_level,null);
  assert.equal(d.coverage,'PARTIAL');assert.equal(d.reported_sum,36.872);assert.equal(d.reported_sum_text,'36.872');
  assert.equal(d.unassigned_identity,'UNKNOWN');assert.equal(d.combined_uncertainty,null);
  assert.equal(d.covariance_status,'NOT-REPORTED');assert.ok(!d.rows.some(r=>r.component_ref==='MAT:0026'));
  assert.equal(d.standalone_panel_credit,0);assert.equal(d.independent_replication,false);
  assert.equal(d.source.sha256,'d107c2ba38d79bceed4075cf17f388ff6378a244f4b04934a96854c0ff3c7f0c');
});

test('ordered preparation retains approximate geometry and unresolved operating conditions',()=>{
  const d=compileMaterialVisualData();
  assert.deepEqual(d.steps.map(s=>s.label),['vacuum melt','cast','roll','lathe']);
  assert.equal(d.process_arrow_meaning,'ORDERED-SOURCE-REPORTED-SEQUENCE');
  assert.equal(d.steps[2].parameters[0].display,'approximately 130 mm');
  assert.equal(d.steps[3].parameters[0].display,'approximately 85 mm');
  assert.equal(d.steps[3].parameters[0].uncertainty,null);
  assert.deepEqual(d.steps[3].output_states,['CHIPS','ROD-REMAINDER']);
  for(const s of d.steps)assert.equal(s.source_locator,'Page 2, Preparation and Analysis');
  for(const field of ['measurement_temperature','process_temperature','process_duration','phase_fractions'])assert.equal(d.applicability[field],null);
});

test('visual compiler rejects altered source values, scope, metrology and sequence',()=>{
  for(const mutate of [
    m=>m.source.certificate_issue='2026-10-04',m=>m.source.url='javascript:alert(1)',m=>m.object.readings[0].value=.1234,
    m=>m.object.readings[0].unit='at%',m=>m.object.readings[4].source_value_status='CERTIFIED',
    m=>m.object.readings[2].uncertainty_context.coverage_factor=1,
    m=>m.object.readings.at(-1).uncertainty=0,m=>m.object.composition.coverage='COMPLETE',
    m=>m.composition_summary.unassigned_identity='MAT:0026',m=>m.composition_summary.combined_uncertainty=0,
    m=>m.applicability.minimum_recommended_analytical_sample.value=100,m=>m.observation_context[0].source_locator='invented',
    m=>m.observation_context[0].analytical_methods[0].description='invented method',m=>m.preparation_history[0].description='invented process',
    m=>m.object.process_genome.reverse(),m=>m.object.process_genome[2].parameters[0].value=100,
    m=>m.object.process_genome[2].parameters[0].uncertainty=0
  ]){const material=loadMaterialExample();mutate(material);assert.throws(()=>compileMaterialVisualData({material}));}
});

test('source-linked text explains units, source assignments, partial coverage and process meaning',()=>{
  const d=compileMaterialVisualData(),table=renderMaterialTable(d),supplement=renderMaterialSupplement(d);
  assert.match(table,/Expanded uncertainty U \/ wt%/);assert.match(table,/Coverage factor k/);
  assert.match(table,/\| Vanadium \(V\) \| MAT:0023 \| 0\.001 \| UNKNOWN \| UNKNOWN \| INFORMATION/);
  assert.match(table,/0\.02540 \| 0\.00068 \| 2\.8 \| CERTIFIED/);
  for(const text of [table,supplement]){
    assert.match(text,/SRC-000346/);assert.match(text,/2017-06-22/);assert.match(text,/https:\/\/tsapps\.nist\.gov\/srmext\/certificates\/126c\.pdf/);
    assert.match(text,/PARTIAL/);assert.match(text,/36\.872 wt%/);assert.match(text,/independent/);
  }
  assert.match(supplement,new RegExp(d.source.sha256));assert.match(supplement,/not evidence of a quantified causal effect/);
  assert.match(supplement,/zero credit/);assert.match(supplement,/different linear scale/);
  assert.ok(!table.includes('| Iron (Fe) |'));
  for(const path of [materialVisualPaths.chart,materialVisualPaths.process]){
    const svg=readFileSync(join(root,path),'utf8');
    assert.ok(svg.includes('xlink:href="'+d.source.url+'"'));assert.ok(svg.includes(d.source.sha256));
  }
});

test('generation preflight preserves edited and unreceipted artifacts',()=>{
  const base=mkdtempSync(join(tmpdir(),'mat-material-preflight-'));
  try{
    writeFileSync(join(base,'owned.svg'),'generated');writeFileSync(join(base,'edited.svg'),'user edit');
    const receipt={artifacts:[{path:'owned.svg',sha256:hash('generated')},{path:'edited.svg',sha256:hash('old')} ]};
    assert.doesNotThrow(()=>preflightMaterialVisualOutputs(['owned.svg','new.svg'],receipt,base));
    assert.throws(()=>preflightMaterialVisualOutputs(['owned.svg','edited.svg'],receipt,base),/Refusing to overwrite/);
    assert.throws(()=>preflightMaterialVisualOutputs(['owned.svg'],null,base),/unreceipted/);
    assert.throws(()=>preflightMaterialVisualOutputs(['../escape.svg'],receipt,base),/inside repository/);
    assert.equal(readFileSync(join(base,'owned.svg'),'utf8'),'generated');assert.equal(readFileSync(join(base,'edited.svg'),'utf8'),'user edit');
  }finally{removeFixture(base,'mat-material-preflight-');}
});

test('read-only receipt check detects stale inputs, modified artifacts and altered evidence scope',()=>{
  const data=compileMaterialVisualData(),actual=checkMaterialVisuals(),base=mkdtempSync(join(tmpdir(),'mat-material-check-'));
  const fixturePath=join(base,materialVisualPaths.receipt);
  try{
    for(const path of [...actual.inputs.map(i=>i.path),...actual.artifacts.map(a=>a.path),materialVisualPaths.receipt]){
      const destination=join(base,path);mkdirSync(dirname(destination),{recursive:true});cpSync(join(root,path),destination);
    }
    assert.doesNotThrow(()=>checkMaterialVisuals({repoRoot:base,data}));
    const chart=join(base,materialVisualPaths.chart),before=readFileSync(chart);
    writeFileSync(chart,Buffer.concat([before,Buffer.from('user annotation')]));
    assert.throws(()=>checkMaterialVisuals({repoRoot:base,data}),/Missing or edited/);
    assert.equal(readFileSync(chart).toString(),before.toString()+'user annotation');writeFileSync(chart,before);
    const input=join(base,actual.inputs[0].path),original=readFileSync(input);writeFileSync(input,Buffer.concat([original,Buffer.from('\n# source edit\n')]));
    assert.throws(()=>checkMaterialVisuals({repoRoot:base,data}),/Stale material visual input/);writeFileSync(input,original);
    const receipt=JSON.parse(readFileSync(fixturePath,'utf8'));receipt.reported_sum_wt_percent=100;
    writeFileSync(fixturePath,JSON.stringify(receipt));assert.throws(()=>checkMaterialVisuals({repoRoot:base,data}),/scope mismatch/);
    assert.deepEqual(materialVisualInputs(data,base),actual.inputs);
  }finally{removeFixture(base,'mat-material-check-');}
});

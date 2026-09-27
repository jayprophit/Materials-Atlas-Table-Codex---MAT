import assert from 'node:assert/strict';import fs from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';import YAML from 'yaml';import {root,R,validateSchema} from './lib.mjs';import {snapshot,dataPath,parseWaterGeometry,constructWater} from './water-geometry.mjs';
const d=YAML.parse(R(dataPath)),raw=fs.readFileSync(join(root,snapshot)),metrics=parseWaterGeometry(raw.toString('utf8'));
assert.equal(d.snapshot.sha256,createHash('sha256').update(raw).digest('hex'));assert.deepEqual(d.compounds.water.geometry,metrics);assert.equal(d.species,'H2O');assert.equal(d.charge_state,0);
for(const m of Object.values(metrics)){assert.deepEqual(validateSchema('data/schema/1.0.0/mat-measurement.schema.json',m),[]);assert.equal(m.uncertainty,null);assert.equal(m.source_id,'SRC-000308');}
const expected=constructWater(metrics.distance_matrix_bond.value,metrics.bond_angle.value);for(const [k,v] of Object.entries(expected))assert.deepEqual(d.calculations.constructed_geometry[k],v);
assert.equal(d.calculations.bond_length_pm.value,95.78);assert.equal(d.calculations.constructed_geometry.evidence_type,'CALCULATED');assert.equal(d.calculations.constructed_geometry.uncertainty,null);
console.log('Water geometry: original source hash, three representations, units, uncertainty and construction verified.');

const chart=JSON.parse(R('data/quality/water-geometry-chart.json')),sha=x=>createHash('sha256').update(x).digest('hex');assert.equal(chart.input_sha256,sha(R(dataPath)));assert.equal(chart.sha256,sha(fs.readFileSync(join(root,chart.chart))));

import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';import YAML from 'yaml';import {root,R,validateSchema} from './lib.mjs';import {hydrogenStrong,balmerData,parseHydrogenBalmer} from './hydrogen-balmer.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),d=YAML.parse(R(balmerData)),expected=parseHydrogenBalmer(R(hydrogenStrong)),chart=JSON.parse(R('data/quality/hydrogen-balmer-chart.json'));
assert.equal(d.entries.length,8);assert.deepEqual(d.entries,expected);assert.equal(new Set(d.entries.map(x=>x.line_id)).size,8);
for(const s of d.snapshots)assert.equal(sha(readFileSync(join(root,s.path))),s.sha256);
for(const e of d.entries){assert.equal(e.wavelength.medium,'AIR');assert.equal(e.wavelength.uncertainty,null);assert.equal(e.species,'H I');assert.equal(e.principal_transition.lower_n,2);assert.equal(e.wavelength.source_id,'SRC-000305');assert.deepEqual(validateSchema('data/schema/1.0.0/mat-measurement.schema.json',e.wavelength),[]);}
assert.equal(chart.points,8);assert.equal(chart.input_sha256,sha(R(balmerData)));assert.equal(chart.sha256,sha(readFileSync(join(root,chart.chart))));assert.equal(chart.chart,d.artifacts.quantitative_chart);
console.log('Hydrogen: eight NIST air wavelengths, explicit unknown uncertainty, exact conversions, chart hashes verified.');

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schemaItems, normaliseMetric, metricAvailability } from '../state-flow-lib.mjs';
test('universal-schema extraction keeps layer ownership and excludes fenced examples',()=>{
  const rows=schemaItems('# 3. Atomic Identity Layer\n- atomic number;\n```yaml\n- false field;\n```\n# 4. Nuclear\n- atomic number;\n');
  assert.equal(rows.length,2);assert.notEqual(rows[0].requirement_id,rows[1].requirement_id);assert.equal(rows[0].line,2);
  assert.equal(normaliseMetric('Ionization energies'),normaliseMetric('ionisation_energies'));
});
test('metric audit preserves missing values and does not confuse zero with null',()=>{
  assert.equal(metricAvailability({value:0}),'CANDIDATE-NEEDS-REVIEW');
  assert.equal(metricAvailability({value:null}),'EXPLICIT-NULL');
  assert.equal(metricAvailability({status:'PLANNED'}),'EXPLICIT-STATUS');
  assert.equal(metricAvailability('NOT-APPLICABLE'),'EXPLICIT-STATUS');
});

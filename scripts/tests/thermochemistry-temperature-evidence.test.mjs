import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {shomate} from '../thermochemistry.mjs';
import {
  publisherTemperatureBasis,
  resolvePublisherCalculationTemperature,
  effectivePublisherTemperatureReviewNotes,
  validatePublisherTemperatureReviewNotes,
} from '../thermochemistry-publisher-temperature.mjs';

const indexPath = new URL('../../data/catalog/thermochemistry-evaluation-index.json', import.meta.url);
const indexBytes = fs.readFileSync(indexPath);
const index = JSON.parse(indexBytes);
const hash = value => createHash('sha256').update(value).digest('hex');
const fields = [
  ['heat_capacity_J_mol_K', 1],
  ['entropy_J_mol_K', 2],
  ['enthalpy_increment_kJ_mol', 4],
];

// Deliberately synthetic constant-Cp fixture: no scientific source, accession,
// neutral Sodium owner, measurement or physical prediction is supplied.
function fixture({tagged = true, nominal = false} = {}) {
  const fit = {
    fit_id: 'SYNTHETIC:ROUNDING:FIXTURE',
    temperature_range: {min: 332.503, max: 400, unit: 'K'},
    coefficients: Object.fromEntries([...'ABCDEFGH'].map(key => [key, {value: key === 'A' ? 30 : 0}])),
  };
  const calculationTemperature = nominal ? 350 : fit.temperature_range.min;
  const values = shomate(fit, calculationTemperature);
  const raw = [nominal ? '350.' : '333.', values.heat_capacity_J_mol_K.toFixed(6), values.entropy_J_mol_K.toFixed(6), 'UNUSED-SYNTHETIC-COLUMN', values.enthalpy_increment_kJ_mol.toFixed(6)];
  const check = {
    temperature_K: Number(raw[0]),
    raw,
    candidate_fit_ids: [fit.fit_id],
    heat_capacity_J_mol_K: Number(raw[1]),
    entropy_J_mol_K: Number(raw[2]),
    enthalpy_increment_kJ_mol: Number(raw[4]),
  };
  if (!nominal) {
    Object.assign(check, {
      calculation_temperature_K: calculationTemperature,
      calculation_temperature_basis: publisherTemperatureBasis,
      printed_temperature_rounding_interval_K: {min: 332.5, max: 333.5},
    });
    if (tagged) check.calculation_temperature_evidence = 'INTERPRETATION';
  }
  const item = {
    record_id: 'SYNTHETIC:OWNER:ROUNDING',
    heat_capacity_fits: [fit],
    publisher_calculation_checks: [check],
  };
  return {fit, check, item};
}

test('the four existing endpoint rows remain readable as interpretations without changing stored bytes', () => {
  const expected = new Set(['MAT:0003', 'MAT:0004', 'MAT:0005', 'MAT:0035']);
  const reviewed = [];
  for (const item of index.elements.filter(element => expected.has(element.record_id))) {
    const before = structuredClone(item);
    const overrides = item.publisher_calculation_checks.filter(check => check.calculation_temperature_K !== undefined);
    assert.equal(overrides.length, 1, item.record_id);
    for (const check of overrides) {
      const fit = item.heat_capacity_fits.find(candidate => candidate.fit_id === check.candidate_fit_ids[0]);
      const legacy = structuredClone(check);
      delete legacy.calculation_temperature_evidence;
      const result = resolvePublisherCalculationTemperature(legacy, fit);
      assert.equal(result.temperature_K, check.calculation_temperature_K);
      assert.equal(result.evidence, 'INTERPRETATION');
      assert.equal(result.legacy_untagged, true);
      assert.equal(legacy.raw[0], check.raw[0]);
    }
    assert.deepEqual(item, before);
    reviewed.push(item.record_id);
  }
  assert.deepEqual(new Set(reviewed), expected);
  assert.equal(hash(fs.readFileSync(indexPath)), hash(indexBytes));
});

test('explicitly tagged endpoint choice is an interpretation and retains its original printed label', () => {
  const {fit, check} = fixture();
  const before = structuredClone(check);
  const result = resolvePublisherCalculationTemperature(check, fit);
  assert.equal(result.temperature_K, 332.503);
  assert.equal(result.evidence, 'INTERPRETATION');
  assert.equal(result.legacy_untagged, false);
  assert.equal(check.temperature_K, 333);
  assert.equal(check.raw[0], '333.');
  assert.deepEqual(check, before);
});

test('nominal publisher labels remain calculation checks rather than measured temperatures', () => {
  const {fit, check} = fixture({nominal: true});
  const result = resolvePublisherCalculationTemperature(check, fit);
  assert.equal(result.temperature_K, 350);
  assert.equal(result.evidence, 'PUBLISHER-PRINTED-CALCULATION-CHECK');
  assert.equal(result.legacy_untagged, false);
});

test('endpoint uniqueness does not establish a unique hidden temperature inside the rounding cell', () => {
  const {fit, check} = fixture();
  const original = structuredClone(check);
  const interiorTemperature = fit.temperature_range.min + 0.0000001;
  assert.notEqual(interiorTemperature, fit.temperature_range.min);
  assert(interiorTemperature < fit.temperature_range.max);
  const interior = shomate(fit, interiorTemperature);
  for (const [field, column] of fields) {
    const decimals = check.raw[column].split('.')[1].length;
    assert(Math.abs(interior[field] - check[field]) <= 0.5 * 10 ** -decimals, field);
  }
  assert.equal(resolvePublisherCalculationTemperature(check, fit).evidence, 'INTERPRETATION');
  assert.deepEqual(check, original);
});

test('boundary interpretations cannot be relabelled MEASURED, EXACT, or another unsupported class', () => {
  for (const evidence of ['MEASURED', 'EXACT', 'PREDICTED', 'PUBLISHER-PRINTED-CALCULATION-CHECK', '', null, false, 0]) {
    const {fit, check} = fixture();
    check.calculation_temperature_evidence = evidence;
    assert.throws(() => resolvePublisherCalculationTemperature(check, fit), /evidence must be INTERPRETATION/, String(evidence));
  }
});

test('orphan temperature interpretation fields are refused on nominal rows', () => {
  for (const mutation of [
    check => {check.calculation_temperature_basis = publisherTemperatureBasis;},
    check => {check.calculation_temperature_evidence = 'INTERPRETATION';},
    check => {check.printed_temperature_rounding_interval_K = {min: 349.5, max: 350.5};},
  ]) {
    const {fit, check} = fixture({nominal: true});
    mutation(check);
    assert.throws(() => resolvePublisherCalculationTemperature(check, fit), /orphan .* without an override/);
  }
});

test('raw temperature and numeric property identities are checked for nominal and override rows', () => {
  for (const nominal of [false, true]) {
    for (const [mutation, reason] of [
      [check => {check.temperature_K += 1;}, /nominal temperature must equal its original printed cell/],
      [check => {check.raw[0] = 'NOT-A-TEMPERATURE';}, /invalid printed numeric cell/],
      [check => {check.raw[0] = String(check.temperature_K + 1) + '.';}, /nominal temperature must equal its original printed cell/],
      ...fields.map(([field]) => [check => {check[field] += 1;}, /must equal its original printed cell/]),
      ...fields.map(([, column]) => [check => {check.raw[column] = 'NOT-A-NUMBER';}, /invalid printed numeric cell/]),
      ...fields.map(([, column]) => [check => {check.raw[column] = (Number(check.raw[column]) + 1).toFixed(6);}, /must equal its original printed cell/]),
    ]) {
      const {fit, check} = fixture({nominal});
      mutation(check);
      assert.throws(() => resolvePublisherCalculationTemperature(check, fit), reason);
    }
  }
});

test('two equally compatible source endpoints are refused rather than claiming a unique choice', () => {
  const {fit, check} = fixture();
  fit.temperature_range = {min: 332.6, max: 332.9, unit: 'K'};
  fit.coefficients.A.value = 0.01;
  check.raw = ['333.', '0', '0', 'UNUSED-SYNTHETIC-COLUMN', '0'];
  for (const [field] of fields) check[field] = 0;
  check.calculation_temperature_K = 332.6;
  assert.throws(() => resolvePublisherCalculationTemperature(check, fit), /only one agreeing source-fit endpoint/);
});

test('only the matching source endpoint inside the retained rounding cell can be selected', () => {
  for (const [mutation, reason] of [
    [check => {check.calculation_temperature_K = 332.6;}, /only one agreeing source-fit endpoint/],
    [check => {check.calculation_temperature_K = 332.4;}, /only one agreeing source-fit endpoint/],
    [check => {check.calculation_temperature_K = NaN;}, /finite chosen comparison temperature/],
    [check => {check.calculation_temperature_K = Infinity;}, /finite chosen comparison temperature/],
    [check => {check.printed_temperature_rounding_interval_K.min = 332.4;}, /rounding cell mismatch/],
    [check => {check.calculation_temperature_basis = 'HIDDEN-PUBLISHER-TEMPERATURE-RECOVERED';}, /unsupported comparison-temperature basis/],
  ]) {
    const {fit, check} = fixture();
    mutation(check);
    assert.throws(() => resolvePublisherCalculationTemperature(check, fit), reason);
  }
});

test('matching nominal temperatures cannot be replaced by an interpreted endpoint', () => {
  const {fit, check} = fixture();
  const nominalValues = shomate(fit, check.temperature_K);
  for (const [field, column] of fields) {
    check.raw[column] = nominalValues[field].toFixed(6);
    check[field] = Number(check.raw[column]);
  }
  assert.throws(() => resolvePublisherCalculationTemperature(check, fit), /already agreeing nominal temperature/);
});

test('local derived notes preserve original notes, rows and fits without changing the catalogue object', () => {
  const {item} = fixture();
  item.review_notes = [{note_id: 'SYNTHETIC:ORIGINAL:NOTE', status: 'RESEARCH', evidence_status: 'UNVERIFIED', text: 'An original synthetic authored note that must be preserved.'}];
  const before = structuredClone(item);
  const notes = effectivePublisherTemperatureReviewNotes(item);
  assert.notEqual(notes, item.review_notes);
  assert.deepEqual(notes.slice(0, 1), item.review_notes);
  assert.equal(notes.length, 2);
  assert.equal(notes[1].evidence_status, 'INTERPRETATION');
  assert.match(notes[1].text, /print/i);
  assert.match(notes[1].text, /(?:not|unknown|unestablished|undetermined)/i);
  assert.deepEqual(item, before);
  notes[0].text = 'Change only the local view.';
  assert.deepEqual(item, before, 'Effective notes must not share mutable original note objects');
});

test('matching derived notes are not duplicated and conflicting authored note IDs are refused', () => {
  const {item} = fixture();
  const derived = effectivePublisherTemperatureReviewNotes(item);
  assert.equal(derived.length, 1);
  item.review_notes = structuredClone(derived);
  assert.deepEqual(effectivePublisherTemperatureReviewNotes(item), derived);
  item.review_notes[0].text = 'Conflicting synthetic authored text.';
  const before = structuredClone(item);
  assert.throws(() => effectivePublisherTemperatureReviewNotes(item), /conflicting authored interpretation note/);
  assert.deepEqual(item, before);
});

test('historical untagged notes remain accepted but tagged overrides require the effective interpretation note', () => {
  const {item: legacy} = fixture({tagged: false});
  legacy.review_notes = [{note_id: 'SYNTHETIC:LEGACY:NOTE', status: 'RESEARCH', evidence_status: 'UNVERIFIED', text: 'Existing synthetic note.'}];
  const legacyBefore = structuredClone(legacy);
  validatePublisherTemperatureReviewNotes(legacy, legacy.review_notes);
  validatePublisherTemperatureReviewNotes(legacy, effectivePublisherTemperatureReviewNotes(legacy));
  assert.deepEqual(legacy, legacyBefore);
  const tagged = structuredClone(legacy);
  tagged.publisher_calculation_checks[0].calculation_temperature_evidence = 'INTERPRETATION';
  assert.throws(() => validatePublisherTemperatureReviewNotes(tagged, tagged.review_notes), /retain the comparison interpretation/);
  validatePublisherTemperatureReviewNotes(tagged, effectivePublisherTemperatureReviewNotes(tagged));
  const falseStatus = effectivePublisherTemperatureReviewNotes(tagged);
  falseStatus.at(-1).evidence_status = 'MEASURED';
  assert.throws(() => validatePublisherTemperatureReviewNotes(tagged, falseStatus), /retain the comparison interpretation/);
});

test('nominal-only rows add no interpretation notes', () => {
  const {item} = fixture({nominal: true});
  assert.deepEqual(effectivePublisherTemperatureReviewNotes(item), []);
  validatePublisherTemperatureReviewNotes(item, []);
  const note = {note_id: 'SYNTHETIC:NOMINAL:NOTE', status: 'RESEARCH', evidence_status: 'UNVERIFIED', text: 'Retained note with no override.'};
  item.review_notes = [note];
  assert.deepEqual(effectivePublisherTemperatureReviewNotes(item), [note]);
  validatePublisherTemperatureReviewNotes(item, [note]);
});

test('omitted comparison rows preserve original notes without inventing evidence or derived notes', () => {
  const {item} = fixture();
  delete item.publisher_calculation_checks;
  const beforeWithoutNotes = structuredClone(item);
  assert.deepEqual(effectivePublisherTemperatureReviewNotes(item), []);
  validatePublisherTemperatureReviewNotes(item, []);
  assert.deepEqual(item, beforeWithoutNotes);
  item.review_notes = [{note_id: 'SYNTHETIC:OMITTED:COMPARISONS', status: 'RESEARCH', evidence_status: 'UNVERIFIED', text: 'Original synthetic note; no publisher comparison evidence was supplied.'}];
  const before = structuredClone(item);
  const notes = effectivePublisherTemperatureReviewNotes(item);
  assert.deepEqual(notes, item.review_notes);
  validatePublisherTemperatureReviewNotes(item, notes);
  assert.notEqual(notes, item.review_notes);
  notes[0].text = 'Change only the local view.';
  assert.deepEqual(item, before);
  assert.equal(Object.hasOwn(item, 'publisher_calculation_checks'), false);
});

test('explicit null and other malformed comparison-row containers cannot stand for absent evidence', () => {
  for (const supplied of [null, {}, 'UNKNOWN', 0, false]) {
    const {item} = fixture();
    item.publisher_calculation_checks = supplied;
    assert.throws(() => effectivePublisherTemperatureReviewNotes(item), /comparison.*(?:array|required)/);
    assert.throws(() => validatePublisherTemperatureReviewNotes(item, []), /comparison.*(?:array|required)/);
  }
});

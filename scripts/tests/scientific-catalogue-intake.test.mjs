import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {abstractCatalogue, privateIntakePath} from '../scientific-catalogue-intake.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const utc = '2026-10-07T09:00:00.123456+00:00';
const record = id => ({id: String(id), updated: '2025-06-06T08:22:19+01:00', links: {self: `https://opendata.cern.ch/api/records/${id}`}, metadata: {
  recid: String(id), title: `Recorded dataset ${id}`, type: {primary: 'Dataset', secondary: ['Derived']},
  abstract: {description: 'Private full abstract must never enter the metadata receipt'},
  files: [{key: 'no-url'}, {uri: `root://eospublic.cern.ch//record-${id}.root`, version_id: `file-v-${id}`}]
}});
const nistRecord = id => ({'@id': `ark:/88434/mds${id}`, '@context': {'@vocab': 'https://data.nist.gov/od/dm/'}, '@type': ['dcat:Dataset'], title: `NIST dataset ${id}`,
  version: '1.0.0', modified: '2025-06-06', license: 'https://www.nist.gov/open/license', landingPage: `https://data.nist.gov/od/id/${id}`,
  components: [{'@id': 'file-one', downloadURL: `https://data.nist.gov/files/${id}.csv`}], description: 'Private description excluded'});

function fixture(provider = 'cern-opendata', specifications = [{page: 1, ids: [1, 2]}, {page: 2, ids: [3, 4]}], total = 5) {
  const files = new Map(), contract = Buffer.from('Offline test fixture for a captured primary pagination contract.');
  const contractPath = '.mat-local/intake/fixture/contract.txt'; files.set(contractPath, contract);
  const url = page => provider === 'cern-opendata' ? `https://opendata.cern.ch/api/records/?page=${page}&size=2&sort=mostrecent` : `https://data.nist.gov/rmm/records?page=${page}&limit=2`;
  const pages = specifications.map(({page, ids}) => {
    const payload = provider === 'cern-opendata' ? {hits: {total, hits: ids.map(record)}, links: {self: url(page), ...((page - 1) * 2 + ids.length < total ? {next: url(page + 1)} : {})}} : {ResultCount: total, PageSize: 2, ResultData: ids.map(nistRecord), Metrics: {milliseconds: page}};
    const bytes = Buffer.from(JSON.stringify(payload)), path = `.mat-local/intake/fixture/${provider}-${page}.json`; files.set(path, bytes);
    return {path, requested_url: url(page), observed_url: url(page), status: 200, content_type: 'application/json', retrieved_at: utc, bytes: bytes.length, sha256: sha(bytes), truncated: false};
  });
  const manifest = {version: 1, provider, contract_evidence: [{path: contractPath, sha256: sha(contract), url: provider === 'cern-opendata' ? 'https://opendata.cern.ch/docs/cod-search-tips' : 'https://data.nist.gov/rmm/openapi.json', locator: 'Offline fixture locator, not scientific evidence'}], pages};
  const readPage = path => { assert.ok(files.has(path), `Missing fixture ${path}`); return files.get(path); };
  const changePage = (index, change) => {
    const capture = manifest.pages[index], payload = JSON.parse(files.get(capture.path)); change(payload);
    const bytes = Buffer.from(JSON.stringify(payload)); files.set(capture.path, bytes); capture.sha256 = sha(bytes); capture.bytes = bytes.length;
  };
  return {manifest, files, readPage, changePage};
}
const includePriorBytes = (next, initial) => { for (const [path, bytes] of initial.files) if (!next.files.has(path)) next.files.set(path, bytes); return next; };

test('CERN two-page intake preserves native IDs, source locators, unknowns and a bounded exact next request', () => {
  const input = fixture(), result = abstractCatalogue(input.manifest, input);
  assert.deepEqual(result.records.map(value => value.native_id), ['1', '2', '3', '4']);
  assert.equal(result.coverage.unique_native_records, 4); assert.equal(result.coverage.remaining_records_estimate_at_last_capture, 1);
  assert.equal(result.continuation.next_url, 'https://opendata.cern.ch/api/records/?page=3&size=2&sort=mostrecent');
  assert.equal(result.records[0].version, 'UNKNOWN'); assert.equal(result.records[0].licence, 'UNKNOWN');
  assert.equal(result.records[0].field_locators.version, null); assert.equal(result.records[0].field_locators.licence, null);
  assert.equal(result.records[0].data_locators[0].locator, '/hits/hits/0/metadata/files/1/uri');
  assert.equal(result.records[0].data_locators[0].version, 'file-v-1');
  assert.equal(result.records[0].field_locators.native_id, '/hits/hits/0/id');
  assert.equal(result.records[0].locators[0].capture_sha256, input.manifest.pages[0].sha256);
  assert.equal(result.scientific_acceptance, 'NOT-PROMOTED'); assert.equal(result.all_scientific_data_complete, false);
  assert.equal(result.coverage.data_files_retrieved, 0); assert.equal(result.coverage.source_ids_allocated, 0);
});

test('NIST evidenced 1-based pages retain NERDm identities and distinguish record version from modification date', () => {
  const input = fixture('nist-rmm'), result = abstractCatalogue(input.manifest, input);
  assert.equal(result.pagination_contract, 'OBSERVED-PAGE-NOT-OPENAPI-SKIP');
  assert.equal(result.records[0].native_id, 'ark:/88434/mds1');
  assert.equal(result.records[0].version, '1.0.0'); assert.equal(result.records[0].source_record_modified, '2025-06-06');
  assert.equal(result.records[0].licence, 'https://www.nist.gov/open/license');
  assert.equal(result.records[0].data_locators[0].locator, '/ResultData/0/components/0/downloadURL');
  assert.equal(result.continuation.next_url, 'https://data.nist.gov/rmm/records?page=3&limit=2');
});

test('metadata abstraction omits descriptions, abstracts, measurements and arbitrary capture bodies', () => {
  const input = fixture(); input.manifest.pages[0].measurements = [{value: 42}];
  input.changePage(0, page => page.hits.hits[0].metadata.measurements = [{value: 42}]);
  const receipt = JSON.stringify(abstractCatalogue(input.manifest, input));
  assert.equal(receipt.includes('Private full abstract'), false); assert.equal(receipt.includes('measurements'), false);
  assert.equal(receipt.includes('scientific_values_accepted":0'), true);
});

test('non-success HTTP, non-JSON responses and missing/positive truncation cannot advance', () => {
  for (const change of [capture => capture.status = 403, capture => capture.content_type = 'text/html', capture => delete capture.truncated, capture => capture.truncated = true]) {
    const input = fixture(); change(input.manifest.pages[0]); assert.throws(() => abstractCatalogue(input.manifest, input));
  }
});

test('raw hash, byte count, invalid UTC and missing primary contract evidence are refused', () => {
  for (const change of [input => input.manifest.pages[0].sha256 = 'a'.repeat(64), input => input.manifest.pages[0].bytes++, input => input.manifest.pages[0].retrieved_at = '2026-10-07T10:00:00+01:00', input => input.manifest.contract_evidence = [], input => input.manifest.contract_evidence[0].sha256 = 'a'.repeat(64)]) {
    const input = fixture(); change(input); assert.throws(() => abstractCatalogue(input.manifest, input));
  }
});

test('native identity mismatches, record-link mismatches and absent type contexts are refused', () => {
  for (const change of [row => row.metadata.recid = 'other', row => row.links.self = 'https://opendata.cern.ch/api/records/999', row => delete row.metadata.type]) {
    const input = fixture(); input.changePage(0, page => change(page.hits.hits[0])); assert.throws(() => abstractCatalogue(input.manifest, input));
  }
  for (const change of [row => row['@id'] = 'MAT:0001', row => delete row['@context'], row => row['@context'] = null, row => row['@type'] = []]) {
    const input = fixture('nist-rmm'); input.changePage(0, page => change(page.ResultData[0])); assert.throws(() => abstractCatalogue(input.manifest, input));
  }
});

test('origin, endpoint, credentials, duplicate parameters and unexpected redirects cannot escape the recorded request', () => {
  for (const value of ['https://evil.example/api/records/?page=2&size=2', 'https://opendata.cern.ch/download?page=2&size=2', 'https://user:password@opendata.cern.ch/api/records/?page=2&size=2', 'https://opendata.cern.ch/api/records/?page=2&page=3&size=2']) {
    const input = fixture(); input.changePage(0, page => page.links.next = value); assert.throws(() => abstractCatalogue(input.manifest, input));
  }
  const input = fixture(); input.manifest.pages[0].observed_url = 'https://data.nist.gov/rmm/records?page=1&limit=2'; assert.throws(() => abstractCatalogue(input.manifest, input));
});

test('NIST skip/offset variants are rejected rather than silently presenting repeated first-page records as coverage', () => {
  for (const param of ['skip=0', 'skip=2', 'offset=2', 'from=2', '_skip=2']) {
    const input = fixture('nist-rmm'); input.manifest.pages[0].requested_url = input.manifest.pages[0].observed_url = `https://data.nist.gov/rmm/records?${param}&limit=2`;
    assert.throws(() => abstractCatalogue(input.manifest, input), /Unsupported|positive page/);
  }
});

test('repeated native-ID pages are refused even when Metrics and raw response hashes differ', () => {
  const input = fixture('nist-rmm', [{page: 1, ids: [1, 2]}, {page: 2, ids: [1, 2]}]);
  assert.notEqual(input.manifest.pages[0].sha256, input.manifest.pages[1].sha256);
  assert.throws(() => abstractCatalogue(input.manifest, input), /Repeated native-ID page/);
});

test('a reordered complete native-ID set cannot advance pagination or manufacture new coverage', () => {
  const input = fixture('nist-rmm', [{page: 1, ids: [1, 2]}, {page: 2, ids: [2, 1]}]);
  assert.notEqual(input.manifest.pages[0].sha256, input.manifest.pages[1].sha256);
  assert.throws(() => abstractCatalogue(input.manifest, input), /no new native IDs cannot advance/);
  const first = fixture('nist-rmm', [{page: 1, ids: [1, 2]}]), previous = abstractCatalogue(first.manifest, first);
  const repeatedNext = includePriorBytes(fixture('nist-rmm', [{page: 2, ids: [2, 1]}]), first);
  assert.throws(() => abstractCatalogue(repeatedNext.manifest, {...repeatedNext, previous}), /no new native IDs cannot advance/);
});

test('repeated/skipped cursors and changing queries cannot advance', () => {
  for (const changes of [{page: 1, ids: [3, 4]}, {page: 3, ids: [3, 4]}]) {
    const input = fixture('cern-opendata', [{page: 1, ids: [1, 2]}, changes]); assert.throws(() => abstractCatalogue(input.manifest, input));
  }
  const input = fixture(); input.manifest.pages[1].requested_url = input.manifest.pages[1].observed_url = input.manifest.pages[1].requested_url.replace('mostrecent', 'oldest');
  input.changePage(1, page => page.links.self = input.manifest.pages[1].requested_url); assert.throws(() => abstractCatalogue(input.manifest, input), /query|cursor/);
});

test('duplicate IDs within a page and conflicted metadata across pages fail before acceptance', () => {
  const duplicate = fixture('cern-opendata', [{page: 1, ids: [1, 1]}]); assert.throws(() => abstractCatalogue(duplicate.manifest, duplicate), /Duplicate native IDs/);
  const conflict = fixture('cern-opendata', [{page: 1, ids: [1, 2]}, {page: 2, ids: [2, 3]}]);
  conflict.changePage(1, page => page.hits.hits[0].metadata.title = 'Changed source record'); assert.throws(() => abstractCatalogue(conflict.manifest, conflict), /identity changed/);
});

test('overlapping records deduplicate by native ID while retaining all raw-page locators', () => {
  const input = fixture('cern-opendata', [{page: 1, ids: [1, 2]}, {page: 2, ids: [2, 3]}]);
  const result = abstractCatalogue(input.manifest, input);
  assert.equal(result.records.length, 3); assert.equal(result.coverage.duplicate_records_in_batch, 1);
  assert.equal(result.records.find(value => value.native_id === '2').locators.length, 2);
});

test('exact-next resume adds coverage without losing prior records or provenance', () => {
  const initial = fixture('cern-opendata', [{page: 1, ids: [1, 2]}]), previous = abstractCatalogue(initial.manifest, initial);
  const next = includePriorBytes(fixture('cern-opendata', [{page: 2, ids: [3, 4]}]), initial);
  const result = abstractCatalogue(next.manifest, {...next, previous});
  assert.equal(result.pages.length, 2); assert.deepEqual(result.records.map(value => value.native_id), ['1', '2', '3', '4']);
  assert.deepEqual(result.records[0], previous.records[0]);
});

test('resume can recheck the last page without falsely adding page coverage', () => {
  const initial = fixture(), previous = abstractCatalogue(initial.manifest, initial);
  const next = includePriorBytes(fixture('cern-opendata', [{page: 2, ids: [3, 4]}, {page: 3, ids: [5]}]), initial);
  const result = abstractCatalogue(next.manifest, {...next, previous});
  assert.equal(result.pages.length, 3); assert.equal(result.coverage.overlapping_resume_pages, 1);
  assert.equal(result.records.length, 5); assert.equal(result.continuation.next_url, null);
  assert.equal(result.all_scientific_data_complete, false);
});

test('changed overlap, skipped resume, incompatible queries and modified resume state are refused', () => {
  const initial = fixture(), previous = abstractCatalogue(initial.manifest, initial);
  const changed = fixture('cern-opendata', [{page: 2, ids: [3, 9]}]);
  const capture = changed.manifest.pages[0], oldPath = capture.path; capture.path = oldPath.replace('.json', '-new.json'); changed.files.set(capture.path, changed.files.get(oldPath)); changed.files.delete(oldPath); includePriorBytes(changed, initial);
  assert.throws(() => abstractCatalogue(changed.manifest, {...changed, previous}), /changed native identities/);
  const skipped = includePriorBytes(fixture('cern-opendata', [{page: 4, ids: [5]}]), initial); assert.throws(() => abstractCatalogue(skipped.manifest, {...skipped, previous}), /exact next/);
  const next = includePriorBytes(fixture('cern-opendata', [{page: 3, ids: [5]}]), initial);
  const stale = structuredClone(previous); stale.records[0].title = 'tampered'; assert.throws(() => abstractCatalogue(next.manifest, {...next, previous: stale}), /digest is stale/);
  const alien = structuredClone(previous); alien.query = 'https://evil.example'; assert.throws(() => abstractCatalogue(next.manifest, {...next, previous: alien}), /incompatible/);
});

test('resume rehashes prior original captures instead of trusting only the receipt digest', () => {
  const initial = fixture(), previous = abstractCatalogue(initial.manifest, initial);
  const next = includePriorBytes(fixture('cern-opendata', [{page: 3, ids: [5]}]), initial);
  const priorPath = previous.pages[0].capture.path;
  next.files.set(priorPath, Buffer.from(next.files.get(priorPath).toString().replace('Recorded dataset 1', 'Tampered dataset 1')));
  assert.throws(() => abstractCatalogue(next.manifest, {...next, previous}), /bytes or SHA256 mismatch/);
  next.files.set(priorPath, initial.files.get(priorPath));
  const forged = structuredClone(previous); forged.pages[0].ordered_native_ids[0] = '999';
  forged.state_sha256 = sha(JSON.stringify({pages: forged.pages, overlap_captures: forged.overlap_captures, records: forged.records, query: forged.query}));
  assert.throws(() => abstractCatalogue(next.manifest, {...next, previous: forged}), /no longer match the original bytes/);
});

test('missing next link, approximate totals, early empty pages and oversized responses are refused', () => {
  for (const mutate of [page => delete page.links.next, page => page.hits.total = {value: 5, relation: 'gte'}, page => page.hits.hits = []]) {
    const input = fixture(); input.changePage(0, mutate); assert.throws(() => abstractCatalogue(input.manifest, input));
  }
  const input = fixture(); input.manifest.pages[0].bytes = 10 * 1024 * 1024 + 1; assert.throws(() => abstractCatalogue(input.manifest, input));
});

test('dynamic catalogue totals are retained as source reports and never establish snapshot or science completeness', () => {
  const input = fixture(); input.changePage(1, page => page.hits.total = 6);
  const result = abstractCatalogue(input.manifest, input);
  assert.equal(result.coverage.total_changed_between_captures, true); assert.deepEqual(result.pages.map(page => page.total), [5, 6]);
  assert.equal(result.coverage.catalogue_snapshot_guaranteed, false); assert.equal(result.all_scientific_data_complete, false);
});

test('missing NIST record version/licence remains UNKNOWN; file locators are not retrieved', () => {
  const input = fixture('nist-rmm'); input.changePage(0, page => { delete page.ResultData[0].license; delete page.ResultData[0].version; });
  const result = abstractCatalogue(input.manifest, input);
  assert.equal(result.records[0].version, 'UNKNOWN'); assert.equal(result.records[0].licence, 'UNKNOWN');
  assert.equal(result.records[0].data_locators[0].version, 'UNKNOWN'); assert.equal(result.coverage.scientific_values_accepted, 0);
});

test('private input/output paths refuse traversal and public scientific destinations', () => {
  for (const value of ['../data/x.json', '.mat-local/../data/x.json', '.mat-local\\intake\\x.json', 'C:/private/x.json', '.mat-local/intake/./x.json']) assert.throws(() => privateIntakePath(value));
  for (const value of ['data/intake/x.json', '.mat-local/cycle/x.json', '.mat-local/intake/x.yaml']) assert.throws(() => privateIntakePath(value, {output: true}));
  assert.equal(privateIntakePath('.mat-local/intake/bounded.json', {output: true}), '.mat-local/intake/bounded.json');
});

// Metadata-only abstraction of bounded, already captured public catalogue pages.
// This tool performs no network requests, scientific accession or registry allocation.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';

const providers = {
  'cern-opendata': {origin: 'https://opendata.cern.ch', path: '/api/records', size: 'size'},
  'nist-rmm': {origin: 'https://data.nist.gov', path: '/rmm/records', size: 'limit'}
};
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const integer = value => Number.isSafeInteger(value) && value >= 0;
const text = (value, limit = 1000) => typeof value === 'string' && value.trim().length > 0 && value.length <= limit && !/[\u0000-\u001f\u007f]/u.test(value);
const unknown = value => value === undefined || value === null || value === '' ? 'UNKNOWN' : value;
const stableUrl = url => {
  const copy = new URL(url); copy.searchParams.sort(); return copy.href;
};

/** Capture and output paths remain under the existing private intake convention. */
export function privateIntakePath(path, {output = false} = {}) {
  requireValue(typeof path === 'string' && /^\.mat-local\/[A-Za-z0-9_./-]+$/.test(path) && !path.split('/').some(part => part === '.' || part === '..'), 'Expected a private .mat-local relative path without traversal');
  if (output) requireValue(path.startsWith('.mat-local/intake/') && path.endsWith('.json'), 'Output must be a JSON file under .mat-local/intake');
  return path;
}

function externalLocator(value) {
  requireValue(text(value, 3000), 'Invalid external locator');
  const url = new URL(value);
  requireValue(['http:', 'https:', 'root:'].includes(url.protocol) && !url.username && !url.password && !url.hash.includes('\u0000'), 'Unsupported or credential-bearing external locator');
  return url.href;
}

function pageUrl(value, provider) {
  const config = providers[provider], url = new URL(value);
  requireValue(url.origin === config.origin && url.pathname.replace(/\/$/, '') === config.path && !url.username && !url.password && !url.hash, 'Catalogue cursor escaped the provider origin or endpoint');
  const keys = [...url.searchParams.keys()];
  requireValue(new Set(keys).size === keys.length && keys.every(key => ['page', config.size, 'q', 'sort', 'searchphrase'].includes(key)), 'Unsupported or repeated catalogue query parameter');
  const page = Number(url.searchParams.get('page')), size = Number(url.searchParams.get(config.size));
  requireValue(/^[1-9]\d*$/.test(url.searchParams.get('page') || '') && Number.isSafeInteger(page), 'Explicit positive page cursor is required; skip/offset is not the evidenced NIST contract');
  requireValue(/^[1-9]\d*$/.test(url.searchParams.get(config.size) || '') && Number.isSafeInteger(size) && size <= 100, 'Explicit bounded page size (1–100) is required');
  const query = new URL(url); query.searchParams.delete('page'); query.searchParams.sort();
  return {url: stableUrl(url), page, size, query: query.href};
}

function optionalScalar(value, label) {
  if (value === undefined || value === null || value === '') return 'UNKNOWN';
  requireValue(text(value, 1000) || (typeof value === 'number' && Number.isFinite(value)), label + ' must be bounded metadata');
  return value;
}

function licence(value) {
  if (value === undefined || value === null || value === '') return 'UNKNOWN';
  if (typeof value === 'string') return optionalScalar(value, 'Licence');
  requireValue(object(value), 'Licence must be scalar or named metadata');
  const result = {};
  for (const key of ['name', 'id', 'url']) if (value[key] !== undefined) result[key] = optionalScalar(value[key], 'Licence ' + key);
  return Object.keys(result).length ? result : 'UNKNOWN';
}

function nativeRecord(record, index, provider) {
  requireValue(object(record), 'Catalogue record must be an object');
  let id, metadata, type, base, urls = [], fieldLocators;
  if (provider === 'cern-opendata') {
    id = String(record.id ?? ''); metadata = record.metadata; base = `/hits/hits/${index}`;
    requireValue(/^[1-9]\d*$/.test(id) && object(metadata) && String(metadata.recid ?? '') === id, 'CERN native id and metadata.recid must agree');
    requireValue(object(metadata.type) && text(metadata.type.primary, 100), 'CERN record type context is required');
    type = {primary: metadata.type.primary, secondary: metadata.type.secondary ?? []};
    requireValue(Array.isArray(type.secondary) && type.secondary.length <= 100 && type.secondary.every(value => text(value, 100)), 'Invalid CERN secondary type context');
    if (record.links?.self !== undefined) {
      const self = new URL(record.links.self);
      requireValue(self.origin === providers[provider].origin && self.pathname.replace(/\/$/, '') === `/api/records/${id}` && !self.search && !self.hash && !self.username && !self.password, 'CERN record link conflicts with native id');
    }
    requireValue(metadata.files === undefined || (Array.isArray(metadata.files) && metadata.files.length <= 10000), 'Malformed CERN file metadata');
    urls = (metadata.files ?? []).flatMap((file, i) => file?.uri === undefined ? [] : [{url: externalLocator(file.uri), locator: `${base}/metadata/files/${i}/uri`, version: optionalScalar(file.version_id, 'File version')}]);
    fieldLocators = {native_id: `${base}/id`, title: `${base}/metadata/title`, type: `${base}/metadata/type`, version: Object.hasOwn(metadata, 'version') ? `${base}/metadata/version` : null, licence: Object.hasOwn(metadata, 'license') ? `${base}/metadata/license` : null};
  } else {
    metadata = record; id = metadata['@id']; base = `/ResultData/${index}`;
    requireValue(text(id, 200) && /^ark:\/88434\/[A-Za-z0-9.-]+$/.test(id), 'Expected a NIST-native ARK identity');
    requireValue(metadata['@context'] !== undefined && metadata['@context'] !== null && Array.isArray(metadata['@type']) && metadata['@type'].length > 0 && metadata['@type'].every(value => text(value, 200)), 'NIST NERDm context and record types are required');
    type = metadata['@type'];
    requireValue(metadata.components === undefined || (Array.isArray(metadata.components) && metadata.components.length <= 10000), 'Malformed NIST component metadata');
    for (const [i, component] of (metadata.components ?? []).entries()) for (const key of ['downloadURL', 'accessURL']) {
      if (component?.[key] !== undefined) urls.push({url: externalLocator(component[key]), locator: `${base}/components/${i}/${key}`, version: 'UNKNOWN'});
    }
    fieldLocators = {native_id: `${base}/@id`, title: `${base}/title`, type: `${base}/@type`, version: Object.hasOwn(metadata, 'version') ? `${base}/version` : null, licence: Object.hasOwn(metadata, 'license') ? `${base}/license` : null};
  }
  requireValue(text(metadata.title), 'A bounded catalogue title is required');
  const recordUrl = provider === 'cern-opendata' ? `${providers[provider].origin}/record/${id}` : metadata.landingPage;
  if (recordUrl !== undefined && recordUrl !== null) externalLocator(recordUrl);
  return {provider, native_id: id, title: metadata.title, native_type: type,
    record_url: unknown(recordUrl), version: optionalScalar(metadata.version, 'Record version'), licence: licence(metadata.license),
    source_record_modified: optionalScalar(provider === 'cern-opendata' ? record.updated : metadata.modified, 'Modified timestamp'),
    doi: optionalScalar(metadata.doi, 'DOI'), data_locators: urls, metadata_locator: base, field_locators: fieldLocators,
    native_record_sha256: hash(JSON.stringify(record)), evidence_lane: 'CATALOGUE-METADATA-RESEARCH-LEAD', scientific_acceptance: 'NOT-PROMOTED'};
}

function inspectPage(capture, provider, readPage) {
  requireValue(object(capture), 'Capture metadata is required'); privateIntakePath(capture.path);
  requireValue(capture.status === 200 && text(capture.content_type, 100) && /^application\/(?:[a-z0-9.+-]*\+)?json(?:;|$)/i.test(capture.content_type), 'Only successful JSON catalogue responses can advance');
  requireValue(capture.truncated === false, 'Explicit non-truncated capture evidence is required');
  requireValue(typeof capture.retrieved_at === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|\+00:00)$/.test(capture.retrieved_at) && Number.isFinite(Date.parse(capture.retrieved_at)), 'UTC capture timestamp is required');
  requireValue(integer(capture.bytes) && capture.bytes > 0 && capture.bytes <= 10 * 1024 * 1024 && /^[a-f0-9]{64}$/.test(capture.sha256), 'Bounded byte count and SHA256 are required');
  const requested = pageUrl(capture.requested_url, provider), observed = pageUrl(capture.observed_url, provider);
  requireValue(requested.url === observed.url, 'Unexpected catalogue response redirect or cursor mismatch');
  const raw = readPage(capture.path), bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8');
  requireValue(bytes.length === capture.bytes && hash(bytes) === capture.sha256, 'Captured page bytes or SHA256 mismatch');
  const page = JSON.parse(bytes.toString('utf8'));
  let rows, total, next;
  if (provider === 'cern-opendata') {
    requireValue(object(page.hits) && Array.isArray(page.hits.hits) && object(page.links), 'CERN hits and links context is required');
    rows = page.hits.hits; total = object(page.hits.total) ? page.hits.total.value : page.hits.total;
    requireValue(!object(page.hits.total) || page.hits.total.relation === 'eq', 'An approximate total cannot establish remaining coverage');
    requireValue(text(page.links.self, 3000) && pageUrl(page.links.self, provider).url === requested.url, 'CERN self cursor must match the captured request');
    next = page.links.next ?? null;
    if (next !== null) {
      const parsed = pageUrl(next, provider);
      requireValue(parsed.page === requested.page + 1 && parsed.query === requested.query, 'Next cursor failed exact sequential page/query validation');
    }
  } else {
    requireValue(Array.isArray(page.ResultData) && page.PageSize === requested.size, 'NIST ResultData and PageSize must match the captured request');
    rows = page.ResultData; total = page.ResultCount;
    const candidate = new URL(capture.requested_url); candidate.searchParams.set('page', String(requested.page + 1)); next = candidate.href;
  }
  requireValue(integer(total) && rows.length <= requested.size && total >= rows.length, 'Invalid total or returned page size');
  const offset = (requested.page - 1) * requested.size;
  requireValue(rows.length > 0 || total === 0 || offset >= total, 'Empty response before the reported total cannot advance');
  if (provider === 'nist-rmm' && offset + rows.length >= total) next = null;
  if (provider === 'cern-opendata') requireValue(next !== null || offset + rows.length >= total, 'Missing CERN next cursor before reported end');
  const records = rows.map((record, index) => nativeRecord(record, index, provider));
  const ids = records.map(record => record.native_id);
  requireValue(new Set(ids).size === ids.length, 'Duplicate native IDs within a page');
  const evidence = Object.fromEntries(['path', 'requested_url', 'observed_url', 'status', 'content_type', 'retrieved_at', 'sha256', 'bytes', 'truncated'].map(key => [key, capture[key]]));
  return {capture: evidence, page: requested.page, query: requested.query, size: requested.size, total, returned: rows.length,
    ordered_native_ids: ids, native_id_signature: hash(JSON.stringify(ids)), next_url: next, records};
}

/** Deterministic offline abstraction. Capture metadata never proves scientific values. */
export function abstractCatalogue(manifest, {readPage, previous = null} = {}) {
  requireValue(object(manifest) && manifest.version === 1 && Object.hasOwn(providers, manifest.provider), 'Version 1 and a supported provider are required');
  requireValue(typeof readPage === 'function' && Array.isArray(manifest.pages) && manifest.pages.length >= 1 && manifest.pages.length <= 100, 'Require a bounded 1–100 page capture batch');
  requireValue(Array.isArray(manifest.contract_evidence) && manifest.contract_evidence.length > 0, 'Captured primary pagination contract evidence is required');
  for (const evidence of manifest.contract_evidence) {
    requireValue(object(evidence) && text(evidence.locator, 1000) && /^[a-f0-9]{64}$/.test(evidence.sha256), 'Contract evidence needs a locator and SHA256');
    privateIntakePath(evidence.path); const bytes = readPage(evidence.path);
    requireValue(hash(bytes) === evidence.sha256, 'Contract evidence bytes are stale');
    const url = new URL(evidence.url), domain = manifest.provider === 'nist-rmm' ? /(?:^|\.)nist\.gov$/ : /(?:^|\.)cern\.ch$/;
    requireValue(url.protocol === 'https:' && !url.username && !url.password && domain.test(url.hostname), 'Contract evidence must be a primary locator for the selected provider');
  }
  const pages = manifest.pages.map(capture => inspectPage(capture, manifest.provider, readPage));
  const query = pages[0].query, collected = new Map(), history = [], overlapCaptures = [], paths = new Set(), signatures = new Map();
  if (previous !== null) {
    requireValue(object(previous) && previous.version === 1 && previous.provider === manifest.provider && previous.query === query && previous.scope === 'BOUNDED-CATALOGUE-METADATA' && previous.scientific_acceptance === 'NOT-PROMOTED' && previous.all_scientific_data_complete === false, 'Resume receipt has incompatible provider/query/evidence scope');
    requireValue(Array.isArray(previous.pages) && previous.pages.length > 0 && Array.isArray(previous.records), 'Resume receipt needs prior pages and native identities');
    requireValue(Array.isArray(previous.overlap_captures), 'Resume overlap evidence is required');
    requireValue(previous.state_sha256 === hash(JSON.stringify({pages: previous.pages, overlap_captures: previous.overlap_captures, records: previous.records, query})), 'Resume state digest is stale');
    const priorRecords = new Map();
    const recheck = prior => {
      const inspected = inspectPage(prior.capture, manifest.provider, readPage), {records: native, ...metadata} = inspected;
      requireValue(isDeepStrictEqual(metadata, prior), 'Prior capture metadata or identities no longer match the original bytes');
      for (const record of native) {
        const locator = {capture_path: prior.capture.path, capture_sha256: prior.capture.sha256, retrieved_at: prior.capture.retrieved_at, requested_url: prior.capture.requested_url, json_pointer: record.metadata_locator};
        const known = priorRecords.get(record.native_id);
        if (known) {
          requireValue(known.native_record_sha256 === record.native_record_sha256, 'Prior native identity has conflicting source versions');
          if (!known.locators.some(value => isDeepStrictEqual(value, locator))) known.locators.push(locator);
        } else priorRecords.set(record.native_id, {...record, locators: [locator]});
      }
    };
    for (const prior of previous.pages) {
      requireValue(object(prior) && pageUrl(prior.capture.requested_url, manifest.provider).query === query, 'Prior cursor escaped the resume query');
      recheck(prior); history.push(prior); paths.add(prior.capture.path); signatures.set(prior.native_id_signature, prior.page);
    }
    for (const prior of previous.overlap_captures) { recheck(prior); overlapCaptures.push(prior); }
    for (const record of previous.records) {
      requireValue(record.provider === manifest.provider && record.scientific_acceptance === 'NOT-PROMOTED' && /^[a-f0-9]{64}$/.test(record.native_record_sha256) && !collected.has(record.native_id), 'Invalid or duplicated resume native identity');
      requireValue(isDeepStrictEqual(priorRecords.get(record.native_id), record), 'Prior record metadata or locators no longer match its captured original');
      collected.set(record.native_id, structuredClone(record));
    }
    requireValue(priorRecords.size === collected.size, 'Prior receipt omitted captured native identities');
    const priorLast = previous.pages.at(-1), first = pages[0];
    requireValue(first.page === priorLast.page || (priorLast.next_url !== null && stableUrl(first.capture.requested_url) === stableUrl(priorLast.next_url)), 'Resume must overlap the last captured page or use its exact next cursor');
    if (first.page === priorLast.page) requireValue(isDeepStrictEqual(first.ordered_native_ids, priorLast.ordered_native_ids), 'Overlapping resume page changed native identities');
  } else requireValue(pages[0].page === 1, 'Fresh coverage must begin at page 1 or use a verified resume receipt');
  let duplicates = 0, overlap = 0;
  for (const [index, page] of pages.entries()) {
    requireValue(page.query === query, 'Captured pages changed query or page size');
    if (index > 0) requireValue(pages[index - 1].next_url !== null && stableUrl(page.capture.requested_url) === stableUrl(pages[index - 1].next_url), 'Captured pages skipped, repeated or contradicted the exact next cursor');
    const resumedOverlap = previous !== null && index === 0 && page.page === previous.pages.at(-1).page;
    requireValue(resumedOverlap || !paths.has(page.capture.path), 'Repeated raw capture path cannot advance coverage');
    requireValue(resumedOverlap || !signatures.has(page.native_id_signature), 'Repeated native-ID page cannot advance coverage, even when raw bytes differ');
    requireValue(resumedOverlap || page.records.length === 0 || page.records.some(record => !collected.has(record.native_id)), 'A page containing no new native IDs cannot advance coverage');
    for (const record of page.records) {
      const locator = {capture_path: page.capture.path, capture_sha256: page.capture.sha256, retrieved_at: page.capture.retrieved_at, requested_url: page.capture.requested_url, json_pointer: record.metadata_locator};
      const existing = collected.get(record.native_id);
      if (existing) {
        requireValue(existing.native_record_sha256 === record.native_record_sha256, 'Native record identity changed; retain a separate version review before resuming');
        duplicates++; if (!existing.locators.some(value => isDeepStrictEqual(value, locator))) existing.locators.push(locator);
      } else collected.set(record.native_id, {...record, locators: [locator]});
    }
    if (resumedOverlap) {
      overlap++;
      const {records: ignored, ...metadata} = page;
      if (!history.concat(overlapCaptures).some(value => isDeepStrictEqual(value, metadata))) overlapCaptures.push(metadata);
    }
    else {
      const {records, ...metadata} = page; history.push(metadata); paths.add(page.capture.path); signatures.set(page.native_id_signature, page.page);
    }
  }
  const last = pages.at(-1), records = [...collected.values()];
  const result = {version: 1, provider: manifest.provider, scope: 'BOUNDED-CATALOGUE-METADATA', scientific_acceptance: 'NOT-PROMOTED', all_scientific_data_complete: false,
    query, input_manifest_sha256: hash(JSON.stringify(manifest)), contract_evidence: manifest.contract_evidence.map(value => Object.fromEntries(['path', 'sha256', 'url', 'locator'].map(key => [key, value[key]]))),
    pagination_contract: manifest.provider === 'nist-rmm' ? 'OBSERVED-PAGE-NOT-OPENAPI-SKIP' : 'RETURNED-EXACT-NEXT-LINK',
    pages: history, overlap_captures: overlapCaptures, records, coverage: {captured_pages: history.length, unique_native_records: records.length, duplicate_records_in_batch: duplicates, overlapping_resume_pages: overlap,
      reported_total_at_last_capture: last.total, remaining_records_estimate_at_last_capture: Math.max(0, last.total - records.length), total_changed_between_captures: new Set(history.map(page => page.total)).size > 1,
      catalogue_snapshot_guaranteed: false, data_files_retrieved: 0, scientific_values_accepted: 0, source_ids_allocated: 0},
    continuation: {next_url: last.next_url, status: last.next_url === null ? 'QUERY-END-REPORTED-NOT-ALL-SCIENCE-COMPLETE' : 'NEXT-REQUEST-NOT-YET-RETRIEVED'},
    limitations: ['Catalogue search is mutable; totals and ordering describe captures, not an immutable full-site snapshot.', 'Metadata titles/types/licences/versions are source-reported leads; missing licences and versions remain UNKNOWN.', 'Data locators are preserved without downloading, executing or accepting their scientific contents.', 'Scientific acceptance requires the existing MAT source, owner, state, units, uncertainty and evidence review.']};
  result.state_sha256 = hash(JSON.stringify({pages: result.pages, overlap_captures: overlapCaptures, records, query}));
  return result;
}

function runCli() {
  const args = process.argv.slice(2), allowed = ['manifest', 'out', 'previous'];
  requireValue(args.every(arg => /^--[a-z]+=/.test(arg) && allowed.includes(arg.slice(2, arg.indexOf('=')))), 'Use --manifest=.mat-local/...json [--previous=...] [--out=.mat-local/intake/...json]');
  const options = Object.fromEntries(args.map(arg => [arg.slice(2, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)]));
  requireValue(args.length === Object.keys(options).length && options.manifest, 'One manifest and no repeated options are required');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const read = path => readFileSync(join(root, privateIntakePath(path)));
  const manifest = JSON.parse(read(options.manifest));
  const receipt = abstractCatalogue(manifest, {readPage: read, previous: options.previous ? JSON.parse(read(options.previous)) : null});
  const output = privateIntakePath(options.out ?? `.mat-local/intake/${manifest.provider}-${receipt.input_manifest_sha256.slice(0, 16)}.json`, {output: true});
  const destination = resolve(root, output), base = resolve(root, '.mat-local', 'intake');
  requireValue(destination.startsWith(base + sep), 'Output escaped private intake directory');
  const bytes = JSON.stringify(receipt, null, 2) + '\n';
  if (existsSync(destination)) requireValue(readFileSync(destination, 'utf8') === bytes, 'Existing intake output differs; use a new bounded checkpoint path');
  else { mkdirSync(dirname(destination), {recursive: true}); writeFileSync(destination, bytes, {flag: 'wx'}); }
  console.log(JSON.stringify({output, provider: receipt.provider, ...receipt.coverage, next_url: receipt.continuation.next_url, scientific_acceptance: receipt.scientific_acceptance}));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runCli(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

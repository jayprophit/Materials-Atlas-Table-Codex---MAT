import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {inspectCapturedPage, validateReconciliationReceipt, validateReconciliationContinuation} from '../chat-reconciliation.mjs';

const threadId = 'thread-one';
const page = () => ({thread: {id: threadId, title: 'Bounded MAT review'}, page: {hasMore: true, nextCursor: 'older'}, turns: [{id: 'turn-one', items: [
  {id: 'user-one', type: 'userMessage', content: [{type: 'text', text: 'See https://example.org/source and ::chatgpt-content-reference{index="0" source_message_id="opaque"}'}]},
  {id: 'assistant-one', type: 'agentMessage', text: 'throw new Error("never execute");', truncated: true}
]}], attachments: [{name: 'listed.pdf', path: 'file-service://listed'}]});
const capture = value => JSON.stringify({retrieved_at: '2026-10-06', thread_id: threadId, result: {isError: false, content: [{type: 'text', text: JSON.stringify(value)}]}});
const fixture = () => {
  const raw = capture(page()), inspected = inspectCapturedPage(raw, {expectedThreadId: threadId});
  const {attachments, ...metadata} = inspected;
  const publicAttachments = attachments.map(attachment => ({thread_id: threadId, name: attachment.name,
    path: '.mat-local/cycle/attachment.pdf', sha256: 'a'.repeat(64), bytes: 3,
    status: 'REFERENCED-NOT-VERIFIED', review_status: 'REVIEW-PENDING', standalone_panel_credit: 0}));
  return {raw, receipt: {version: 1, source_id: 'SRC-000514', scope: 'BOUNDED-CONVERSATION-RECONCILIATION', scientific_acceptance: 'NOT-PROMOTED', account_complete: false,
    pages: [{path: '.mat-local/cycle/page-one.json', ...metadata}], findings: [{id: 'finding-one', disposition: 'PENDING-REVIEW', existing_task_ids: ['MAT-UPDATE-20260929-013'], locators: [{thread_id: threadId, item_id: 'user-one'}], summary: 'Conversation candidate; independent source review pending.'}], attachments: publicAttachments}};
};
const sets = () => ({taskIds: new Set(['MAT-UPDATE-20260929-013']), sourceIds: new Set(['SRC-000514'])});

test('chat provenance follows existing selected tasks and rejects unknown or divergent generated continuation', () => {
  const create = () => {
    const continuation = {current_task_id: 'MAT-UPDATE-20260929-095', previous_current_task_id: 'MAT-PROGRAMME-DATA-FIRST', status: 'PARTIAL',
      chat_reconciliation: {path: 'data/intake/chat-reconciliation-2026-10-06.json', source_id: 'SRC-000514', sha256: 'b'.repeat(64), status: 'PARTIAL'}};
    return {review: {continuation}, ledger: {tasks: [{id: 'MAT-UPDATE-20260929-095', status: 'OPEN'}, {id: 'MAT-PROGRAMME-DATA-FIRST', status: 'OPEN'}, {id: 'MAT-EXISTING-NEXT', status: 'OPEN'}], continuation: structuredClone(continuation)}};
  };
  for (const id of ['MAT-UPDATE-20260929-095', 'MAT-EXISTING-NEXT']) {
    const {review, ledger} = create(); review.continuation.current_task_id = ledger.continuation.current_task_id = id;
    assert.deepEqual(validateReconciliationContinuation(review, ledger), {current_task_id: id, status: 'PARTIAL'});
  }
  for (const mutate of [
    (review, ledger) => review.continuation.current_task_id = ledger.continuation.current_task_id = 'MAT-UNKNOWN',
    (review, ledger) => ledger.tasks.push(structuredClone(ledger.tasks[0])),
    (review, ledger) => ledger.continuation.current_task_id = 'MAT-PROGRAMME-DATA-FIRST',
    (review, ledger) => ledger.continuation.previous_current_task_id = 'MAT-EXISTING-NEXT',
    (review, ledger) => ledger.continuation.status = 'COMPLETE',
    (review, ledger) => ledger.continuation.chat_reconciliation.sha256 = 'c'.repeat(64),
    (review, ledger) => ledger.continuation.chat_reconciliation.path = 'different.json',
    (review, ledger) => delete ledger.continuation.chat_reconciliation,
    (review, ledger) => review.continuation.status = ledger.continuation.status = ''
  ]) {
    const {review, ledger} = create(); mutate(review, ledger); assert.throws(() => validateReconciliationContinuation(review, ledger));
  }
});

test('nested tool wrapper preserves raw bytes, roles, unknown flags and unverified locators without execution', () => {
  const raw = capture(page()), p = inspectCapturedPage(Buffer.from(raw), {expectedThreadId: threadId});
  assert.equal(p.sha256, createHash('sha256').update(raw).digest('hex')); assert.equal(p.bytes, Buffer.byteLength(raw));
  assert.equal(p.message_count, 2); assert.equal(p.truncated_item_count, 1); assert.equal(p.unknown_truncation_item_count, 1);
  assert.deepEqual(p.items.map(i => [i.role, i.truncated, i.truncation_status]), [['user', null, 'NOT-REPORTED'], ['assistant', true, 'REPORTED-TRUNCATED']]);
  assert.equal(p.external_url_candidates[0].item_id, 'user-one'); assert.equal(p.external_url_candidates[0].status, 'UNVERIFIED-URL-CANDIDATE');
  assert.equal(p.opaque_references[0].status, 'OPAQUE-REFERENCE-NOT-RETRIEVED'); assert.equal(p.attachments[0].status, 'REFERENCED-NOT-VERIFIED');
  assert.equal(Object.hasOwn(p, 'text'), false);
});

test('malformed/error wrappers and returned identity mismatch fail', () => {
  for (const bad of ['{', JSON.stringify({result: null}), JSON.stringify({result: {isError: true, content: []}}), JSON.stringify({result: {content: []}})]) assert.throws(() => inspectCapturedPage(bad));
  assert.throws(() => inspectCapturedPage(capture(page()), {expectedThreadId: 'other'}), /IDs differ/);
  const w = JSON.parse(capture(page())); w.thread_id = 'other'; assert.throws(() => inspectCapturedPage(JSON.stringify(w)), /IDs differ/);
});

test('pagination must be explicit and coherent; cursor end never implies full coverage', () => {
  for (const mutate of [p => delete p.page.hasMore, p => delete p.page.nextCursor, p => p.page.nextCursor = null, p => { p.page.hasMore = false; }]) {
    const p = page(); mutate(p); assert.throws(() => inspectCapturedPage(capture(p)), /pagination|Pagination/);
  }
  const p = page(); p.page = {hasMore: false, nextCursor: null}; const r = inspectCapturedPage(capture(p));
  assert.equal(r.hasMore, false); assert.equal(r.unknown_truncation_item_count, 1); assert.equal(Object.hasOwn(r, 'complete'), false);
});

test('missing flags stay unknown while explicit invalid flags, missing identity and unsupported roles fail', () => {
  for (const mutate of [p => p.turns[0].items[0].truncated = null, p => p.turns[0].items[0].truncated = 'false', p => delete p.turns[0].items[0].id, p => p.turns[0].items[0].type = 'unknown', p => p.turns[0].items[0].role = 'assistant']) {
    const p = page(); mutate(p); assert.throws(() => inspectCapturedPage(capture(p)));
  }
  const p = page(); p.turns[0].items[0].truncated = false; assert.equal(inspectCapturedPage(capture(p)).items[0].truncated, false);
});

test('conflicting duplicate identity is rejected, including equal-length changed text; exact duplicate is counted once', () => {
  const p = page(); p.turns[0].items.push(structuredClone(p.turns[0].items[1])); assert.equal(inspectCapturedPage(capture(p)).message_count, 2);
  p.turns[0].items[2].text = 'X'.repeat(p.turns[0].items[1].text.length); assert.throws(() => inspectCapturedPage(capture(p)), /Conflicting duplicate/);
  p.turns[0].items[2] = {id: 'assistant-one', type: 'userMessage', content: [{type: 'text', text: 'same identity'}]}; assert.throws(() => inspectCapturedPage(capture(p)), /Conflicting duplicate/);
});

test('receipt validates exact private bytes and normalized metadata with derived coverage', () => {
  const {raw, receipt} = fixture(); const r = validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: () => raw});
  assert.equal(r.status, 'PRIVATE-HASHES-AND-METADATA-CHECKED'); assert.equal(r.scientific_acceptance, 'NOT-PROMOTED');
  assert.deepEqual(r.coverage, {page_count: 1, thread_count: 1, turn_count: 1, message_count: 2, truncated_item_count: 1, unknown_truncation_item_count: 1, pages_with_more: 1, cursor_end_pages: 0});
});

test('unavailable private input is explicit, and access errors are not disguised as missing input', () => {
  const {receipt} = fixture(); assert.equal(validateReconciliationReceipt(receipt, sets()).status, 'PRIVATE-INPUT-UNAVAILABLE');
  const absent = () => { throw Object.assign(new Error('missing'), {code: 'ENOENT'}); };
  assert.deepEqual(validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: absent}).unavailable_pages, ['.mat-local/cycle/page-one.json']);
  assert.throws(() => validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: () => { throw Object.assign(new Error('denied'), {code: 'EACCES'}); }}), /denied/);
});

test('stale hashes, altered metadata and mismatched coverage fail', () => {
  for (const mutate of [r => r.pages[0].sha256 = '0'.repeat(64), r => r.pages[0].title = 'changed', r => r.pages[0].items[0].chars++, r => r.coverage = {message_count: 99}, r => r.coverage = {misspelled_count: 99}]) {
    const {raw, receipt} = fixture(); mutate(receipt); assert.throws(() => validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: () => raw}), /Stale|mismatch|Unsupported/);
  }
});

test('sources, original task IDs and captured message locators must resolve', () => {
  for (const mutate of [r => r.source_id = 'SRC-ABSENT', r => r.findings[0].existing_task_ids = ['new-task'], r => r.findings[0].locators[0].item_id = 'absent', r => r.findings[0].source_ids = ['SRC-ABSENT'], r => r.findings[0].source_id = 'SRC-ABSENT']) {
    const {receipt} = fixture(); mutate(receipt); assert.throws(() => validateReconciliationReceipt(receipt, sets()));
  }
});

test('candidate receipt rejects science promotion, numeric scientific payloads and completeness assertions', () => {
  for (const mutate of [r => r.scope = 'ALL-ACCOUNT-CONVERSATIONS', r => r.scientific_acceptance = 'VERIFIED', r => r.account_complete = true, r => r.findings[0].disposition = 'COMPLETE', r => r.findings[0].measurements = [{value: 1}], r => r.findings[0].status = 'ESTABLISHED']) {
    const {receipt} = fixture(); mutate(receipt); assert.throws(() => validateReconciliationReceipt(receipt, sets()));
  }
});

test('private paths, counts, duplicate receipt identities and contradictory truncation labels fail', () => {
  for (const mutate of [r => r.pages[0].path = '.mat-local/../public.json', r => r.pages.push(structuredClone(r.pages[0])), r => r.pages[0].truncated_item_count = 0, r => r.pages[0].items[0].truncation_status = 'REPORTED-NOT-TRUNCATED', r => r.pages[0].items.push(structuredClone(r.pages[0].items[0]))]) {
    const {receipt} = fixture(); mutate(receipt); assert.throws(() => validateReconciliationReceipt(receipt, sets()));
  }
});

test('coverage aliases and external URL leads retain their candidate status and exact locators', () => {
  const {receipt} = fixture(); receipt.coverage = {pages: 1, threads: 1, turns: 1, messages: 2, truncated_items: 1, unknown_truncation_items: 1, pages_with_more: 1, cursor_end_pages: 0};
  receipt.external_references = [{url: 'https://example.org/source', status: 'UNVERIFIED-REFERENCE-LEAD', thread_id: threadId, item_id: 'user-one'}];
  assert.equal(validateReconciliationReceipt(receipt, sets()).status, 'PRIVATE-INPUT-UNAVAILABLE');
  receipt.external_references[0].status = 'VERIFIED'; assert.throws(() => validateReconciliationReceipt(receipt, sets()));
  receipt.external_references[0].status = 'UNVERIFIED-REFERENCE-LEAD'; receipt.external_references[0].url = 'file:///private'; assert.throws(() => validateReconciliationReceipt(receipt, sets()));
  receipt.external_references[0].url = 'https://example.org/source'; receipt.external_references[0].item_id = 'absent'; assert.throws(() => validateReconciliationReceipt(receipt, sets()));
});

test('single and double colon opaque content references are retained once with exact item locators', () => {
  const p = page(); p.turns[0].items[0].content[0].text = ':chatgpt-content-reference{index="0" source_message_id="one"} ::chatgpt-content-reference{index="1" source_message_id="two"}';
  const inspected = inspectCapturedPage(capture(p));
  assert.equal(inspected.opaque_references.length, 2);
  assert.deepEqual(inspected.opaque_references.map(reference => reference.item_id), ['user-one', 'user-one']);
  assert.equal(inspected.opaque_references[0].reference.startsWith(':chatgpt'), true);
  assert.equal(inspected.opaque_references[1].reference.startsWith('::chatgpt'), true);
});

test('URL leads remove advertising trackers, retain functional query/fragment and never expose original tokens', () => {
  const p = page(); const url = 'https://example.org/paper?edition=2&utm_source=private-campaign&gclid=private-click&GBRAID=private-braid&wbraid=private-web&utm_medium=private-medium#section';
  p.turns[0].items[0].content[0].text = url;
  const raw = capture(p), inspected = inspectCapturedPage(raw), candidate = inspected.external_url_candidates[0];
  assert.equal(candidate.url, 'https://example.org/paper?edition=2#section'); assert.equal(candidate.sanitized, true);
  assert.equal(JSON.stringify(inspected).includes('private-campaign'), false); assert.equal(JSON.stringify(inspected).includes('private-click'), false);
  assert.equal(inspected.sha256, createHash('sha256').update(raw).digest('hex'));
});

test('ellipsis, invisible characters, credentials and truncated URL boundaries become nonclickable hashed metadata', () => {
  const p = page(); p.turns[0].items[0].content[0].text = 'https://example.org/... https://example.org/a… https://example.org/a\u200bb https://example.org/a%E2%80%8Bb https://user:private-password@example.org/source';
  p.turns[0].items[1].text = 'Earlier https://example.org/intact then https://example.org/cut';
  const inspected = inspectCapturedPage(capture(p));
  assert.deepEqual(inspected.external_url_candidates.map(candidate => candidate.url), ['https://example.org/intact']);
  assert.equal(inspected.incomplete_opaque_references.length, 6);
  for (const reference of inspected.incomplete_opaque_references) {
    assert.equal(Object.hasOwn(reference, 'url'), false); assert.match(reference.reference_sha256, /^[a-f0-9]{64}$/);
  }
  assert.equal(JSON.stringify(inspected).includes('private-password'), false);
});

test('public item and reference metadata reject captured bodies, extra fields and temporary paths', () => {
  for (const mutate of [r => r.pages[0].items[0].text = 'private message', r => r.pages[0].items[0].unexpected = 'body', r => r.pages[0].external_url_candidates[0].body = 'private message', r => r.pages[0].extra = {message_body: 'private message'}, r => r.findings[0].extra = {text: 'private message'}, r => r.pages[0].temporary_path = 'C:\\Users\\person\\AppData\\Local\\Temp\\private.json']) {
    const {receipt} = fixture(); mutate(receipt); assert.throws(() => validateReconciliationReceipt(receipt, sets()), /metadata|temporary/);
  }
});

test('public attachments require private relative paths, hashes, captured thread and zero panel credit', () => {
  for (const mutate of [a => a.original_temp_path = 'C:\\Temp\\private.pdf', a => a.text = 'private body', a => a.path = 'C:\\Users\\person\\Downloads\\file.pdf', a => a.path = '.mat-local/../public.pdf', a => a.sha256 = 'wrong', a => a.bytes = -1, a => a.thread_id = 'uncaptured', a => a.standalone_panel_credit = 1]) {
    const {receipt} = fixture(); mutate(receipt.attachments[0]); assert.throws(() => validateReconciliationReceipt(receipt, sets()));
  }
});

test('external URL promotion cannot substitute an arbitrary URL for a valid captured item', () => {
  const {receipt} = fixture(); receipt.external_references = [{url: 'https://different.example/source', status: 'UNVERIFIED-REFERENCE-LEAD', thread_id: threadId, item_id: 'user-one'}];
  assert.throws(() => validateReconciliationReceipt(receipt, sets()), /does not match/);
  receipt.external_references[0].url = receipt.pages[0].external_url_candidates[0].url;
  assert.equal(validateReconciliationReceipt(receipt, sets()).status, 'PRIVATE-INPUT-UNAVAILABLE');
  receipt.external_references[0].role = 'assistant'; assert.throws(() => validateReconciliationReceipt(receipt, sets()), /contradicts/);
  delete receipt.external_references[0].role;
  receipt.pages[0].external_url_candidates[0].url += '?utm_source=private';
  assert.throws(() => validateReconciliationReceipt(receipt, sets()), /tracking/);
});

test('private freshness also binds extracted URL, opaque marker and incomplete-reference metadata', () => {
  for (const mutate of [r => r.pages[0].external_url_candidates[0].url = 'https://different.example/source', r => r.pages[0].opaque_references[0].reference = ':chatgpt-content-reference{index="0" source_message_id="changed"}', r => r.pages[0].incomplete_opaque_references = [{reference_sha256: 'a'.repeat(64), chars: 10, reason: 'ELLIPSIS', thread_id: threadId, item_id: 'user-one', role: 'user', turn_id: 'turn-one', status: 'INCOMPLETE-OPAQUE-REFERENCE-NOT-RETRIEVED'}]]) {
    const {raw, receipt} = fixture(); mutate(receipt); assert.throws(() => validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: () => raw}), /Stale private reference/);
  }
});

test('attachment names cannot be invented when the original capture is available', () => {
  const {raw, receipt} = fixture();
  const result = validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: () => raw});
  assert.equal(result.checked_attachment_associations, 1); assert.deepEqual(result.unavailable_attachment_associations, []);
  receipt.attachments[0].name = 'invented.pdf';
  assert.throws(() => validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: () => raw}), /thread\/name/);
  const unavailable = validateReconciliationReceipt(receipt, sets());
  assert.equal(unavailable.status, 'PRIVATE-INPUT-UNAVAILABLE'); assert.equal(unavailable.checked_attachment_associations, 0);
  assert.deepEqual(unavailable.unavailable_attachment_associations, [{thread_id: threadId, name: 'invented.pdf'}]);
});

test('attachment cannot be reassigned to another captured thread which lists no attachments', () => {
  const {raw, receipt} = fixture(), second = page();
  second.thread.id = 'thread-two'; second.attachments = [];
  const secondRaw = JSON.stringify(second), inspected = inspectCapturedPage(secondRaw);
  const {attachments, ...metadata} = inspected;
  receipt.pages.push({path: '.mat-local/cycle/page-two.json', ...metadata});
  receipt.attachments[0].thread_id = 'thread-two';
  const read = path => path.endsWith('page-two.json') ? secondRaw : raw;
  assert.throws(() => validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: read}), /thread\/name/);
  const partial = validateReconciliationReceipt(receipt, {...sets(), readPrivateFile: path => path.endsWith('page-two.json') ? undefined : raw});
  assert.equal(partial.status, 'PARTIAL-PRIVATE-INPUT-VERIFICATION');
  assert.deepEqual(partial.unavailable_attachment_associations, [{thread_id: 'thread-two', name: 'listed.pdf'}]);
});

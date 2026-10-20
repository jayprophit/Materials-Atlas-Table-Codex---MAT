// Bounded conversation evidence only. Parsing never executes message text or promotes science.
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const count = value => Number.isSafeInteger(value) && value >= 0;
const identity = (thread, item) => JSON.stringify([thread, item]);
const dispositions = new Set(['EXISTING', 'PARTIAL', 'RESEARCH', 'DUPLICATE', 'UNRESOLVED', 'OUTSIDE-SCOPE', 'DEFERRED', 'PENDING-REVIEW']);
const metadataKeys = ['thread_id', 'title', 'hasMore', 'nextCursor', 'turn_count', 'message_count', 'truncated_item_count', 'unknown_truncation_item_count'];
const itemKeys = ['id', 'role', 'truncated', 'chars', 'turn_id'];
const itemMetadata = item => Object.fromEntries(itemKeys.map(key => [key, item[key]]));
const locatorKeys = ['thread_id', 'item_id', 'role', 'turn_id'];
const candidateKeys = ['url', ...locatorKeys, 'status', 'sanitized'];
const opaqueKeys = ['reference', ...locatorKeys, 'status'];
const incompleteKeys = ['reference_sha256', 'chars', 'reason', ...locatorKeys, 'status'];
const attachmentKeys = ['thread_id', 'name', 'path', 'sha256', 'bytes', 'review_status', 'status', 'standalone_panel_credit', 'error'];
const privateJsonPath = path => typeof path === 'string' && /^\.mat-local\/[A-Za-z0-9_./-]+\.json$/.test(path) && !path.split('/').some(part => part === '..' || part === '.');
const privateAssetPath = path => typeof path === 'string' && /^\.mat-local\/[A-Za-z0-9_./-]+$/.test(path) && !path.split('/').some(part => part === '..' || part === '.');
const allowKeys = (value, keys, label) => requireValue(object(value) && Object.keys(value).every(key => keys.includes(key)), label + ' must contain metadata only');

function safeUrl(token, truncatedAtBoundary = false) {
  // Test the captured token before removing punctuation: an ellipsis is not a complete link.
  let decoded; try { decoded = decodeURIComponent(token); } catch { return {reason: 'INVALID-URL'}; }
  if (/\.{3}|…/u.test(decoded)) return {reason: 'ELLIPSIS'};
  if (/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff\u0000-\u001f\u007f]/u.test(decoded)) return {reason: 'INVISIBLE-OR-CONTROL-CHARACTER'};
  if (truncatedAtBoundary) return {reason: 'TRUNCATED-ITEM-BOUNDARY'};
  const clean = token.replace(/[),.;\]}]+$/, '');
  let url; try { url = new URL(clean); } catch { return {reason: 'INVALID-URL'}; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return {reason: 'UNSAFE-URL'};
  let sanitized = false;
  for (const key of [...url.searchParams.keys()]) if (/^(?:gclid|gbraid|wbraid|utm_.*)$/i.test(key)) {
    url.searchParams.delete(key); sanitized = true;
  }
  return {url: url.href, ...(sanitized ? {sanitized: true} : {})};
}

function rejectPrivateContent(value) {
  if (Array.isArray(value)) { value.forEach(rejectPrivateContent); return; }
  if (typeof value === 'string') {
    requireValue(!/(?:[a-z]:[\\/]|\\\\)[^\r\n]*(?:[\\/](?:temp|tmp)[\\/])/i.test(value) && !/^\/(?:tmp|var\/tmp)\//.test(value), 'Private temporary absolute paths are not public metadata');
    return;
  }
  if (!object(value)) return;
  for (const [key, child] of Object.entries(value)) {
    requireValue(!/^(?:text|body|message|raw|(?:raw|captured|message|source)_(?:text|body|content|message)|content|parts|original_temp_path|raw_reference|raw_url|original_url)$/i.test(key), 'Captured message bodies and private raw fields are not public metadata');
    rejectPrivateContent(child);
  }
}

function textContent(item) {
  if (Object.hasOwn(item, 'text')) {
    requireValue(typeof item.text === 'string', 'Message text must be a string');
    return item.text;
  }
  requireValue(Array.isArray(item.content), 'Message content or text is required');
  return item.content.filter(part => part?.type === 'text').map(part => {
    requireValue(typeof part.text === 'string', 'Text content must be a string');
    return part.text;
  }).join('\n');
}

function unwrap(value) {
  requireValue(object(value), 'Captured page must be an object');
  const envelope = Object.hasOwn(value, 'result') ? value.result : value;
  requireValue(object(envelope), 'Malformed result wrapper');
  if (Object.hasOwn(value, 'result')) requireValue(typeof envelope.isError === 'boolean', 'Explicit result error flag is required');
  if (Object.hasOwn(envelope, 'isError')) requireValue(envelope.isError === false, 'Captured tool response is an error or has an invalid error flag');
  if (Object.hasOwn(envelope, 'content')) {
    requireValue(Array.isArray(envelope.content), 'Malformed MCP content');
    const texts = envelope.content.filter(part => part?.type === 'text');
    requireValue(texts.length === 1 && typeof texts[0].text === 'string', 'One JSON text response is required');
    return JSON.parse(texts[0].text);
  }
  return envelope;
}

function attachmentMetadata(attachment, index) {
  requireValue(object(attachment), 'Malformed attachment metadata');
  const result = {index, status: 'REFERENCED-NOT-VERIFIED', name: null, locators: []};
  if (typeof attachment.name === 'string') result.name = attachment.name;
  for (const key of ['path', 'url', 'asset_pointer', 'file_id', 'id']) {
    if (typeof attachment[key] === 'string') result.locators.push({kind: key, value: attachment[key]});
  }
  for (const key of ['mimeType', 'mime_type', 'sha256', 'bytes']) if (Object.hasOwn(attachment, key)) {
    requireValue(key === 'bytes' ? count(attachment[key]) : typeof attachment[key] === 'string', 'Invalid attachment metadata');
    result[key] = attachment[key];
  }
  return result;
}

/** Parse raw captured JSON bytes. An omitted connector truncation flag remains UNKNOWN. */
export function inspectCapturedPage(raw, {expectedThreadId} = {}) {
  requireValue(typeof raw === 'string' || Buffer.isBuffer(raw), 'Captured input must be a string or Buffer');
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8');
  const outer = JSON.parse(bytes.toString('utf8')), page = unwrap(outer);
  requireValue(object(page) && object(page.thread) && nonempty(page.thread.id) && nonempty(page.thread.title), 'Thread identity and title are required');
  for (const expected of [expectedThreadId, outer.thread_id]) if (expected !== undefined) {
    requireValue(nonempty(expected) && expected === page.thread.id, 'Requested and returned thread IDs differ');
  }
  requireValue(object(page.page) && typeof page.page.hasMore === 'boolean' && Object.hasOwn(page.page, 'nextCursor'), 'Explicit pagination fields are required');
  const {hasMore, nextCursor} = page.page;
  requireValue(hasMore ? nonempty(nextCursor) : nextCursor === null, 'Pagination cursor contradicts hasMore');
  requireValue(Array.isArray(page.turns) && Array.isArray(page.attachments), 'Turns and attachments arrays are required');
  const items = [], seen = new Map(), turns = new Set(), external = [], opaque = [], incomplete = [];
  for (const turn of page.turns) {
    requireValue(object(turn) && nonempty(turn.id) && Array.isArray(turn.items), 'Turn identity and items are required');
    requireValue(!turns.has(turn.id), 'Duplicate turn identity');
    turns.add(turn.id);
    for (const item of turn.items) {
      requireValue(object(item) && nonempty(item.id), 'Message item identity is required');
      const role = item.type === 'userMessage' ? 'user' : item.type === 'agentMessage' ? 'assistant' : null;
      requireValue(role && (!Object.hasOwn(item, 'role') || item.role === role), 'Explicit message type/role is required and must agree');
      const truncated = Object.hasOwn(item, 'truncated') ? item.truncated : null;
      requireValue(truncated === null && !Object.hasOwn(item, 'truncated') || typeof truncated === 'boolean', 'Reported truncation must be boolean');
      const text = textContent(item), observation = {id: item.id, role, truncated, chars: text.length, turn_id: turn.id};
      const previous = seen.get(item.id);
      if (previous) {
        requireValue(isDeepStrictEqual(previous.metadata, observation) && previous.text === text, 'Conflicting duplicate item identity');
        continue;
      }
      seen.set(item.id, {metadata: observation, text});
      items.push({...observation, truncation_status: truncated === null ? 'NOT-REPORTED' : truncated ? 'REPORTED-TRUNCATED' : 'REPORTED-NOT-TRUNCATED'});
      const locator = {thread_id: page.thread.id, item_id: item.id, role, turn_id: turn.id};
      for (const match of text.matchAll(/https?:\/\/[^\s<>"`]+/g)) {
        const candidate = safeUrl(match[0], truncated === true && text.slice(match.index + match[0].length).trim() === '');
        if (candidate.reason) incomplete.push({reference_sha256: hash(match[0]), chars: match[0].length, reason: candidate.reason,
          ...locator, status: 'INCOMPLETE-OPAQUE-REFERENCE-NOT-RETRIEVED'});
        else external.push({...candidate, ...locator, status: 'UNVERIFIED-URL-CANDIDATE'});
      }
      for (const match of text.matchAll(/(?<!:):{1,2}chatgpt-content-reference\{[^}\r\n]*\}|(?:chatgpt-conversation|file-service):\/\/[^\s<>"`]+/g)) {
        opaque.push({reference: match[0], ...locator, status: 'OPAQUE-REFERENCE-NOT-RETRIEVED'});
      }
    }
  }
  return {sha256: hash(bytes), bytes: bytes.length, thread_id: page.thread.id, title: page.thread.title,
    hasMore, nextCursor, turn_count: turns.size, message_count: items.length,
    truncated_item_count: items.filter(item => item.truncated === true).length,
    unknown_truncation_item_count: items.filter(item => item.truncated === null).length,
    items, attachments: page.attachments.map(attachmentMetadata), external_url_candidates: external,
    opaque_references: opaque, incomplete_opaque_references: incomplete};
}

function rejectPromotion(value) {
  if (Array.isArray(value)) { value.forEach(rejectPromotion); return; }
  if (!object(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(?:account_complete|all_chats_complete|all_conversations_complete|conversation_complete|complete|science_promoted)$/.test(key)) {
      requireValue(child === false, 'Completeness or scientific promotion must not be claimed');
    }
    requireValue(!/^(?:scientific_values|scientific_numeric_payload|measured_values|computed_values|physical_properties|measurements|canonical_data_changes)$/.test(key), 'Scientific payloads are not permitted in a reconciliation receipt');
    if (/^(?:status|acceptance|scientific_acceptance|implementation_status|epistemic_status|evidence_type)$/.test(key) && typeof child === 'string') {
      requireValue(!/^(?:COMPLETE|COMPLETED|IMPLEMENTED|VERIFIED|MEASURED|ESTABLISHED|ACCEPTED|SCIENTIFICALLY-VERIFIED)$/.test(child), 'Receipt cannot promote implementation or scientific status');
    }
    rejectPromotion(child);
  }
}

/** Follow the existing selector and generated ledger without pinning one programme task. */
export function validateReconciliationContinuation(review, ledger) {
  requireValue(object(review?.continuation) && object(ledger?.continuation) && Array.isArray(ledger.tasks), 'Existing selector and generated continuation are required');
  const selected = review.continuation, generated = ledger.continuation;
  requireValue(nonempty(selected.current_task_id) && ledger.tasks.filter(task => task?.id === selected.current_task_id).length === 1, 'Current selector must resolve uniquely to an existing task');
  requireValue(nonempty(selected.status), 'Current selector status is required');
  for (const key of ['current_task_id', 'previous_current_task_id', 'status']) {
    requireValue(selected[key] === generated[key], 'Generated continuation differs from selector: ' + key);
  }
  if (selected.previous_current_task_id !== undefined) {
    requireValue(nonempty(selected.previous_current_task_id) && ledger.tasks.filter(task => task?.id === selected.previous_current_task_id).length === 1, 'Previous selector must resolve uniquely to an existing task');
  }
  requireValue(object(selected.chat_reconciliation) && nonempty(selected.chat_reconciliation.path), 'Retained chat reconciliation link is required');
  requireValue(isDeepStrictEqual(selected.chat_reconciliation, generated.chat_reconciliation), 'Generated chat reconciliation link differs from selector');
  return {current_task_id: selected.current_task_id, status: selected.status};
}

/** Validate the public receipt; unavailable private bytes are explicitly not a freshness pass. */
export function validateReconciliationReceipt(receipt, {taskIds, sourceIds, readPrivateFile} = {}) {
  requireValue(object(receipt) && receipt.version === 1, 'Receipt version 1 is required');
  requireValue(receipt.scope === 'BOUNDED-CONVERSATION-RECONCILIATION' && receipt.scientific_acceptance === 'NOT-PROMOTED', 'Receipt must retain its bounded candidate-only evidence lane');
  requireValue(taskIds instanceof Set && sourceIds instanceof Set, 'Canonical task/source sets are required');
  requireValue(sourceIds.has(receipt.source_id), 'Receipt source is unregistered');
  rejectPromotion(receipt);
  rejectPrivateContent(receipt);
  requireValue(Array.isArray(receipt.pages) && receipt.pages.length > 0 && Array.isArray(receipt.findings), 'Receipt pages and findings are required');
  const paths = new Set(), threads = new Set(), located = new Map(), candidateLocations = new Set(), capturedAttachments = new Map(), unavailable = [], coverage = {page_count: 0, thread_count: 0, turn_count: 0, message_count: 0, truncated_item_count: 0, unknown_truncation_item_count: 0, pages_with_more: 0};
  let checked = 0;
  for (const page of receipt.pages) {
    requireValue(object(page) && privateJsonPath(page.path), 'Page input must be a private relative JSON path');
    requireValue(!paths.has(page.path), 'Duplicate receipt page path'); paths.add(page.path);
    requireValue(/^[a-f0-9]{64}$/.test(page.sha256 ?? '') && count(page.bytes) && page.bytes > 0, 'Page byte hash and length are required');
    requireValue(nonempty(page.thread_id) && nonempty(page.title) && typeof page.hasMore === 'boolean' && Object.hasOwn(page, 'nextCursor'), 'Page identity and pagination are required');
    requireValue(page.hasMore ? nonempty(page.nextCursor) : page.nextCursor === null, 'Receipt pagination contradicts cursor');
    for (const key of ['turn_count', 'message_count', 'truncated_item_count', 'unknown_truncation_item_count']) requireValue(count(page[key]), 'Invalid page count: ' + key);
    requireValue(Array.isArray(page.items) && page.message_count === page.items.length, 'Message count must match page item metadata');
    const pageIds = new Set(), turnIds = new Set();
    for (const item of page.items) {
      allowKeys(item, [...itemKeys, 'truncation_status'], 'Normalized item');
      requireValue(object(item) && nonempty(item.id) && nonempty(item.turn_id) && ['user', 'assistant'].includes(item.role) && (item.truncated === null || typeof item.truncated === 'boolean') && count(item.chars), 'Invalid normalized message metadata');
      requireValue(!pageIds.has(item.id), 'Duplicate receipt item identity'); pageIds.add(item.id); turnIds.add(item.turn_id);
      if (Object.hasOwn(item, 'truncation_status')) requireValue(item.truncation_status === (item.truncated === null ? 'NOT-REPORTED' : item.truncated ? 'REPORTED-TRUNCATED' : 'REPORTED-NOT-TRUNCATED'), 'Truncation status contradicts flag');
      const key = identity(page.thread_id, item.id), prior = located.get(key);
      requireValue(!prior || prior.role === item.role && prior.turn_id === item.turn_id, 'Conflicting cross-page item identity');
      located.set(key, item);
    }
    requireValue(turnIds.size <= page.turn_count, 'Turn count cannot be smaller than represented turns');
    requireValue(page.truncated_item_count === page.items.filter(item => item.truncated === true).length && page.unknown_truncation_item_count === page.items.filter(item => item.truncated === null).length, 'Truncation counts contradict items');
    const validPageLocator = entry => {
      requireValue(entry.thread_id === page.thread_id && pageIds.has(entry.item_id), 'Page reference locator does not resolve');
      const item = page.items.find(item => item.id === entry.item_id);
      requireValue(entry.role === item.role && entry.turn_id === item.turn_id, 'Page reference role/turn metadata contradicts message');
    };
    if (Object.hasOwn(page, 'external_url_candidates')) {
      requireValue(Array.isArray(page.external_url_candidates), 'URL candidates must be an array');
      for (const candidate of page.external_url_candidates) {
        allowKeys(candidate, candidateKeys, 'URL candidate'); validPageLocator(candidate);
        requireValue(candidate.status === 'UNVERIFIED-URL-CANDIDATE' && typeof candidate.url === 'string', 'URL candidate must remain unverified');
        const safe = safeUrl(candidate.url);
        requireValue(!safe.reason && !safe.sanitized && safe.url === candidate.url, 'URL candidate is incomplete, unsafe or contains tracking parameters');
        if (Object.hasOwn(candidate, 'sanitized')) requireValue(typeof candidate.sanitized === 'boolean', 'URL sanitization flag must be boolean');
        candidateLocations.add(JSON.stringify([candidate.url, candidate.thread_id, candidate.item_id]));
      }
    }
    if (Object.hasOwn(page, 'opaque_references')) {
      requireValue(Array.isArray(page.opaque_references), 'Opaque references must be an array');
      for (const reference of page.opaque_references) {
        allowKeys(reference, opaqueKeys, 'Opaque reference'); validPageLocator(reference);
        requireValue(reference.status === 'OPAQUE-REFERENCE-NOT-RETRIEVED' && typeof reference.reference === 'string' && /^(?::{1,2}chatgpt-content-reference\{[^}\r\n]*\}|(?:chatgpt-conversation|file-service):\/\/[^\s<>"`]+)$/.test(reference.reference), 'Opaque reference must retain only its marker/locator');
      }
    }
    if (Object.hasOwn(page, 'incomplete_opaque_references')) {
      requireValue(Array.isArray(page.incomplete_opaque_references), 'Incomplete opaque references must be an array');
      for (const reference of page.incomplete_opaque_references) {
        allowKeys(reference, incompleteKeys, 'Incomplete reference'); validPageLocator(reference);
        requireValue(reference.status === 'INCOMPLETE-OPAQUE-REFERENCE-NOT-RETRIEVED' && /^[a-f0-9]{64}$/.test(reference.reference_sha256 ?? '') && count(reference.chars) && ['ELLIPSIS', 'INVISIBLE-OR-CONTROL-CHARACTER', 'TRUNCATED-ITEM-BOUNDARY', 'INVALID-URL', 'UNSAFE-URL'].includes(reference.reason), 'Incomplete URL must remain nonclickable hashed metadata');
      }
    }
    threads.add(page.thread_id); coverage.page_count++; coverage.pages_with_more += Number(page.hasMore);
    for (const key of ['turn_count', 'message_count', 'truncated_item_count', 'unknown_truncation_item_count']) coverage[key] += page[key];
    let raw;
    if (readPrivateFile) {
      requireValue(typeof readPrivateFile === 'function', 'readPrivateFile must be a synchronous function');
      try { raw = readPrivateFile(page.path); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    }
    const associations = capturedAttachments.get(page.thread_id) ?? {unavailable: false, names: new Set()};
    capturedAttachments.set(page.thread_id, associations);
    if (raw === undefined || raw === null) { unavailable.push(page.path); associations.unavailable = true; continue; }
    const inspected = inspectCapturedPage(raw, {expectedThreadId: page.thread_id});
    requireValue(inspected.sha256 === page.sha256 && inspected.bytes === page.bytes, 'Stale private page hash or byte count: ' + page.path);
    for (const key of metadataKeys) requireValue(isDeepStrictEqual(page[key], inspected[key]), 'Stale private page metadata: ' + key);
    requireValue(isDeepStrictEqual(page.items.map(itemMetadata), inspected.items.map(itemMetadata)), 'Stale private item metadata'); checked++;
    for (const key of ['external_url_candidates', 'opaque_references', 'incomplete_opaque_references']) if (Object.hasOwn(page, key)) requireValue(isDeepStrictEqual(page[key], inspected[key]), 'Stale private reference metadata: ' + key);
    inspected.attachments.forEach(attachment => associations.names.add(attachment.name));
  }
  coverage.thread_count = threads.size;
  coverage.cursor_end_pages = coverage.page_count - coverage.pages_with_more;
  if (Object.hasOwn(receipt, 'coverage')) {
    requireValue(object(receipt.coverage), 'Malformed coverage counts');
    const aliases = {pages: 'page_count', threads: 'thread_count', turns: 'turn_count', messages: 'message_count', truncated_items: 'truncated_item_count', unknown_truncation_items: 'unknown_truncation_item_count'};
    for (const [key, actual] of Object.entries(receipt.coverage)) {
      const canonical = aliases[key] ?? key;
      if (typeof actual === 'number') requireValue(Object.hasOwn(coverage, canonical), 'Unsupported receipt coverage count: ' + key);
      if (Object.hasOwn(coverage, canonical)) requireValue(actual === coverage[canonical], 'Receipt coverage count mismatch: ' + key);
    }
  }
  if (Object.hasOwn(receipt, 'external_references')) {
    requireValue(Array.isArray(receipt.external_references), 'External reference candidates must be an array');
    for (const reference of receipt.external_references) {
      allowKeys(reference, [...candidateKeys, 'locators'], 'External reference');
      requireValue(object(reference) && reference.status === 'UNVERIFIED-REFERENCE-LEAD', 'External references must remain unverified leads');
      let url; try { url = new URL(reference.url); } catch { throw new Error('Invalid external reference URL'); }
      requireValue(['https:', 'http:'].includes(url.protocol), 'External references must use HTTP(S)');
      const locators = reference.locators ?? [{thread_id: reference.thread_id, item_id: reference.item_id}];
      requireValue(Array.isArray(locators) && locators.length > 0 && locators.every(locator => object(locator) && located.has(identity(locator.thread_id, locator.item_id))), 'External reference locator does not resolve');
      for (const locator of locators) {
        allowKeys(locator, locatorKeys, 'External reference locator');
        requireValue(candidateLocations.has(JSON.stringify([reference.url, locator.thread_id, locator.item_id])), 'External URL does not match a captured page candidate');
        const item = located.get(identity(locator.thread_id, locator.item_id));
        for (const key of ['role', 'turn_id']) if (Object.hasOwn(locator, key)) requireValue(locator[key] === item[key], 'External reference role/turn contradicts captured message');
      }
      if (!reference.locators) {
        const item = located.get(identity(reference.thread_id, reference.item_id));
        for (const key of ['role', 'turn_id']) if (Object.hasOwn(reference, key)) requireValue(reference[key] === item[key], 'External reference role/turn contradicts captured message');
      }
    }
  }
  const findingIds = new Set();
  for (const finding of receipt.findings) {
    requireValue(object(finding) && nonempty(finding.id) && !findingIds.has(finding.id) && dispositions.has(finding.disposition) && nonempty(finding.summary), 'Invalid candidate finding'); findingIds.add(finding.id);
    requireValue(Array.isArray(finding.existing_task_ids) && finding.existing_task_ids.length > 0 && finding.existing_task_ids.every(id => taskIds.has(id)), 'Finding must resolve to existing tasks');
    requireValue(Array.isArray(finding.locators) && finding.locators.length > 0, 'Finding message locators are required');
    for (const locator of finding.locators) requireValue(object(locator) && located.has(identity(locator.thread_id, locator.item_id)), 'Finding locator does not resolve to a captured message');
    if (Object.hasOwn(finding, 'source_ids')) requireValue(Array.isArray(finding.source_ids) && finding.source_ids.every(id => sourceIds.has(id)), 'Finding source is unregistered');
    if (Object.hasOwn(finding, 'source_id')) requireValue(sourceIds.has(finding.source_id), 'Finding source is unregistered');
  }
  let checkedAttachmentAssociations = 0;
  const unavailableAttachmentAssociations = [];
  if (Object.hasOwn(receipt, 'attachments')) {
    requireValue(Array.isArray(receipt.attachments), 'Attachments must be an array');
    for (const attachment of receipt.attachments) {
      allowKeys(attachment, attachmentKeys, 'Attachment');
      requireValue(attachment.status === 'REFERENCED-NOT-VERIFIED' && threads.has(attachment.thread_id), 'Attachment must remain unverified and resolve to a captured thread');
      requireValue(attachment.name === null || typeof attachment.name === 'string', 'Invalid attachment name');
      if (Object.hasOwn(attachment, 'path')) requireValue(privateAssetPath(attachment.path), 'Attachment path must be private and relative');
      if (Object.hasOwn(attachment, 'sha256')) requireValue(/^[a-f0-9]{64}$/.test(attachment.sha256 ?? ''), 'Invalid attachment hash');
      if (Object.hasOwn(attachment, 'bytes')) requireValue(count(attachment.bytes), 'Invalid attachment byte count');
      if (Object.hasOwn(attachment, 'standalone_panel_credit')) requireValue(attachment.standalone_panel_credit === 0, 'Listed attachments must not gain standalone panel credit');
      for (const key of ['review_status', 'error']) if (Object.hasOwn(attachment, key)) requireValue(typeof attachment[key] === 'string', 'Invalid attachment review/error metadata');
      const association = capturedAttachments.get(attachment.thread_id);
      if (association.names.has(attachment.name)) checkedAttachmentAssociations++;
      else if (association.unavailable) unavailableAttachmentAssociations.push({thread_id: attachment.thread_id, name: attachment.name});
      else throw new Error('Attachment thread/name does not match captured attachment metadata');
    }
  }
  return {structurally_valid: true, status: unavailable.length ? checked ? 'PARTIAL-PRIVATE-INPUT-VERIFICATION' : 'PRIVATE-INPUT-UNAVAILABLE' : 'PRIVATE-HASHES-AND-METADATA-CHECKED',
    scientific_acceptance: 'NOT-PROMOTED', checked_pages: checked, unavailable_pages: unavailable,
    checked_attachment_associations: checkedAttachmentAssociations, unavailable_attachment_associations: unavailableAttachmentAssociations, coverage};
}

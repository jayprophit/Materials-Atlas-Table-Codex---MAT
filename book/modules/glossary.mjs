// Shared terminology logic; scientific source review is a separate editorial task.
export const normalizeTerm = value => value.normalize('NFKC').toLowerCase().trim().replace(/[\s_-]+/g, ' ');
export function validateTerminology(owner) {
  if (owner?.schema_version !== '1.0.0' || owner.vocabulary_id !== 'MAT:VOCAB:GLOSSARY' || !Array.isArray(owner.terms)) throw Error('Invalid MAT terminology owner.');
  const ids = new Set(), labels = new Set();
  for (const term of owner.terms) {
    if (!/^MAT:TERM:\d{6}$/.test(term.term_id) || ids.has(term.term_id)) throw Error('Duplicate or invalid term identity.');
    ids.add(term.term_id);
    if (typeof term.definition_markdown !== 'string' || !term.definition_markdown.trim()) throw Error('Missing definition: ' + term.term_id);
    if (!['EDITORIAL-REFERENCE', 'AUTHORED-FRAMEWORK'].includes(term.domain) || term.review_status !== 'SOURCE-REVIEW-PENDING') throw Error('Unreviewed terminology must preserve its editorial status.');
    if (!Array.isArray(term.alternate_labels) || !Array.isArray(term.source_ids) || !Array.isArray(term.retained_variants)) throw Error('Missing terminology provenance arrays.');
    for (const label of [term.preferred_label, ...term.alternate_labels]) {
      if (typeof label !== 'string' || !label.trim() || /[\r\n<>]/.test(label) || labels.has(normalizeTerm(label))) throw Error('Duplicate or invalid term label.');
      labels.add(normalizeTerm(label));
    }
    for (const definition of [term, ...term.retained_variants]) {
      if (typeof definition.definition_markdown !== 'string' || !definition.definition_markdown.trim() || definition.review_status !== 'SOURCE-REVIEW-PENDING') throw Error('Invalid retained definition.');
      const origin = definition.origin;
      if (!origin || !/^[a-f0-9]{64}$/.test(origin.sha256) || !/^[a-f0-9]{64}$/.test(origin.original_sha256) || !origin.locator || !origin.original_path || !/^data\/research\/sources\/[a-z0-9-]+\.(md|json)$/.test(origin.snapshot)) throw Error('Missing or unsafe definition origin.');
    }
  }
  return owner;
}
export function projectTerminology(owner, ownerSha256) {
  validateTerminology(owner);
  return {schema_version: '1.0.0', vocabulary_id: owner.vocabulary_id, owner: {path: 'data/vocabularies/glossary.json', sha256: ownerSha256}, notice: owner.notice, chapter: 'docs/08-back-matter/00-Glossary.md', glossary: [...owner.terms].sort((a,b) => a.preferred_label < b.preferred_label ? -1 : a.preferred_label > b.preferred_label ? 1 : 0).map(term => ({...term, definition: term.definition_markdown.split(/\n\s*\n/)[0]}))};
}
export function glossaryLookup(projection) {
  if (projection?.vocabulary_id !== 'MAT:VOCAB:GLOSSARY' || !Array.isArray(projection.glossary) || !/^[a-f0-9]{64}$/.test(projection.owner?.sha256 ?? '')) throw Error('Invalid generated MAT glossary.');
  const lookup = new Map();
  for (const term of projection.glossary) {
    if (typeof term.definition !== 'string' || term.review_status !== 'SOURCE-REVIEW-PENDING') throw Error('Invalid glossary definition.');
    for (const label of [term.preferred_label, ...term.alternate_labels]) {
      const key = normalizeTerm(label);
      if (lookup.has(key)) throw Error('Ambiguous glossary label.');
      lookup.set(key, term);
    }
  }
  return lookup;
}

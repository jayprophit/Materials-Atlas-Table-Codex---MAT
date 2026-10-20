// Navigation diagnostics remain searchable, but are not a chapter's citations.
// Ordinary authored chapters continue to expose all unresolved citation IDs.
export function publicationCitations(text, chapterPath, knownSources, navigationDiagnostics = []) {
 const mentions = [...new Set(text.match(/SRC-\d{6}\b/g) ?? [])].sort();
 const diagnosticIds = chapterPath === 'docs/05-index/Source-Navigation.md' ? new Set(navigationDiagnostics) : new Set();
 const referenceDiagnostics = mentions.filter(id => !knownSources.has(id) && diagnosticIds.has(id)).map(source_id => ({source_id, role: 'UNRESOLVED-NAVIGATION-DIAGNOSTIC', owner: 'data/indexes/source-navigation.json'}));
 const sourceIds = mentions.filter(id => !referenceDiagnostics.some(d => d.source_id === id));
 return {sourceIds, missingSources: sourceIds.filter(id => !knownSources.has(id)), referenceDiagnostics};
}

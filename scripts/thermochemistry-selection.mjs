// Selection applies to existing source accessions, not every periodic-table identity.
export function parseThermochemistryArgs(args) {
  if (args.length === 0) return null;
  let raw;
  if (args.length === 2 && args[0] === '--elements') raw = args[1];
  else if (args.length === 1 && args[0].startsWith('--elements=')) raw = args[0].slice(11);
  else throw new Error('Usage: --elements 29,30 (or omit for all accessions)');
  if (!/^[1-9]\d*(?:,[1-9]\d*)*$/.test(raw)) throw new Error('Element selection must be comma-separated positive atomic numbers.');
  return raw.split(',').map(Number);
}

export function selectThermochemistryOwners(catalogue, requested = null) {
  const owners = [...catalogue.elements, ...(catalogue.source_gaps ?? [])];
  const available = new Set();
  for (const owner of owners) {
    if (!Number.isSafeInteger(owner.z) || owner.z <= 0 || available.has(owner.z) || owner.record_id !== 'MAT:' + String(owner.z).padStart(4, '0')) {
      throw new Error('Duplicate or invalid thermochemistry accession identity.');
    }
    available.add(owner.z);
  }
  if (requested !== null) {
    if (!Array.isArray(requested) || requested.length === 0) throw new Error('Empty element selection.');
    const seen = new Set();
    for (const z of requested) {
      if (!Number.isSafeInteger(z) || z <= 0 || seen.has(z)) throw new Error('Duplicate or invalid selected element.');
      if (!available.has(z)) throw new Error('No thermochemistry accession for selected element ' + z);
      seen.add(z);
    }
  }
  const selected = requested === null ? available : new Set(requested);
  return {
    elements: catalogue.elements.filter(owner => selected.has(owner.z)),
    source_gaps: (catalogue.source_gaps ?? []).filter(owner => selected.has(owner.z)),
  };
}

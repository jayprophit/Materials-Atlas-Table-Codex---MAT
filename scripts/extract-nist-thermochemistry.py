"""Accession reviewed public NIST pages and extract dated Shomate fits.

Usage: python scripts/extract-nist-thermochemistry.py [download-directory]
No network requests are made. Stored source bytes are never reformatted.
"""
from html.parser import HTMLParser
from pathlib import Path
from decimal import Decimal
import hashlib
import html
import json
import math
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
INPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else None
ACCESSIONS = json.loads((ROOT / 'data/catalog/nist-thermochemistry-accessions.json').read_text(encoding='utf-8'))
BASELINE = {e['z']: e for e in json.loads((ROOT / 'data/catalog/elements-baseline.json').read_text(encoding='utf-8'))['elements']}


def elemental_formula_atoms(formula, symbol):
    """Accept one canonical elemental species, never a compound or an ionic formula."""
    match = re.fullmatch(r'([A-Z][a-z]?)([1-9][0-9]*)?', formula)
    assert match is not None and match.group(1) == symbol, ('Unsupported elemental formula', formula, symbol)
    count = int(match.group(2) or '1')
    assert match.group(2) != '1' and count <= 9007199254740991, ('Noncanonical elemental formula', formula)
    return count


def index_cell(index_text, z, symbol):
    cells = re.findall(r'<td\b[^>]*>.*?</td>', index_text, re.S | re.I)
    matches = [c for c in cells if ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', c)).split()) == f'{z} {symbol}']
    assert len(matches) <= 1, ('Ambiguous JANAF index cell', z, symbol)
    return matches[0] if matches else None


class Tables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self.table, self.row, self.cell = [], None, None, None

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            assert self.table is None, 'Nested table requires parser review'
            self.table = {'label': dict(attrs).get('aria-label'), 'line': self.getpos()[0], 'rows': []}
        elif tag == 'tr' and self.table is not None:
            self.row = []
        elif tag in ('th', 'td') and self.row is not None:
            self.cell = []
        elif tag == 'br' and self.cell is not None:
            self.cell.append(' ')

    def handle_endtag(self, tag):
        if tag in ('th', 'td') and self.cell is not None:
            self.row.append(' '.join(''.join(self.cell).split()))
            self.cell = None
        elif tag == 'tr' and self.row is not None:
            self.table['rows'].append(self.row)
            self.row = None
        elif tag == 'table' and self.table is not None:
            self.tables.append(self.table)
            self.table = None

    def handle_data(self, value):
        if self.cell is not None:
            self.cell.append(value)


def parse(text):
    parser = Tables()
    parser.feed(text)
    return parser.tables


def number(raw):
    return float(raw.replace('×10', 'e').replace('−', '-'))


def publisher_temperature_resolution(fit, row):
    """Choose a matching fit endpoint as an interpretation of a rounded label.

    Uniqueness among these two endpoint candidates does not recover a unique
    hidden publisher temperature throughout the printed rounding interval.
    """
    bounds = fit['temperature_range']
    coefficients = {key: value['value'] for key, value in fit['coefficients'].items()}

    def agrees(temperature):
        if not bounds['min'] <= temperature <= bounds['max']:
            return False
        t = temperature / 1000
        a, b, c, d, e, f, g, h = (coefficients[k] for k in 'ABCDEFGH')
        values = {1: a + b*t + c*t*t + d*t**3 + e/t**2,
                  2: a*math.log(t) + b*t + c*t*t/2 + d*t**3/3 - e/(2*t*t) + g,
                  4: a*t + b*t*t/2 + c*t**3/3 + d*t**4/4 - e/t + f - h}
        return all(abs(value - number(row[index])) <= .5*10**(-len(row[index].split('.')[1] if '.' in row[index] else '')) + 1e-7
                   for index, value in values.items())

    nominal = number(row[0])
    if agrees(nominal):
        return {}
    printed = Decimal(row[0].replace('×10', 'e').replace('−', '-'))
    half_digit = Decimal('0.5') * (Decimal(10) ** printed.as_tuple().exponent)
    low, high = float(printed - half_digit), float(printed + half_digit)
    candidates = [temperature for temperature in sorted({bounds['min'], bounds['max']})
                  if low <= temperature <= high and agrees(temperature)]
    assert len(candidates) == 1, ('No unique candidate among source-fit endpoints for publisher rounding', fit['fit_id'], row, candidates)
    return {'calculation_temperature_K': candidates[0],
            'calculation_temperature_basis': 'SOURCE-FIT-BOUNDARY-WITHIN-PRINTED-TEMPERATURE-ROUNDING-CELL',
            'calculation_temperature_evidence': 'INTERPRETATION',
            'printed_temperature_rounding_interval_K': {'min': low, 'max': high}}


def retain(filename, input_filename, url):
    target = ROOT / 'data/catalog/sources' / filename
    candidate = INPUT / input_filename if INPUT is not None else target
    source = candidate if candidate.exists() else target
    data = source.read_bytes()
    assert b'NIST' in data and b'<html' in data.lower(), 'Source is not the expected NIST HTML response'
    if target.exists():
        assert target.read_bytes() == data, 'Refusing to replace a dated source snapshot'
    else:
        target.write_bytes(data)
    return data.decode('utf-8'), {'path': target.relative_to(ROOT).as_posix(), 'url': url,
                                'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def accession(item, suffix, url):
    z, date = item['z'], item['retrieved']
    return retain(f'nist-thermochemistry-{z:04}-{date}{suffix}.html.txt',
                  f'nist-thermo-{z:04}{suffix}.html', url)


def build():
    elements, gaps = [], []
    index = ACCESSIONS['coverage_index']
    index_text, index_snapshot = retain(index['filename'], index['input_filename'], index['url'])
    seen = set()
    for item in ACCESSIONS['accessions']:
        z, name, expected_formula = item['z'], item['name'], item['formula']
        cas, table_type, source_id = item.get('cas_digits'), item['comparison_table_type'], item.get('source_id')
        assert z not in seen, 'Duplicate element accession'
        seen.add(z)
        canonical = BASELINE[z]
        assert canonical['name'] == name, ('Canonical element name mismatch', z, name)
        integration = {key: item[key] for key in ('parent_integration', 'subject', 'asset_slots') if key in item}
        if integration:
            assert integration.get('parent_integration') == 'CURATED-APPEND-ONLY' and isinstance(integration.get('subject'), dict), 'Curated accession requires its explicit integration mode and subject binding'
        if 'asset_slots' in integration:
            slots = integration['asset_slots']
            assert isinstance(slots, dict) and set(slots) == {'table', 'graph'}, 'Curated asset slots require table and graph only'
            assert all(type(value) in (int, float) and 1 <= value <= 9007199254740991 and value == int(value) for value in slots.values()), 'Curated asset slots must be positive safe integers'
        atom_count = elemental_formula_atoms(expected_formula, canonical['symbol'])
        url = item.get('requested_url') or (f'https://webbook.nist.gov/cgi/cbook.cgi?ID=C{cas}&Mask=FFFF' if cas else None)
        result = item['expected_content']
        if result == 'LOOKUP-NOT-RETRIEVED':
            assert source_id is None, 'An unretrieved lookup must not claim an accessioned WebBook source'
            text, snapshot, formula = None, None, None
        else:
            assert url and source_id, 'A retained lookup needs its actual URL and registered source'
            text, snapshot = accession(item, '', url)
            formula_match = re.search(r'Formula</a>:</strong> (.*?)</li>', text, re.S)
            if result == 'NO-MATCH-IN-RETAINED-PAGE':
                assert formula_match is None and re.search(r'(Species not found|No matching species found|Name not found)', text, re.I), 'Expected a retained NIST no-match response'
                formula = None
            else:
                assert formula_match is not None, ('Source identity is missing', name)
                formula = html.unescape(re.sub(r'<[^>]+>', '', formula_match.group(1))).strip()
                assert formula == expected_formula, (name, formula)
                assert elemental_formula_atoms(formula, canonical['symbol']) == atom_count
        if result in ('NO-SHOMATE-IN-RETAINED-PAGE', 'NO-MATCH-IN-RETAINED-PAGE', 'LOOKUP-NOT-RETRIEVED'):
            assert text is None or not any('Heat Capacity (Shomate Equation)' in str(t['label']) for t in parse(text))
            assert table_type is None
            # This index points to element-organised PDFs, which may contain
            # compounds. A linked PDF requires its own species/phase/source review.
            cell = index_cell(index_text, z, canonical['symbol'])
            cell_status = 'ABSENT' if cell is None else ('LINKED-REQUIRES-SEPARATE-REVIEW' if re.search(r'<a\b', cell, re.I) else 'UNLINKED')
            legacy = result == 'NO-SHOMATE-IN-RETAINED-PAGE' and cell_status == 'UNLINKED'
            coverage = {'source_id': index['source_id'], 'retrieved': index['retrieved'],
                        'snapshot': index_snapshot, 'element_cell_as_reported': cell}
            if not legacy:
                coverage['element_cell_status'] = cell_status
            lookup_scope = {'NO-SHOMATE-IN-RETAINED-PAGE': 'No Shomate table in the retained elemental WebBook page',
                            'NO-MATCH-IN-RETAINED-PAGE': 'The retained WebBook query returned no matching species; no elemental identity or heat-capacity data are accepted',
                            'LOOKUP-NOT-RETRIEVED': 'The WebBook lookup was not retrieved; its content and elemental species identity remain UNKNOWN'}[result]
            index_scope = {'UNLINKED': 'the retained JANAF PDF index has no linked table for this element',
                           'LINKED-REQUIRES-SEPARATE-REVIEW': 'the retained JANAF index links an element-organised PDF requiring a separate species and phase review; no PDF values are accepted here',
                           'ABSENT': 'the retained JANAF index has no matching element cell; this does not establish absence from other sources'}[cell_status]
            gaps.append({'record_id': f'MAT:{z:04}', 'z': z, 'name': name, 'source_formula': formula,
                         'source_id': source_id, 'retrieved': item['retrieved'] if snapshot else None, 'snapshot': snapshot,
                         'coverage_index': coverage,
                         'heat_capacity_status': 'INSUFFICIENT DATA', 'fit_count': 0,
                         'source_review_result': result,
                         'scope': lookup_scope + '; ' + index_scope + '. This is a bounded source-availability result, not a claim that thermal measurements do not exist.',
                         'next_action': 'Review primary elemental heat-capacity measurements or a separate assessed thermodynamic source. Verify phase, molar basis, temperature, uncertainty and licence before accession. Do not substitute compound data.',
                         **({'requested_formula': expected_formula, 'species_identity_status': 'UNRESOLVED'} if formula is None else {}),
                         **({'reviewed': item['retrieved'], 'retrieval_status': 'NOT-RETRIEVED', 'requested_url': url} if snapshot is None else {})})
            continue
        assert item['expected_content'] == 'PUBLISHED-SHOMATE'
        if item.get('parent_integration') == 'CURATED-APPEND-ONLY':
            assert table_type == 'JANAFG', 'Curated thermochemistry GAS-only accession requires a JANAFG comparison table'
        table_text, table_snapshot = accession(item, '-table', item.get('publisher_table_url') or url + f'&Table=on&Type={table_type}')
        assert 'J/mol*K' in text and 'kJ/mol' in text
        fits = []
        for table in parse(text):
            if 'Heat Capacity (Shomate Equation)' not in str(table['label']):
                continue
            assert len(table['rows']) == 11
            phase = table['label'].split()[0].upper()
            labels = [r[0] for r in table['rows']]
            assert labels == ['Temperature (K)', *'ABCDEFGH', 'Reference', 'Comment']
            rows = dict((r[0], r[1:]) for r in table['rows'])
            width = len(rows['A'])
            assert all(len(row) == width for row in rows.values())
            for col in range(width):
                low, high = map(float, rows['Temperature (K)'][col].split(' to '))
                comment = rows['Comment'][col]
                phase_label = comment.split(';')[0] if 'phase;' in comment else 'UNSPECIFIED-IN-FIT-TABLE'
                coefficients = {key: {'raw': rows[key][col], 'value': number(rows[key][col])} for key in 'ABCDEFGH'}
                fits.append({'fit_id': f'MAT:{z:04}:THERMO:SHOMATE:{phase}:{col + 1:02}',
                             'source_id': source_id, 'source_locator': f"{snapshot['path']}#line={table['line']}",
                             'source_table': table['label'], 'source_column': col + 1,
                             'phase': phase, 'phase_label_as_reported': phase_label,
                             'temperature_range': {'min': low, 'max': high, 'unit': 'K', 'raw': rows['Temperature (K)'][col]},
                             'coefficients': coefficients, 'coefficient_uncertainty': 'UNKNOWN', 'coefficient_covariance': 'UNKNOWN',
                             'reference_as_reported': rows['Reference'][col], 'comment_as_reported': comment,
                             'evidence_status': 'PUBLISHED-EVALUATED-FIT', 'review_status': 'SOURCE-TRANSCRIBED; INDEPENDENT-SCIENTIFIC-REVIEW-PENDING'})
        if item.get('parent_integration') == 'CURATED-APPEND-ONLY':
            assert fits and all(fit['phase'] == 'GAS' for fit in fits), 'Curated thermochemistry GAS-only accession requires explicit phase binding for other retained phases; no fits are discarded'
        anchors = []
        anchor_phase = {'JANAFS': 'SOLID', 'JANAFL': 'LIQUID', 'JANAFG': 'GAS'}[table_type]
        # NIST outputs one calculated data table per coefficient column, including
        # separate columns for contiguous intervals of the same phase.
        anchor_tables = [t for t in parse(table_text) if t['label'] == 'Data from Shomate Coefficients']
        phase_fits = [f for f in fits if f['phase'] == anchor_phase]
        assert len(anchor_tables) == len(phase_fits), (name, len(anchor_tables), len(phase_fits))
        for fit, table in zip(phase_fits, anchor_tables):
            assert 'J/mol*K' in table['rows'][0][1] and 'kJ/mol' in table['rows'][0][-1]
            for row in table['rows'][1:]:
                assert len(row) == 5
                temperature = number(row[0])
                candidates = [fit['fit_id']]
                anchors.append({'temperature_K': temperature, 'candidate_fit_ids': candidates, 'raw': row,
                                'heat_capacity_J_mol_K': number(row[1]), 'entropy_J_mol_K': number(row[2]),
                                'enthalpy_increment_kJ_mol': number(row[4]),
                                'source_locator': f"{table_snapshot['path']}#line={table['line']}",
                                'purpose': 'PUBLISHER-ROUNDED-CALCULATION-CHECK; NOT-INDEPENDENT-EXPERIMENT',
                                **publisher_temperature_resolution(fit, row)})
        assert fits and anchors
        elements.append({'record_id': f'MAT:{z:04}', 'z': z, 'name': name, 'source_id': source_id,
                         'source_formula': formula, 'molar_basis': 'mol ' + formula,
                         'atoms_per_source_formula': atom_count,
                         'retrieved': item['retrieved'], 'snapshot': snapshot, 'publisher_table_snapshot': table_snapshot,
                         'heat_capacity_fits': fits, 'publisher_calculation_checks': anchors,
                         **integration,
                         **({'review_notes': item['review_notes']} if item.get('review_notes') else {})})
    output = {'registry_id': 'MAT:CATALOG:NIST-THERMOCHEMISTRY', 'generated_by': 'scripts/extract-nist-thermochemistry.py',
              'retrieved': max(i['retrieved'] for i in ACCESSIONS['accessions']),
              'scope': 'Dated, explicitly configured element accessions. Source-availability gaps are separate from accepted fits; the whole catalogue remains partial.',
              'element_count': len(elements), 'fit_count': sum(len(e['heat_capacity_fits']) for e in elements),
              'source_gap_count': len(gaps), 'elements': elements, 'source_gaps': gaps}
    (ROOT / 'data/catalog/thermochemistry-evaluation-index.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'elements': len(elements), 'source_gaps': len(gaps), 'fits': output['fit_count'], 'publisher_check_rows': sum(len(e['publisher_calculation_checks']) for e in elements)}))


if __name__ == '__main__':
    build()

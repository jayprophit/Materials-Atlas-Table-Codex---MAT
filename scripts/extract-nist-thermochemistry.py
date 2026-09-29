"""Accession reviewed public NIST pages and extract dated Shomate fits.

Usage: python scripts/extract-nist-thermochemistry.py [download-directory]
No network requests are made. Stored source bytes are never reformatted.
"""
from html.parser import HTMLParser
from pathlib import Path
import hashlib
import html
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
INPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else None
ACCESSIONS = json.loads((ROOT / 'data/catalog/nist-thermochemistry-accessions.json').read_text(encoding='utf-8'))


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
        cas, table_type, source_id = item['cas_digits'], item['comparison_table_type'], item['source_id']
        assert z not in seen, 'Duplicate element accession'
        seen.add(z)
        url = f'https://webbook.nist.gov/cgi/cbook.cgi?ID=C{cas}&Mask=FFFF'
        text, snapshot = accession(item, '', url)
        formula_html = re.search(r'Formula</a>:</strong> (.*?)</li>', text, re.S).group(1)
        formula = html.unescape(re.sub(r'<[^>]+>', '', formula_html)).strip()
        assert formula == expected_formula, (name, formula)
        if item['expected_content'] == 'NO-SHOMATE-IN-RETAINED-PAGE':
            assert not any('Heat Capacity (Shomate Equation)' in str(t['label']) for t in parse(text))
            assert table_type is None
            # An unlinked grey cell establishes coverage of this dated JANAF index
            # only. It does not establish that no measurements exist elsewhere.
            cells = re.findall(r'<td\b[^>]*>.*?</td>', index_text, re.S | re.I)
            cell = next(c for c in cells if re.search(r'\b' + re.escape(formula) + r'\b', re.sub(r'<[^>]+>', ' ', c)))
            assert '<a ' not in cell.lower(), 'JANAF coverage changed; review before retaining a gap'
            gaps.append({'record_id': f'MAT:{z:04}', 'z': z, 'name': name, 'source_formula': formula,
                         'source_id': source_id, 'retrieved': item['retrieved'], 'snapshot': snapshot,
                         'coverage_index': {'source_id': index['source_id'], 'retrieved': index['retrieved'],
                                            'snapshot': index_snapshot, 'element_cell_as_reported': cell},
                         'heat_capacity_status': 'INSUFFICIENT DATA', 'fit_count': 0,
                         'source_review_result': 'NO-SHOMATE-IN-RETAINED-PAGE',
                         'scope': 'No Shomate table in the retained elemental WebBook page; the retained JANAF PDF index has no linked table for this element. This is a bounded source-availability result, not a claim that thermal measurements do not exist.',
                         'next_action': 'Review primary elemental heat-capacity measurements or a separate assessed thermodynamic source. Verify phase, molar basis, temperature, uncertainty and licence before accession. Do not substitute compound data.'})
            continue
        assert item['expected_content'] == 'PUBLISHED-SHOMATE'
        table_text, table_snapshot = accession(item, '-table', url + f'&Table=on&Type={table_type}')
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
                assert fit['temperature_range']['min'] <= temperature <= fit['temperature_range']['max'], (name, row)
                candidates = [fit['fit_id']]
                anchors.append({'temperature_K': temperature, 'candidate_fit_ids': candidates, 'raw': row,
                                'heat_capacity_J_mol_K': number(row[1]), 'entropy_J_mol_K': number(row[2]),
                                'enthalpy_increment_kJ_mol': number(row[4]),
                                'source_locator': f"{table_snapshot['path']}#line={table['line']}",
                                'purpose': 'PUBLISHER-ROUNDED-CALCULATION-CHECK; NOT-INDEPENDENT-EXPERIMENT'})
        assert fits and anchors
        elements.append({'record_id': f'MAT:{z:04}', 'z': z, 'name': name, 'source_id': source_id,
                         'source_formula': formula, 'molar_basis': 'mol ' + formula,
                         'atoms_per_source_formula': 2 if formula == 'Cl2' else 1,
                         'retrieved': item['retrieved'], 'snapshot': snapshot, 'publisher_table_snapshot': table_snapshot,
                         'heat_capacity_fits': fits, 'publisher_calculation_checks': anchors,
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

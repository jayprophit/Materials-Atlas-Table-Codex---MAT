"""Preserve the displaced ninth-octave columns without inferring element joins."""
import hashlib
import json
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'data/research/sources/russell-universal-one-1926-loc.pdf'
EXPECTED_SHA = 'ddc2853038aa1027615aa8e00b00346b9ea0c06313c137c7751973c117896eaa'
assert hashlib.sha256((ROOT / SOURCE).read_bytes()).hexdigest() == EXPECTED_SHA
with pdfplumber.open(ROOT / SOURCE) as pdf:
    page = pdf.pages[117]
    words = [w for w in page.extract_words() if w['x0'] >= 460 and 185 < w['top'] < 592]
    rows = {}
    for word in words:
        rows.setdefault(round(word['top'], 1), []).append(word)
    entries = []
    for sequence, (top, row) in enumerate(sorted(rows.items()), 1):
        cells = []
        for word in row:
            field = 'symbol' if word['x0'] < 500 else 'atomic_mass' if word['x0'] < 560 else 'melting_point'
            cells.append({'field': field, 'raw_ocr': word['text'],
                          'unit': 'degC' if field == 'melting_point' else 'UNSPECIFIED-IN-TABLE' if field == 'atomic_mass' else None,
                          'bbox_points': [round(word[k], 4) for k in ('x0', 'top', 'x1', 'bottom')],
                          'uncertainty': 'UNKNOWN'})
        assert len({c['field'] for c in cells}) == len(cells)
        entries.append({'id': f'MAT:REF:RUSSELL:1926:P118:PROPERTY-ROW:{sequence:02}',
                        'source_id': 'SRC-000324', 'pdf_page': 118, 'printed_page': 98,
                        'top_points': top, 'cells': cells, 'joined_name_row_id': None,
                        'association_status': 'NAME-COLUMN-ALIGNMENT-REVIEW-REQUIRED',
                        'transcription_status': 'OCR-CHECKED-AGAINST-FACSIMILE-FIRST-REVIEW',
                        'evidence_status': 'HISTORICAL-AUTHOR-CLAIM'})
    result = {'registry_id': 'MAT:REG:RUSSELL-1926-P118-PROPERTY-CELLS', 'source_id': 'SRC-000324',
              'source_pdf': SOURCE, 'source_sha256': EXPECTED_SHA, 'pdf_page': 118, 'printed_page': 98,
              'page_size_points': [page.width, page.height], 'coordinate_origin': 'TOP-LEFT',
              'coordinate_note': 'OCR word bounds in PDF points; image glyph bounds can differ.',
              'scope': 'Every nonblank cell in the symbol, atomic mass and melting point columns of the ninth-octave table.',
              'method': 'pdfplumber word extraction, cropped by coordinates; 28 printed property rows visually checked. No chemical-identity join is inferred.',
              'facsimile': 'data/research/sources/russell-1926-charts/pdf-page-118.png',
              'counts': {'property_rows': len(entries), 'nonblank_cells': len(words),
                         **{field: sum(c['field'] == field for e in entries for c in e['cells']) for field in ('symbol', 'atomic_mass', 'melting_point')}},
              'entries': entries}
assert result['counts'] == {'property_rows': 28, 'nonblank_cells': 73, 'symbol': 28, 'atomic_mass': 27, 'melting_point': 18}
output = ROOT / 'data/research/russell-1926-p118-property-cells.json'
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result['counts']))

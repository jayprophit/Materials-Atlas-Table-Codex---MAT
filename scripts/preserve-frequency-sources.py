"""Verify exact source copies and inventory page coverage without rewriting originals.

Run from any directory. Optional --russell-text regenerates the source OCR corpus.
This does not validate the source's scientific claims or repair its typography.
"""
import hashlib, json, sys
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data/research'
specs = [
 ('SRC-000309', 'spooky2-frequency-list-2021.pdf', 24, 'https://www.spooky2-mall.com/download/spooky2rifefrequencylist.pdf', 'spooky2-frequency-list-2021-corpus.json'),
 ('SRC-000310', 'spooky2-frequency-list-2015.pdf', 171, 'User-supplied rife_frequency.pdf', 'spooky2-frequency-list-2015-corpus.json'),
 ('SRC-000311', 'rife-handbook-introduction-2021.pdf', 34, 'User-supplied RifeHandbook5thEdIntroduction.pdf', 'rife-handbook-introduction-2021-corpus.json'),
 ('SRC-000324', 'russell-universal-one-1926-loc.pdf', 290, 'https://tile.loc.gov/storage-services/service/gdc/gdclccn/27/00/45/08/27004508/27004508.pdf', 'russell-universal-one-1926-corpus.json'),
]
entries = []
for sid, name, count, origin, corpus in specs:
    path = OUT / 'sources' / name
    payload = path.read_bytes()
    digest = hashlib.sha256(payload).hexdigest()
    pdf = PdfReader(path)
    assert len(pdf.pages) == count, name
    extracted = json.loads((OUT / corpus).read_text(encoding='utf-8'))
    expected = extracted.get('sha256', extracted.get('source_sha256'))
    assert expected == digest, (name, expected, digest)
    if sid == 'SRC-000324' and '--russell-text' in sys.argv:
        extracted['pages'] = [{'pdf_page': i, 'text': p.extract_text() or '', 'status': 'SOURCE-OCR-TEXT-UNREVIEWED'} for i, p in enumerate(pdf.pages, 1)]
        (OUT / corpus).write_text(json.dumps(extracted, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    entries.append({'source_id': sid, 'path': str(path.relative_to(ROOT)).replace('\\','/'), 'origin': origin,
        'sha256': digest, 'bytes': len(payload), 'pdf_pages': count,
        'original_bytes_status': 'HASH-MATCHES-EXTRACTED-SOURCE', 'extraction': 'data/research/'+corpus,
        'scope': 'Supplied introduction/front matter only, not the complete handbook.' if sid == 'SRC-000311' else 'Complete retrieved PDF.',
        'semantic_review': 'PARTIAL', 'original_preserved': True})
facsimiles=[]
for path in sorted((OUT/'sources/russell-1926-charts').glob('pdf-page-*.png')):
    page=int(path.stem.split('-')[-1])
    facsimiles.append({'source_id':'SRC-000324','pdf_page':page,'path':str(path.relative_to(ROOT)).replace('\\','/'),
        'sha256':hashlib.sha256(path.read_bytes()).hexdigest(), 'derivation':'pdfplumber source-page raster rendering; no image generation or retouching',
        'dpi':140 if page in [16,109,111,112] else 160,
        'review':'SOURCE-PAGE-VISUALLY-INSPECTED; complete label/cell semantic review remains pending'})
assert len(facsimiles)==11
assert len({p['sha256'] for p in facsimiles})==11
result = {'registry_id': 'MAT:REG:FREQUENCY-SOURCE-PRESERVATION', 'schema_version': '1.0.0', 'date': '2026-09-27',
    'scope': 'All bytes and pages of these four PDFs. Later Russell editions and the full Rife Handbook are not included or claimed.',
    'coverage_rule': 'Exact PDF preservation includes artwork and typography; OCR and structured extraction can still be incomplete or inaccurate.',
    'sources': entries, 'total_pdf_pages': sum(e['pdf_pages'] for e in entries), 'page_facsimiles':facsimiles}
(OUT / 'frequency-source-preservation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'sources': len(entries), 'pages': result['total_pdf_pages'], 'bytes': sum(e['bytes'] for e in entries)}))

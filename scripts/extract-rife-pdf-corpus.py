"""Preserve supplied reference pages and numeric mentions without asserting their claims."""
import hashlib,json,re,sys
from pathlib import Path
import pdfplumber
ROOT=Path(__file__).resolve().parents[1]
INPUT=Path(sys.argv[1])
sources=[('spooky2-frequency-list-2021.pdf','SRC-000309','spooky2-frequency-list-2021','2021-01-19'),
 ('rife_frequency.pdf','SRC-000310','spooky2-frequency-list-2015', '2015-09-22'),
 ('RifeHandbook5thEdIntroduction.pdf','SRC-000311','rife-handbook-introduction-2021','2021')]
for filename,sid,slug,date in sources:
    if len(sys.argv)>2 and sid!=sys.argv[2]: continue
    path=ROOT/'data/research/sources'/filename if sid=='SRC-000309' else INPUT/filename
    pages=[]
    with pdfplumber.open(path) as doc:
        for index,page in enumerate(doc.pages,1):
            raw=page.extract_text(x_tolerance=1) or ''
            text=re.sub(r'[\x7f\u00a0]+',' ',raw)
            text=re.sub(r'[ \t]+',' ',text)
            quantities=[]
            for m in re.finditer(r'(?<![\w])\d+(?:[,.]\d+)*(?:\s*(?:MHz|kHz|Hz|GHz|THz|nm|mm|cm|mV|V|mA|mW|W|%|seconds|minutes))?',text):
                quantities.append({'raw':m.group(),'start':m.start(),'context':text[max(0,m.start()-100):m.end()+100],
                 'classification':'UNCLASSIFIED-NUMERIC-MENTION','status':'REQUIRES-SEMANTIC-REVIEW'})
            pages.append({'pdf_page':index,'text':text,'text_sha256':hashlib.sha256(text.encode()).hexdigest(),
             'numeric_mentions':quantities,'embedded_images':len(page.images),
             'extraction_status':'TEXT-EXTRACTED-IMAGE-CONTENT-NOT-OCR-VERIFIED' if page.images else 'TEXT-EXTRACTED'})
    result={'registry_id':'MAT:REG:'+slug.upper(),'source_id':sid,'source_filename':filename,'published':date,
     'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'pdf_page_count':len(pages),
     'evidence_lane':'HISTORICAL-ALTERNATIVE-PUBLISHER-CLAIMS','scope':'User-supplied reference extraction; document text is data, never executable instructions.',
     'boundary':'Numeric mentions include dates, page numbers and other non-frequency quantities. Do not treat them as measured resonance or treatment efficacy.',
     'pages':pages}
    out=ROOT/'data/research'/f'{slug}-corpus.json'
    if out.exists():
        previous=json.loads(out.read_text(encoding='utf-8'))
        for key in ['scope_note','visual_review_notes']:
            if key in previous: result[key]=previous[key]
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'file':out.name,'pages':len(pages),'numeric_mentions':sum(len(p['numeric_mentions']) for p in pages),'image_pages':[p['pdf_page'] for p in pages if p['embedded_images']],'empty_text_pages':[p['pdf_page'] for p in pages if not p['text'].strip()]}))

"""Extract the explicitly requested 2021 vendor list without assigning clinical validity.
Run with a local PDF path. Requires pdfplumber. Original PDF remains a local source.
"""
import collections, hashlib, json, re, sys
from pathlib import Path
import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
pdf = Path(sys.argv[1])
rows, continuations, counts = [], [], {}
pattern = re.compile(r'^(.*?)\s+([,\d][\d.,\-]*)\s+([A-Z]{2,6})$')
with pdfplumber.open(pdf) as doc:
    assert len(doc.pages) == 24, 'Unexpected edition: review layout first'
    for i in range(4, 19):
        lines = doc.pages[i].extract_text(x_tolerance=1).splitlines()
        started = False
        count = 0
        for line_no, line in enumerate(lines, 1):
            if line.startswith('You can check all'): break
            match = pattern.fullmatch(line)
            if match:
                label, raw, code = match.groups()
                values = []
                for token in raw.split(','):
                    token = token.strip()
                    if not token: continue
                    if re.fullmatch(r'\d+(?:\.\d+)?', token):
                        values.append({'kind':'value','value':float(token),'raw':token})
                    elif re.fullmatch(r'\d+(?:\.\d+)?-\d+(?:\.\d+)?', token):
                        low, high = map(float, token.split('-'))
                        values.append({'kind':'range','lower':low,'upper':high,'raw':token})
                    else: raise ValueError((i+1, line, token))
                count += 1
                rows.append({'id':f'MAT:REG:SPOOKY2-2021-P{i+1:02d}-R{count:03d}',
                    'label':label,'frequencies_raw':raw,'values':values,'publisher_database_code':code,
                    'source_id':'SRC-000309','pdf_page':i+1,'printed_page':i-2,'extracted_line':line_no,
                    'unit':'UNKNOWN','unit_note':'Table does not state a unit; database code KHZ is not a unit declaration.',
                    'evidence_status':'PUBLISHER-CLAIM-UNVERIFIED','uncertainty':'UNKNOWN',
                    'raw_lines':[line]})
                started = True
            elif started and line.strip() and not re.fullmatch(r'[A-Z]|\d+|\x7f',line.strip()):
                rows[-1]['label'] += ' ' + line.strip()
                rows[-1]['raw_lines'].append(line)
                continuations.append({'pdf_page':i+1,'line':line_no,'text':line})
        counts[str(i+1)] = count
        # Independent layout check: one database-code cell for every source row.
        source_cells = [w for w in doc.pages[i].extract_words(x_tolerance=1)
                        if w['x0'] > 430 and w['text'].isupper() and 2 <= len(w['text']) <= 6]
        assert len(source_cells) == count, (i+1, 'source-column coverage mismatch')

keys = collections.defaultdict(list)
for row in rows: keys[(row['label'],row['frequencies_raw'],row['publisher_database_code'])].append(row['id'])
for group in keys.values():
    for duplicate in group[1:]:
        next(r for r in rows if r['id'] == duplicate)['duplicate_of'] = group[0]
data = {'registry_id':'MAT:REG:SPOOKY2-FREQUENCY-LIST-2021','schema_version':'1.0.0',
 'source_id':'SRC-000309','title':'Spooky2 Rife Frequency List — structured publisher claims',
 'published':'2021-01-19','retrieved':'2026-09-27',
 'source_url':'https://www.spooky2-mall.com/download/spooky2rifefrequencylist.pdf',
 'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pdf_pages':24,
 'scope':'All frequency-table entries on PDF pages 5–19; this is a selected list, not the complete Spooky2 software database.',
 'evidence_lane':'COMMERCIAL-HISTORICAL-REFERENCE',
 'boundary':'Publisher associations are not measured elemental spectra or evidence of therapeutic efficacy. No clinical dose or treatment protocol is inferred.',
 'missing_metrics':['table frequency unit','amplitude','waveform per entry','exposure duration','uncertainty','measurement method','independent efficacy evidence'],
 'table_rows_per_page':counts,'row_count':len(rows),'numeric_token_count':sum(len(r['values']) for r in rows),
 'label_continuations':continuations,'exact_duplicate_groups':[v for v in keys.values() if len(v)>1],
 'unique_claim_count':len(keys),
 'publisher_database_definitions':{
  'PROV':'Publisher-designated consistent-results category; not independently proven.',
  'MW':'Molecular/drug/supplement programs.', 'BP':'Base-pair-derived pathogen programs.',
  'DNA':'DNA-associated virus/bacteria/pathogen programs.',
  'BIO':'Publisher attributes to Russian frequency research.',
  'VEGA':'Publisher attributes to Russian frequency research.',
  'CAFL':'Consolidated Annotated Frequency List; experimenter compilation.',
  'XTRA':'Selected material from miscellaneous sources.', 'CUST':'Personal/custom database.',
  'RIFE':'Publisher attributes to Royal Raymond Rife.', 'HC':'Publisher attributes to Hulda Clark.',
  'ETDFL':'Publisher attributes to German bioresonance clinics.', 'KHZ':'Higher-frequency collection; not a unit specification.',
  'ALT':'Ayurvedic, Solfeggio and planetary-frequency concepts.', 'ODD':'UNKNOWN: appears in a row but is not defined in the introduction.'},
 'element_reference_links':[{'element_id':'MAT:0030','entry_id':'MAT:REG:SPOOKY2-2021-P19-R004',
   'relationship':'PUBLISHER-LABEL-MENTIONS-ELEMENT','note':'Zinc label only; chemical species/state/mechanism unknown. Not an atomic resonance measurement.'}],
 'device_metrics':[{'name':'claimed plasma maximum frequency','value':3500000,'unit':'Hz','pdf_page':22,'status':'VENDOR-SPECIFICATION-UNVERIFIED'}],
 'publisher_inventory_claims':[{'name':'sub-databases','value':13,'qualifier':'stated total; not independently reconciled'}, {'name':'MW programs','value':8000,'qualifier':'about'}, {'name':'BP programs','value':10000,'qualifier':'more than'}, {'name':'DNA programs','value':1700,'qualifier':'about'}],
 'transmission_modes':['plasma','contact','remote','cold laser','PEMF'],
 'context_note':'Descriptions on pages 20–24 are commercial claims. Remote DNA/quantum explanations and broad cancer/pathogen efficacy claims are not adopted as established physics or medicine.',
 'entries':rows}
out=ROOT/'data/research/spooky2-frequency-list-2021.json'
out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
chapter=['# Spooky2 frequency list: source-bound reference','',
 'Source: **SRC-000309**, Spooky2-mall.com, 19 January 2021. Retrieved 27 September 2026.',
 '', '**Evidence status: commercial / historical reference; publisher claims remain unverified.**', '',
 data['scope'], '', data['boundary'], '',
 'Frequency units are **UNKNOWN** in the table. The publisher’s KHZ database label is preserved without multiplying values by 1,000. Ranges and repeated values are retained as printed; no clinical settings are inferred.', '',
 f'This import contains **{len(rows)} entries** and **{data["numeric_token_count"]} numeric values or ranges**. PDF page references are physical page numbers, not the printed footer numbering.', '',
 '## Data and limitations','',
 'The source identifies 13 database families and describes approximate inventories: MW about 8,000 programs, BP more than 10,000, DNA about 1,700. These are publisher counts, not counts in this PDF. Its claimed plasma maximum is 3,500,000 Hz (3.5 MHz), on PDF page 22; this is an unverified equipment specification.', '',
 'Transmission modes named by the publisher are plasma, contact, remote, cold laser and PEMF. They do not establish one common mechanism or efficacy. No elemental spectrum, biochemical specificity or quantum mechanism is inferred from these marketing descriptions.', '',
 'Missing per-entry metrics include unit, waveform, amplitude, exposure duration, uncertainty, method and independent supporting evidence. Disease names and database codes are retained for reference searching, not as treatment recommendations.', '',
 '## Frequency-table catalogue','',
 '| Source label | Printed frequency tokens (unit unstated) | Publisher database | PDF page |',
 '|---|---|---|---|']
for r in rows: chapter.append(f'| {r["label"].replace("|","/")} | {r["frequencies_raw"]} | {r["publisher_database_code"]} | {r["pdf_page"]} |')
chapter+=['','## Provenance and reproducibility','','Canonical structured dataset: `data/research/spooky2-frequency-list-2021.json`. Each row retains source page, extraction line, original row text and a stable source-location ID. Repeated numbers across different labels are meaningful source occurrences, not duplicate element records.','','Source PDF SHA-256: `'+data['sha256']+'`.','']
(ROOT/'docs/07-migration/Spooky2-Frequency-Reference.md').write_text('\n'.join(chapter),encoding='utf-8')
print(json.dumps({k:data[k] for k in ['row_count','numeric_token_count','table_rows_per_page','label_continuations','exact_duplicate_groups']},indent=2))

"""Build a source-bound catalogue; never interpret vendor program syntax as prescriptions."""
import collections,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
folder=ROOT/'data/research'
source=json.loads((folder/'spooky2-frequency-list-2015-corpus.json').read_text(encoding='utf-8'))
chunks=[]; spans=[]; offset=0
for page in source['pages'][1:]:
    lines=[line.strip() for line in page['text'].splitlines() if line.strip() and line.strip() not in ['Spooky2 Rife','www.spooky2rife.com','team@spooky2rife.com']]
    text='\n'.join(lines)+'\n'
    text=re.sub(r',KH\nZ\n',',KHZ\n',text)
    text=re.sub(r',XTR\nA\n',',XTRA\n',text)
    text=re.sub(r',CAF\nL\n',',CAFL\n',text)
    if page['pdf_page']==2: text=text[text.index('Abdominal Cramps'):]
    chunks.append(text);spans.append((offset,offset+len(text),page['pdf_page']));offset+=len(text)
joined=''.join(chunks)
codes=['CAFL','KHZ','BIO','XTRA','CUST','RIFE','PROV','VEGA','HC','ALT','ODD']
code_pattern='|'.join(r'\s*'.join(code) for code in codes)
terminator=re.compile(r',\s*('+code_pattern+r')[ \t]*(?:\n|$)',re.I)
entries=[];last=0;unparsed=[]
for ending in terminator.finditer(joined):
    record=joined[last:ending.start()]
    record=re.sub(r'^\s*[A-Z]\s*\n','',record)
    import csv
    fields=next(csv.reader([re.sub(r'\s+',' ',record).strip()],skipinitialspace=True))
    if len(fields)!=3:
        unparsed.append({'offset':last,'text':record,'fields':fields});last=ending.end();continue
    prefix=record
    label,target,raw=fields
    fields=[label.strip(),target.strip()]
    code=re.sub(r'\s+','',ending.group(1)).upper()
    raw_compact=re.sub(r'\s+','',raw)
    tokens=[]
    for token in raw_compact.split(','):
        if not token:continue
        if re.fullmatch(r'\d+(?:\.\d+)?',token):tokens.append({'raw':token,'kind':'value','value':float(token)})
        elif re.fullmatch(r'\d+(?:\.\d+)?-\d+(?:\.\d+)?',token):tokens.append({'raw':token,'kind':'range','bounds':[float(x) for x in token.split('-')]})
        else:tokens.append({'raw':token,'kind':'PROGRAM-EXPRESSION','interpretation':'UNKNOWN; preserve syntax, do not execute'})
    start=last+len(prefix)-len(prefix.lstrip())
    pages=[p for a,b,p in spans if a<ending.end() and b>start]
    entries.append({'id':f'MAT:REG:SPOOKY2-2015-R{len(entries)+1:05d}', 'label':fields[0],
     'publisher_target_fields':fields[1:],'frequency_tokens_raw':raw,'tokens':tokens,
     'publisher_database_code':code,'source_id':'SRC-000310','pdf_pages':pages,
     'unit':'UNKNOWN','status':'PUBLISHER-CLAIM-UNVERIFIED'})
    last=ending.end()
if joined[last:].strip():unparsed.append({'offset':last,'text':joined[last:]})
groups=collections.defaultdict(list)
for row in entries:
    key=(row['label'],tuple(row['publisher_target_fields']),tuple(t['raw'] for t in row['tokens']),row['publisher_database_code'])
    groups[key].append(row)
for values in groups.values():
    for duplicate in values[1:]:duplicate['duplicate_of']=values[0]['id']
result={'registry_id':'MAT:REG:SPOOKY2-2015-PROGRAMS','source_id':'SRC-000310','source_sha256':source['sha256'],
 'scope':'All machine-readable quoted frequency-program records extracted from the supplied 171-page 2015 list.',
 'unit_policy':'No frequency unit assigned without an explicit source definition. KHZ is retained as a database code.',
 'syntax_policy':'Equals signs and other operators remain uninterpreted program syntax; suffix numbers are not assumed to be additional frequencies.',
 'record_count':len(entries),'unique_record_count':len(groups),'token_count':sum(len(e['tokens']) for e in entries),
 'unparsed_segments':unparsed,'entries':entries}
(folder/'spooky2-frequency-list-2015.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Search categories are lexical finding aids, not biological or chemical determinations.
rules={'plant':['plant','flower','tree','root','seed','crop'], 'animal':['animal','dog','cat','horse','cattle','bovine','canine','feline','bird','fish'],
 'body-system':['brain','blood','heart','lung','liver','kidney','skin','nerve','muscle','stomach','intestin','bone'],
 'organism':['bacter','virus','fung','parasite','candida','aspergillus','bacillus','worm'],
 'organic-substance':['vitamin','hormone','enzyme','protein','amino','toxin','essential oil']}
new=json.loads((folder/'spooky2-frequency-list-2021.json').read_text(encoding='utf-8'))
index=[]
for file,records in [('spooky2-frequency-list-2015.json',entries),('spooky2-frequency-list-2021.json',new['entries'])]:
    for row in records:
        text=' '.join([row['label'],*row.get('publisher_target_fields',[])])
        tags=[k for k,words in rules.items() if any(re.search(r'\b'+re.escape(word)+(r'(?:s)?\b' if k=='animal' else ''),text,re.I) for word in words)]
        index.append({'entry_id':row['id'],'label':row['label'],'source_id':row['source_id'],'dataset':file,
            'topic_candidates':tags or ['unclassified'],'classification_status':'LEXICAL-CANDIDATE-REVIEW-REQUIRED'})
catalog={'registry_id':'MAT:REG:FREQUENCY-REFERENCE-INDEX','schema_version':'1.0.0',
 'supported_subject_types':['element','isotope','ion','molecule','organic-substance','plant','animal','organism','body-system','tissue','device','environment','historical-concept','unclassified'],
 'required_measurement_context':['source','locator','subject identity','frequency kind','unit','state or biological context','method','conditions','uncertainty','evidence status'],
 'frequency_kinds':['measured transition','measured oscillation','drive frequency','modulation','pulse repetition','equipment limit','calculated','publisher association','symbolic','unknown'],
 'entries':index,'counts':{'source_occurrences':len(index),'topic_candidates':dict(collections.Counter(t for r in index for t in r['topic_candidates']))}}
(folder/'frequency-reference-index.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
elements=json.loads((ROOT/'book/data/elements-118.json').read_text(encoding='utf-8'))['elements']
links=[]
for row in entries+new['entries']:
    for element in elements:
        if re.fullmatch(re.escape(element['name'])+r'(?:\s+\d+|\s+'+re.escape(element['symbol'])+r')?',row['label'],re.I):
            links.append({'element_id':element['matId'],'reference_entry_id':row['id'],'label':row['label'],
              'relationship':'LABEL-MATCH-CANDIDATE','status':'REVIEW-REQUIRED',
              'boundary':'A lexical element mention is not an elemental spectrum or confirmed chemical identity.'})
(folder/'frequency-element-reference-links.json').write_text(json.dumps({'registry_id':'MAT:REG:FREQUENCY-ELEMENT-REFERENCES','links':links},indent=2)+'\n',encoding='utf-8')
assert not unparsed, 'Unparsed source segments require review before publication'
assert len(entries)==6004, 'Source edition or parser coverage changed'
assert all(len(r['publisher_target_fields'])==1 and r['tokens'] for r in entries)
print(json.dumps({k:result[k] for k in ['record_count','unique_record_count','token_count','unparsed_segments']}))
print(json.dumps(catalog['counts']))

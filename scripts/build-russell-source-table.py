"""Build the historical table index from a visual transcription of the 1926 scan.

All names/positions are source claims. This never updates chemical-element records.
The ninth-octave property columns are deliberately not joined to named rows because
the original typesetting is displaced. All such columns remain in the PDF and OCR.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/research'
# Name | source symbol | source atomic mass | source melting point in degrees C.
# Blank fields mean BLANK-IN-SOURCE, never zero. Spelling is historical, not canonical.
groups={
1:'''Alphanon|An.
Irenon|Io
Vijaon|Vj
Marvaon|Mv
TOMION|Tn
Alberton|At.
Blackton|Bn.
Boston|Bt.''',
2:'''Betanon|Bo.
Jamearnon|Jn.
Erneston|En.
Eykaon|Ek.
ATHENON|Ae.
Barnardon|Bd.
Delphanon|Dn.
Romanon|Rn.''',
3:'''Gammanon|Gn.
Marconium|Mc
Penrynium|Pn
Vinton|Vn
QUENTIN|Qn
Tracion|Tc
Buzzeon|Bz
Helenon|Hl''',
4:'''Hydron|Hy
Hydrogen|H|1.008|-259
Ethlogen|Eg
Bebegen|Bb
CARBOGEN|Cb
Luminon|Ln|*2.92
Halanon|Ha
Helionon|Hi''',
5:'''Helium|He.|4.0|-271
Lithium|Li|7.03|186
Beryllium|Be|9.1|1280
Boron|B|11.0|2350
CARBON|C|12.0|3600
Nitrogen|N|14.04|-210
Oxygen|O|16.00|-218
Fluorine|F|19.0|-223''',
6:'''Neon|Ne|19.9|-253
Sodium|Na|23.05|98
Magnesium|Mg|24.1|651
Aluminum|Al|27.0|659
SILICON|Si|28.4|1420
Phosphorus|P|31.4|725
Sulphur|S|32.06|119
Chlorine|Cl|35.45|-102''',
7:'''Argon|Ar|39.09|-188
Potassium|K|39.10|62.3
Calcium|Ca|40.1|810
Scandium|Sc|44.1
Titanium|Ti|48.1|1800
Vanadium|V|51.4|1720
Chromium|Cr|52.0|1615
Manganese|Mn|55.0|1230
Iron|Fe|55.9|1530
COBALT|Co|58.97|1480
Nickel|Ni|59|1452
Copper|Cu|63.57|1083
Zinc|Zn|65.37|419
Gallium|Ga|70.1|30
Germanium|Ge|72.5|958
Arsenic|As|74.96|850
Selenium|Se|79.2|217
Bromine|Br|79.92|-7.3''',
8:'''Krypton|Kr.|82.92|-169
Rubidium|Rb.|85.45|38
Strontium|Sr.|87.65|830
Yttrium|Yt.|89.33|1490
Zirconium|Zr.|90.6|1700
Niobium|Nb|94.0
Molybdenum|Mo|96.0|2550
Mate to 3D-
Ruthenium|Ru|101.7|2450
RHODIUM|Rh|103.0|1950
Palladium|Pd|106.5|1549
Silver|Ag|107.88|961
Cadmium|Cd|112.40|321
Indium|In|114.8|155
Tin|Sn|118.7|232
Antimony|Sb|120.2|630
Tellurium|Te|*127.5|446
Iodine|I|*126.92|114''',
9:'''Xenon
Caesium
Barium
Lanthanum
Cerium
Praseodymium
Neodymium
Mate to 3D-
Samarium
Europium
Gadolinium
Terbium
Disbrossium
Holmium
Erbium
Thulium
Ytterbium
LUTECIUM
Mate to 3M+
Mate to 3L+
Tantalum
Tungsten
Mate to 3I+
Osmium
Iridium
Platinum
Mate to 3E+
Gold
Mercury
Thallium
Lead
Bismuth
Polonium
Mate to 1+''',
10:'''Niton|Nt|222.4
Mate to 1-
Radium|Ra|226.0|700
Actinium|Ac
Thorium|Th|232.15|1700
Uranium XII|UrXII
Uranium|Ur|238.2|1850
Uridium|Um
Urium|Uu
TOMIUM|Tn
Whitnion|Wn
Alphonson|Ap
Georgeon|Gg
Victoron|V
Lipton|Ln
Alberton|At
Blackton|Bn
Boston|Bt
Omeganon'''
}
basic=['0=','1+','2+','3+','4[double-tone]','3-','2-','1-']
mid=['0=','1+','2+','3+']+['3'+c+'+' for c in 'ABCDE']+['4[double-tone]']+['3'+c+'-' for c in 'EDCBA']+['3-','2-','1-']
ninth=['0=','1+','2+','3+']+['3'+c+'+' for c in 'ABCDEFGHIJKLM']+['4[double-tone]']+['3'+c+'-' for c in 'MLKJIHGFEDCBA']+['3-','2-','1-']
entries=[]
for octave,rows in groups.items():
    positions=basic if octave<=6 else ninth if octave==9 else mid
    positions=list(positions)
    if octave==7: positions[10:15]=['4'+c+'-' for c in 'EDCBA']
    if octave==10: positions[-3:]=['+3-','+2-','+1-'];positions.append('0=')
    codes=[str(octave*100+int(p[0]))+p[1:] for p in (basic if octave<=6 else ninth if octave==9 else mid)]
    if octave==10: codes[9:]=['104[double-tone]','103E-','103D-','103C-','103B-','103A-','+103-','+102-','+101-'];codes.append('100=')
    lines=rows.splitlines();assert len(lines)==len(positions)==len(codes),(octave,len(lines))
    page=112 if octave<=3 else 114 if octave<=6 else 116 if octave<=8 else 118 if octave==9 else 120
    for i,(line,position,code) in enumerate(zip(lines,positions,codes),1):
        cells=line.split('|')+['']*3
        entry={'id':f'MAT:REF:RUSSELL:1926:O{octave:02}:R{i:02}','source_id':'SRC-000324','pdf_page':page,'printed_page':page-20,
            'octave':octave,'row_in_octave':i,'name_as_printed':cells[0],'position_transliteration':position,'number_transliteration':code,
            'evidence_status':'HISTORICAL-AUTHOR-CLAIM','transcription_status':'VISUALLY-TRANSCRIBED-SECOND-REVIEW-PENDING',
            'frequency_hz':None,'frequency_status':'NOT-A-PUBLISHED-HERTZ-MEASUREMENT',
            'canonical_element_id':None,'identity_mapping_status':'SEPARATE-REVIEW-REQUIRED'}
        for key,value,unit in [('symbol_as_printed',cells[1],None),('atomic_mass_as_printed',cells[2],'UNSPECIFIED-IN-TABLE'),('melting_point_as_printed',cells[3],'degC')]:
            entry[key]={'raw':value or None,'unit':unit,'status':'COLUMN-ALIGNMENT-REVIEW-REQUIRED' if octave==9 else 'PRINTED-HISTORICAL-VALUE' if value else 'BLANK-IN-SOURCE','uncertainty':'UNKNOWN'}
        entries.append(entry)
corpus=json.loads((OUT/'russell-universal-one-1926-corpus.json').read_text(encoding='utf-8'))
pages=[112,114,116,118,120]
result={'registry_id':'MAT:REG:RUSSELL-TEN-OCTAVES-1926','source_id':'SRC-000324','source_pdf':'data/research/sources/russell-universal-one-1926-loc.pdf',
    'scope':'Every name/position/number row in the ten-octave table on printed pages 92,94,96,98,100. Full source PDF and page OCR preserve additional prose, diagrams, annotations and ambiguous columns.',
    'entry_count':len(entries),'evidence_lane':'HISTORICAL-AUTHOR-MODEL','completion':{'row_index':'COMPLETE-FIRST-TRANSCRIPTION','all_cells_reviewed':False,'scientific_validation':False},
    'transliteration_rules':['Plus, minus and equals signs are symbolic source notation, not ionic charge or hertz.','The source double-tone glyph is represented by [double-tone]; the facsimile is authoritative.','Source spelling Aluminum is retained here; canonical MAT element naming remains Aluminium.','Blank values are null and never zero. Historical numeric values are not modern accepted measurements.'],
    'page_notes':{'114':['Luminon atomic mass carries an asterisk with Approximate footnote.','Source asserts rising/falling melting points; this is not a validated law.'],
        '116':['Seventh octave prints positions 4E- through 4A- beside number codes 703E- through 703A-. The discrepancy is preserved.','Tellurium and iodine carry an asterisk. The source questions their masses and asserts iodine should be heavier; do not apply that claim to current isotope/atomic-weight data.'],
        '118':['Symbol, mass and melting-point column lines are visibly offset against part of the names/numbers column. Entire column text is preserved below and in the facsimile; no automatic association is made.','Source says only conspicuous tenth-octave mid-tones are tabulated. No omitted hypothetical rows have been invented.'],
        '120':['Omeganon is followed by the end, which is Alphanon, the beginning.','Source claims about Hydron and Luminon are retained in page OCR and facsimile, not promoted to established substances.']},
    'source_pages':[dict(p,facsimile=f"data/research/sources/russell-1926-charts/pdf-page-{p['pdf_page']:03}.png") for p in corpus['pages'] if p['pdf_page'] in pages],
    'entries':entries}
assert len(entries)==137
(OUT/'russell-ten-octaves-1926.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'entries':len(entries),'octaves':10,'table_pages':len(pages),'ambiguous_property_rows':34}))

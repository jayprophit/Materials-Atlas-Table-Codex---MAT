import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=name=>JSON.parse(readFileSync(new URL('../../data/research/'+name,import.meta.url),'utf8'));
test('original PDFs remain byte-identical to accession hashes, with all source pages retained',()=>{
 const manifest=read('frequency-source-preservation.json');
 assert.equal(manifest.sources.length,4);assert.equal(manifest.total_pdf_pages,519);
 for(const s of manifest.sources){
  const bytes=readFileSync(new URL('../../'+s.path,import.meta.url));
  assert.equal(bytes.length,s.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256);
  {
   const corpus=JSON.parse(readFileSync(new URL('../../'+s.extraction,import.meta.url),'utf8'));
   assert.equal(corpus.pages.length,s.pdf_pages);
   assert.deepEqual(corpus.pages.map(p=>p.pdf_page),Array.from({length:s.pdf_pages},(_,i)=>i+1));
  }
 }
});
test('Russell source index preserves ten octaves, disputed notation and unresolved column alignment',()=>{
 const d=read('russell-ten-octaves-1926.json');
 assert.equal(d.entries.length,137);assert.equal(new Set(d.entries.map(r=>r.id)).size,137);
 assert.equal(new Set(d.entries.map(r=>r.octave)).size,10);
 assert.ok(d.entries.every(r=>r.frequency_hz===null&&r.canonical_element_id===null));
 const nickel=d.entries.find(r=>r.name_as_printed==='Nickel');assert.equal(nickel.position_transliteration,'4E-');assert.equal(nickel.number_transliteration,'703E-');
 assert.ok(d.entries.filter(r=>r.octave===9).every(r=>r.atomic_mass_as_printed.status==='COLUMN-ALIGNMENT-REVIEW-REQUIRED'));
 assert.equal(d.entries.find(r=>r.name_as_printed==='Luminon').atomic_mass_as_printed.raw,'*2.92');
 assert.equal(d.entries.find(r=>r.name_as_printed==='TOMIUM').number_transliteration,'104[double-tone]');
 const legacy=JSON.parse(readFileSync(new URL('../../book/data/russell-periodic.json',import.meta.url),'utf8'));
 assert.equal(legacy.octaves.length,9);assert.equal(legacy.frequency_range_status,'UNVERIFIED-LEGACY-MAPPING');
});
test('displaced Russell property cells retain coordinates and no invented name associations',()=>{
 const d=read('russell-1926-p118-property-cells.json');
 assert.deepEqual(d.counts,{property_rows:28,nonblank_cells:73,symbol:28,atomic_mass:27,melting_point:18});
 assert.equal(new Set(d.entries.map(r=>r.id)).size,28);
 assert.ok(d.entries.every(r=>r.joined_name_row_id===null));
 const tantalum=d.entries.find(r=>r.cells.some(c=>c.field==='symbol'&&c.raw_ocr==='Ta'));
 assert.ok(tantalum.top_points<431);assert.equal(tantalum.cells.find(c=>c.field==='atomic_mass').raw_ocr,'181.5');
 for(const r of d.entries)for(const c of r.cells){const [x,y,x1,y1]=c.bbox_points;assert.ok(x<x1&&y<y1&&x1<=d.page_size_points[0]&&y1<=d.page_size_points[1]);}
});

test('2015 import preserves source coverage and program expressions without inventing units',()=>{
 const d=read('spooky2-frequency-list-2015.json');
 assert.equal(d.entries.length,6004);assert.equal(d.unparsed_segments.length,0);
 assert.equal(new Set(d.entries.map(r=>r.id)).size,6004);
 assert.equal(d.entries.filter(r=>r.duplicate_of).length,1);
 assert.ok(d.entries.every(r=>r.unit==='UNKNOWN'&&r.pdf_pages.length&&r.publisher_target_fields.length===1));
 const e=d.entries.find(r=>r.label==='Essential Oil - Dragon Time');
 assert.equal(e.tokens[0].value,18000000);
 const ammonia=d.entries.find(r=>r.label==='Ammonia Remove');assert.equal(ammonia.tokens[0].value,1719.51);
 const adrenal=d.entries.find(r=>r.label==='Adrenal Hyperplasia');assert.equal(adrenal.publisher_database_code,'KHZ');
 assert.ok(d.entries.some(r=>r.tokens.some(t=>t.kind==='PROGRAM-EXPRESSION'&&t.raw.includes('='))));
});
test('2021 catalogue retains all source-column rows, wrapped labels and duplicate lineage',()=>{
 const d=read('spooky2-frequency-list-2021.json');assert.equal(d.entries.length,544);
 assert.equal(Object.values(d.table_rows_per_page).reduce((a,b)=>a+b,0),544);
 assert.equal(d.entries.filter(r=>r.duplicate_of).length,1);
 assert.ok(d.entries.some(r=>r.label.includes('Gout')&&r.raw_lines.length===2));
 assert.equal(d.entries.find(r=>r.label==='Zinc').values[0].value,14050);
 assert.ok(d.entries.every(r=>r.unit==='UNKNOWN'));
});
test('search and element references resolve without treating lexical tags as measurements',()=>{
 const sets=[read('spooky2-frequency-list-2015.json'),read('spooky2-frequency-list-2021.json')];
 const ids=new Set(sets.flatMap(d=>d.entries.map(r=>r.id)));
 const index=read('frequency-reference-index.json');assert.equal(index.entries.length,6548);
 assert.ok(index.entries.every(r=>ids.has(r.entry_id)&&r.classification_status==='LEXICAL-CANDIDATE-REVIEW-REQUIRED'));
 assert.ok(read('frequency-element-reference-links.json').links.every(r=>ids.has(r.reference_entry_id)&&r.status==='REVIEW-REQUIRED'));
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCatalog} from '../validate-elements.mjs';
import {validateSchema,frontMatter} from '../lib.mjs';
const root=new URL('../../',import.meta.url);
const catalog=JSON.parse(readFileSync(new URL('data/catalog/elements-baseline.json',root),'utf8'));
test('catalogue rejects fabricated abundance and source-free values',()=>{assert(validateCatalog(catalog));const c=structuredClone(catalog);c.elements[117].abundance.crust.value=0.000001;assert.throws(()=>validateCatalog(c));const d=structuredClone(catalog);d.elements[0].atomicWeight.source='invented';assert.throws(()=>validateCatalog(d));});
test('schema accepts 0118 and rejects 0119',()=>{const h={mat_id:'MAT:0118',record_name:'Oganesson',record_class:'CHEMICAL_ELEMENT',status:'BASELINE'};assert.deepEqual(validateSchema('data/schema/1.0.0/mat-record.schema.json',h),[]);assert(validateSchema('data/schema/1.0.0/mat-record.schema.json',{...h,mat_id:'MAT:0119'}).length)});
test('front matter reads identity rather than later sample blocks',()=>{const text=readFileSync(new URL('records/0030-Zinc-Zn/0030-Zinc-Zn.md',root),'utf8').replace(/\r\n/g,'\n');assert.equal(frontMatter(text).record_name,'Zinc');assert.equal(frontMatter(text).status,'BASELINE')});
test('publication resolves all canonical element sources and preserves documentary source diagnostics',()=>{
 const read=path=>JSON.parse(readFileSync(new URL(path,root)));
 const publication=read('data/publication/generated/publication-elements.json');assert.equal(publication.elements.length,118);
 const records=read('data/publication/generated/publication-records.json');
 for(const element of publication.elements){
  assert(element.chapterPath);const record=records.find(record=>record.id===element.chapterPath);assert(record,'Missing published parent '+element.matId);
  const chapter=read('data/publication/generated/chapters/'+record.key+'.json');assert.equal(chapter.mat,element.matId);
  assert.deepEqual(chapter.missingSources,[],element.matId+' has an unresolved scientific source');
  assert(chapter.sources.every(source=>source.status!=='UNRESOLVED'));
 }
 const metadata=read('data/publication/generated/publication-metadata.json');
 const unresolved=new Set(read('data/indexes/source-navigation.json').summary.unresolved_source_ids);
 assert(metadata.missingSources.every(id=>unresolved.has(id)),'Publication diagnostics must preserve actual unresolved references');
 assert.equal(metadata.releaseReady,false);
});


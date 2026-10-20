import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {SourceCitation} from './components/SourceNavigation';
import {citationFilename,formatSourceCitation} from './source-citations';
import type {CitationFormat} from './source-citations';
import type {NavigationSource} from './source-navigation';

// Shape fixtures exercise formatting. Their invented labels are not scientific records.
const source=(metadata:Record<string,unknown>={}):NavigationSource=>({source_id:'SRC-999001',title:null,authors:[],year:null,source_type:null,registry_pointer:'/sources/0',registry_metadata:metadata,external_links:[],local_links:[],usages:[]});
const formats:CitationFormat[]=['plain','bibtex','ris'];

describe('source-specific citation formatting',()=>{
 it('exports actual registry bibliographic metadata rather than MAT publication metadata',()=>{
  const index=JSON.parse(readFileSync(new URL('../../data/indexes/source-navigation.json',import.meta.url),'utf8')) as {sources:NavigationSource[]};
  const actual=index.sources.find(value=>value.source_id==='SRC-000204')!;
  expect(actual).toBeTruthy();
  const bib=formatSourceCitation(actual,'bibtex'),ris=formatSourceCitation(actual,'ris');
  expect(bib.text).toContain('title = {'+actual.registry_metadata.title+'}');
  expect(bib.text).toContain('doi = {'+actual.registry_metadata.doi+'}');
  expect(bib.text).toContain('year = {2020}');
  expect(ris.text).toContain('AU  - Włodzimierz Makulski\nAU  - Piotr Garbacz');
  expect(ris.text).toContain('JO  - Magnetic Resonance in Chemistry');
  expect(ris.text).toContain('SP  - 648\nEP  - 652');
  expect(ris.text).toContain('Registry review: PRIMARY-ABSTRACT-SELECTED-CLAIMS-CHECKED');
  expect(bib.text).not.toContain('Powe, Jay');
  expect(bib.text).not.toContain('Materials Atlas Table Codex');
  expect(bib.missingMetadata).toEqual(['license','retrieval date']);
  const singular=index.sources.find(value=>value.registry_metadata.author==='Ray Radebaugh')!;
  expect(singular).toBeTruthy();
  expect(formatSourceCitation(singular,'ris').text).toContain('AU  - Ray Radebaugh');
 });

 it('does not infer authors or publication years from organization, title or retrieval metadata',()=>{
  const s=source({title:'Reference test fixture 1926',organization:'Fixture organization',retrieved:'2026-10-03',certificate_issue:'2017-06-22',scope:'DESIGN-REFERENCE; NOT-SCIENTIFIC-EVIDENCE',source_aliases:['FIXTURE-OLD-ID']});
  for(const format of formats){
   const result=formatSourceCitation(s,format);
   expect(result.text).toContain('Fixture organization');
   expect(result.text).toContain('2026-10-03');
   expect(result.text).toContain('FIXTURE-OLD-ID');
   expect(result.text).toContain('Certificate issue date: 2017-06-22');
   expect(result.text).toContain('Scope: DESIGN-REFERENCE; NOT-SCIENTIFIC-EVIDENCE');
   expect(result.missingMetadata).toEqual(['authors','year','DOI','URL','license']);
   expect(result.text).not.toContain('author =');
   expect(result.text).not.toContain('year =');
   expect(result.text).not.toContain('AU  -');
   expect(result.text).not.toContain('PY  -');
   expect(result.text).not.toContain('PB  - Fixture organization');
  }
  expect(formatSourceCitation(s,'plain').text).toContain('[Year NOT-REPORTED]');
 });

 it('preserves singular, collective and attributed author text without splitting or certifying names',()=>{
  const s=source({title:'Attribution fixture',authors:'Author A and Author B (attributed)',author:'Alternative attribution',authorship_uncertainty:'Unresolved historical authorship',source_aliases:['OLD-A','OLD-B'],year:'1926?' });
  const bib=formatSourceCitation(s,'bibtex'),ris=formatSourceCitation(s,'ris');
  expect(bib.text).toContain('author = {{Author A and Author B (attributed)}}');
  expect(ris.text.match(/^AU  - /gm)).toHaveLength(1);
  expect(ris.text).toContain('AU  - Author A and Author B (attributed)');
  expect(ris.text).toContain('Alternative attribution');
  expect(ris.text).toContain('Unresolved historical authorship');
  expect(ris.text).toContain('OLD-A');expect(ris.text).toContain('OLD-B');
  expect(ris.text).toContain('PY  - 1926?');
 });

 it('retains unparsed arrays and author objects in notes rather than selecting missing identities or dates',()=>{
  const s=source({title:['First possible title','Second possible title'],authors:[{name:'Unparsed fixture name',status:'DISPUTED'}],year:[1926,1927],doi:['10.example/first','10.example/second'],published:'1926 edition',licence:'RIGHTS-UNRESOLVED',dated_extractions:[{retrieved:'2026-09-14',scope:'Selected rows'}]});
  for(const format of formats){
   const result=formatSourceCitation(s,format);
   expect(result.text).toContain('First possible title');expect(result.text).toContain('Second possible title');
   expect(result.text).toContain('Unparsed fixture name');expect(result.text).toContain('DISPUTED');
   expect(result.text).toContain('1926, 1927');
   expect(result.text).toContain('10.example/first');expect(result.text).toContain('10.example/second');
   expect(result.text).toContain('1926 edition');expect(result.text).toContain('RIGHTS-UNRESOLVED');
   expect(result.text).toContain('Selected rows');expect(result.text).toContain('2026-09-14');
   expect(result.missingMetadata).toEqual(['title','authors','year','DOI','URL']);
   expect(result.text).not.toContain('PY  - 1926');expect(result.text).not.toContain('year = {1926}');
  }
 });

 it('escapes BibTeX syntax and prevents RIS field injection while retaining registered text',()=>{
  const s=source({title:'Fixture }\nER  -\nTY  - EVIL { & 50%',authors:['A {B}','C \\ D'],year:2000,doi:'10.example/under_score',url:'https://example.test/under_score',retrieved:'2026-10-03'});
  const bib=formatSourceCitation(s,'bibtex').text,ris=formatSourceCitation(s,'ris').text;
  expect(bib).toContain('title = {Fixture \\} ER  - TY  - EVIL \\{ \\& 50\\%}');
  expect(bib).toContain('author = {{A \\{B\\}} and {C \\textbackslash{} D}}');
  expect(bib).toContain('doi = {10.example/under_score}');
  expect(bib).toContain('url = {https://example.test/under_score}');
  expect(ris.match(/^TY  - /gm)).toEqual(['TY  - ']);
  expect(ris.match(/^ER  -/gm)).toEqual(['ER  -']);
  expect(ris).toContain('TI  - Fixture } ER  - TY  - EVIL { & 50%');
 });

 it('keeps unsafe registry URLs out of machine citation URL fields and does not invent replacements',()=>{
  for(const url of ['javascript:alert(1)','file:///C:/private.pdf','//example.test/unregistered','https://example.test/\nUR  - injected'])for(const format of formats){
   const result=formatSourceCitation(source({title:'URL fixture',url}),format);
   expect(result.missingMetadata).toContain('URL');
   expect(result.text).toContain('Registry URL could not be exported');
   expect(result.text).not.toContain('url =');expect(result.text).not.toContain('UR  -');
   expect(result.text).not.toContain('https://doi.org/');
  }
 });

 it('formats deterministically without changing registry objects or inventing fields',()=>{
  const s=source({author:{status:'UNKNOWN',name:'Fixture'},source_aliases:['ORIGINAL'],licence:'UNKNOWN'}),before=JSON.stringify(s);
  for(const format of formats)expect(formatSourceCitation(s,format)).toEqual(formatSourceCitation(s,format));
  expect(JSON.stringify(s)).toBe(before);
  expect(citationFilename(s,'plain')).toBe('SRC-999001-reference.txt');
  expect(citationFilename(s,'bibtex')).toBe('SRC-999001-reference.bib');
  expect(citationFilename({...s,source_id:'../unsafe\\name'},'ris')).toBe('___unsafe_name-reference.ris');
 });

 it('renders the existing source browser citation controls with visible missing metadata',()=>{
  const html=renderToStaticMarkup(<SourceCitation source={source({title:'Reader fixture <script>',author:'Recorded author'})}/>);
  expect(html).toContain('Export this source reference');
  expect(html).toContain('Plain reference');expect(html).toContain('BibTeX');expect(html).toContain('RIS');
  expect(html).toContain('Copy reference');expect(html).toContain('Download reference');
  expect(html).toContain('aria-label="SRC-999001 source reference"');
  expect(html).toContain('year, DOI, URL, license, retrieval date');
  expect(html).toContain('Recorded author');expect(html).toContain('Reader fixture &lt;script&gt;');
  expect(html).not.toContain('<script>');
 });
});

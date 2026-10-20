import {describe,it,expect} from 'vitest';
import {unzipSync,strFromU8} from 'fflate';
import {epubBytes,htmlDraft} from './exports';
import type {Chapter} from './data-loader';

function chapter(id:string,body:string):Chapter{
 return {id,key:id,mat:'MAT:0001',title:id,section:'Elements',lane:'science',body,bodyHash:'fixture',header:{},structured:[],assets:[],sources:[],missingSources:[],counts:{},reviewStatus:'NEEDS_REVIEW'};
}
const hydrogenPath='records/0001-Hydrogen-H/0001-Hydrogen-H.md';
const heliumPath='records/0002-Helium-He/0002-Helium-He.md';
const publicBase='https://example.org/mat/studio/';

describe('export citation and section navigation',()=>{
 it('keeps same-chapter anchors and absolute public asset links in downloaded HTML',()=>{
  const body='## Sources & evidence\n[Section](#sources--evidence)\n[Source index](../../docs/05-index/05-Source-Index.md#registry)\n[Certificate](../../data/research/certificate.pdf)\n[Primary source](https://doi.org/10.1000/example)';
  const html=htmlDraft(chapter(hydrogenPath,body),body,publicBase);
  expect(html).toContain('<h2 id="sources--evidence">');
  expect(html).toContain('href="#sources--evidence"');
  expect(html).toContain('href="https://example.org/mat/studio/docs/05-index/05-Source-Index.md#registry"');
  expect(html).toContain('href="https://example.org/mat/studio/data/research/certificate.pdf"');
  expect(html).toContain('href="https://doi.org/10.1000/example"');
  const local='## Evidence\n[Local file link](0001-Hydrogen-H.md#evidence)';
  expect(htmlDraft(chapter(hydrogenPath,local),local,null)).toContain('href="#evidence"');
 });

 it('packages cross-chapter links and matching duplicate heading anchors in EPUB',()=>{
  const h=chapter(hydrogenPath,'[Helium](../0002-Helium-He/0002-Helium-He.md#sources--evidence-1)\n[Root route](/records/0002-Helium-He/0002-Helium-He.md#sources--evidence)');
  const he=chapter(heliumPath,'## Sources & **evidence**\nFirst.\n## Sources & evidence\n[Same chapter](#sources--evidence-1)');
  const zip=unzipSync(epubBytes([h,he],null));
  const source=strFromU8(zip['EPUB/chapter0.xhtml']);
  const destination=strFromU8(zip['EPUB/chapter1.xhtml']);
  expect(source).toContain('href="chapter1.xhtml#sources--evidence-1"');
  expect(source).toContain('href="chapter1.xhtml#sources--evidence"');
  expect(destination).toContain('<h2 id="sources--evidence">');
  expect(destination).toContain('<h2 id="sources--evidence-1">');
  expect(destination).toContain('href="#sources--evidence-1"');
 });

 it('uses public assets for omitted EPUB references without claiming to package them',()=>{
  const h=chapter(hydrogenPath,'[Reference](../../docs/05-index/05-Source-Index.md)\n[Snapshot](../../data/research/source.pdf)');
  const zip=unzipSync(epubBytes([h],publicBase));
  const body=strFromU8(zip['EPUB/chapter0.xhtml']);
  expect(body).toContain('href="https://example.org/mat/studio/docs/05-index/05-Source-Index.md"');
  expect(body).toContain('href="https://example.org/mat/studio/data/research/source.pdf"');
  expect(Object.keys(zip)).not.toContain('EPUB/source.pdf');
  const offline=strFromU8(unzipSync(epubBytes([h],null))['EPUB/chapter0.xhtml']);
  expect(offline).toContain('<span>Reference</span>');
  expect(offline).not.toContain('href="../../');
 });

 it('resolves encoded filename spaces and Unicode heading anchors',()=>{
  const h=chapter(hydrogenPath,'[Related](../Shared%20Notes/notes.md#énergie-東京)');
  const notes=chapter('records/Shared Notes/notes.md','## Énergie 東京');
  const zip=unzipSync(epubBytes([h,notes],null));
  expect(strFromU8(zip['EPUB/chapter0.xhtml'])).toContain('href="chapter1.xhtml#%C3%A9nergie-%E6%9D%B1%E4%BA%AC"');
  expect(strFromU8(zip['EPUB/chapter1.xhtml'])).toContain('id="énergie-東京"');
 });

 it('does not emit executable, filesystem, network-relative or malformed link destinations',()=>{
  const body='[Script](javascript:alert)\n[Data](data:text/html,test)\n[File](file:///C:/Users/secret.txt)\n[Drive](C:/Users/secret.txt)\n[Share](//remote.example/private)\n[Encoded drive](/C%3A/Users/secret.txt)\n[Encoded slash](../../data/%5Csecret.txt)\n[Bad encoding](../../data/%ZZ.txt)\n[Email](mailto:research@example.org)';
  const html=htmlDraft(chapter(hydrogenPath,body),body,publicBase);
  expect(html).not.toMatch(/href="(?:javascript:|data:|file:|C:|\/\/)/i);
  expect(html).not.toContain('href="https://example.org/mat/studio/C');
  expect(html).not.toContain('secret.txt');
  expect(html).not.toContain('%ZZ');
  expect(html).toContain('href="mailto:research@example.org"');
  const zip=unzipSync(epubBytes([chapter(hydrogenPath,body)],publicBase));
  expect(strFromU8(zip['EPUB/chapter0.xhtml'])).not.toMatch(/href="(?:javascript:|data:|file:|C:|\/\/)/i);
 });
});

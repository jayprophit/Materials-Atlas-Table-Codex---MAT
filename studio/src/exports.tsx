import {renderToStaticMarkup} from 'react-dom/server';
import {Children,createElement,isValidElement,ReactNode} from 'react';
import ReactMarkdown from 'react-markdown';
import type {Components} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {zipSync,strToU8} from 'fflate';
import {Chapter,assetURL} from './data-loader';
export function download(name:string,text:string|Uint8Array,type:string){const blob=new Blob([typeof text==='string'?text:new Uint8Array(text).buffer as ArrayBuffer],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
const esc=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function publicAssetBase():string|null{
 if(typeof location==='undefined'||!/^https?:$/.test(location.protocol))return null;
 return new URL(assetURL(''),location.href).href;
}
function externalLink(href:string):string|null{
 try{const url=new URL(href);return ['http:','https:','mailto:'].includes(url.protocol)&&url.pathname?url.href:null}catch{return null}
}
function exportLink(href:string,chapterPath:string,chapterFiles:Map<string,string>|null,publicBase:string|null):string|null{
 if(/[\u0000-\u001f\u007f\\]/.test(href)||href.startsWith('//'))return null;
 if(/^[a-z][a-z0-9+.-]*:/i.test(href))return externalLink(href);
 if(href.startsWith('#'))return href;
 try{
  const target=new URL(href,new URL(chapterPath,'https://mat.invalid/'));
  if(target.origin!=='https://mat.invalid')return null;
  const path=decodeURIComponent(target.pathname.slice(1));
  if(/[\u0000-\u001f\u007f\\]/.test(path)||/(?:^|\/)[a-z]:\//i.test(path))return null;
  if(!chapterFiles&&path===chapterPath)return target.hash||'#';
  const included=chapterFiles?.get(path);
  if(included)return included+target.search+target.hash;
  if(!publicBase)return null;
  const base=new URL(publicBase);
  if(!['http:','https:'].includes(base.protocol))return null;
  return new URL(target.pathname.slice(1)+target.search+target.hash,base).href;
 }catch{return null}
}
function headingText(children:ReactNode):string{
 return Children.toArray(children).map(child=>typeof child==='string'||typeof child==='number'?String(child):isValidElement<{children?:ReactNode}>(child)?headingText(child.props.children):'').join('');
}
function content(c:Chapter,body:string,chapterFiles:Map<string,string>|null,publicBase:string|null){
 const headings=new Map<string,number>();
 const components:Components={img:({alt})=><p>[Figure: {alt||'description unavailable'}. See canonical web edition.]</p>,a:({href,children})=>{const link=href?exportLink(href,c.id,chapterFiles,publicBase):null;return link?<a href={link}>{children}</a>:<span>{children}</span>}};
 // Match the public reader's heading anchors, including repeated headings.
 for(const tag of ['h1','h2','h3','h4','h5','h6'] as const)components[tag]=({children})=>{
  const base=headingText(children).toLowerCase().replace(/&\w+;/g,'').replace(/[^\p{L}\p{N}_\s-]/gu,'').trim().replace(/\s/g,'-')||'section';
  const count=headings.get(base)||0;headings.set(base,count+1);
  return createElement(tag,{id:base+(count?'-'+count:'')},children);
 };
 return renderToStaticMarkup(<><h1>MAT working draft</h1><p>Unreviewed edition. Unresolved citations: {c.missingSources.join(', ')||'none detected in this chapter'}. Scientific and rights review required.</p><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={url=>url} components={components}>{body}</ReactMarkdown></>);
}
const css='body{font-family:Georgia,serif;line-height:1.6;margin:2em;color:#17242a;background:white}h1,h2,h3{font-family:system-ui,sans-serif}table{border-collapse:collapse;width:100%}th,td{border:1px solid #aaa;padding:.4em;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%}';
export function htmlDraft(c:Chapter,body:string,publicBase:string|null=publicAssetBase()){return '<!doctype html><html lang="en"><meta charset="utf-8"><title>'+esc(c.title)+'</title><style>'+css+'</style><body>'+content(c,body,null,publicBase)+'</body></html>'}
export function exportHTML(c:Chapter,body:string){download((c.mat||'MAT').replace(':','-')+'-draft.html',htmlDraft(c,body),'text/html')}
export function epubBytes(chapters:Chapter[],publicBase:string|null=publicAssetBase()):Uint8Array{
 const entries:Parameters<typeof zipSync>[0]={mimetype:[strToU8('application/epub+zip'),{level:0}]};
 const xml='<?xml version="1.0" encoding="UTF-8"?>';
 entries['META-INF/container.xml']=strToU8(xml+'<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
 entries['EPUB/style.css']=strToU8(css);
 const items:string[]=[],refs:string[]=[],nav:string[]=[];
 const chapterFiles=new Map(chapters.map((c,i)=>[c.id,'chapter'+i+'.xhtml']));
 chapters.forEach((c,i)=>{const id='chapter'+i;entries['EPUB/'+id+'.xhtml']=strToU8(xml+'<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en"><head><title>'+esc(c.title)+'</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body>'+content(c,c.body,chapterFiles,publicBase)+'</body></html>');items.push('<item id="'+id+'" href="'+id+'.xhtml" media-type="application/xhtml+xml"/>');refs.push('<itemref idref="'+id+'"/>');nav.push('<li><a href="'+id+'.xhtml">'+esc(c.title)+'</a></li>')});
 entries['EPUB/nav.xhtml']=strToU8(xml+'<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en"><head><title>Contents</title></head><body><nav epub:type="toc" id="toc"><h1>MAT working draft</h1><ol>'+nav.join('')+'</ol></nav></body></html>');
 entries['EPUB/package.opf']=strToU8(xml+'<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">urn:mat:working-draft:'+Date.now()+'</dc:identifier><dc:title>Materials Atlas Table Codex — Working Draft</dc:title><dc:language>en</dc:language><meta property="dcterms:modified">'+new Date().toISOString().replace(/\.\d{3}Z$/,'Z')+'</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="css" href="style.css" media-type="text/css"/>'+items.join('')+'</manifest><spine>'+refs.join('')+'</spine></package>');
 return zipSync(entries,{level:6});
}
export function exportEPUB(chapters:Chapter[]){download('MAT-118-elements-WORKING-DRAFT.epub',epubBytes(chapters),'application/epub+zip')}


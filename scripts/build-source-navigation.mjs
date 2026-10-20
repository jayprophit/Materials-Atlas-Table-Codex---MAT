// Reverse navigation from the canonical registry; this is not a second registry.
import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,relative,join,dirname,isAbsolute,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import YAML from 'yaml';
import {Marked} from '../book/vendor/marked.mjs';
import {sourceReferences} from './source-references.mjs';
import {root} from './lib.mjs';

const registryPath='data/registries/sources.yaml';
const reportPath='data/indexes/source-navigation.json';
const detailPath='data/indexes/source-navigation-occurrences.json.gz';
const guidePath='docs/05-index/Source-Navigation.md';
const roots=['records','docs','templates','data/catalog','data/constants','data/intake','data/research','data/registries','data/vocabularies'];
const extras=['README.md','CHANGELOG.md','MAT-ADVANCED-RESUME.md','MAT_CODEX_CONTINUATION_HANDOFF.md'];
const excluded=['archive','book/generated','book/data','book/vendor','data/publication/generated','data/quality','data/research/sources','data/catalog/sources','data/schema','studio','dist','.mat-local'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const slash=p=>p.split(sep).join('/');
const parser=new Marked();
const sourceToken=/\bSRC-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\b/g;

function inside(repoRoot,path){
 if(typeof path!=='string'||!path||isAbsolute(path)||/^[A-Za-z]:/.test(path))return null;
 const absolute=resolve(repoRoot,path),rel=relative(repoRoot,absolute);
 return rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)?null:slash(rel);
}
function walk(repoRoot,folder){
 const result=[];
 if(!existsSync(join(repoRoot,folder)))return result;
 for(const name of readdirSync(join(repoRoot,folder)).sort()){
  const path=folder+'/'+name;
  if(excluded.some(p=>path===p||path.startsWith(p+'/')))continue;
  const stat=statSync(join(repoRoot,path));
  if(stat.isDirectory())result.push(...walk(repoRoot,path));
  else if(/\.(md|yaml|yml|json)$/i.test(path)&&![registryPath,reportPath,guidePath].includes(path))result.push(path);
 }
 return result;
}
export function navigationFiles(repoRoot=root){
 return [...new Set([...roots.flatMap(p=>walk(repoRoot,p)),...extras.filter(p=>existsSync(join(repoRoot,p)))])].sort();
}
function scalarFields(value,path='$',result=[]){
 if(Array.isArray(value))value.forEach((child,index)=>scalarFields(child,`${path}[${index}]`,result));
 else if(value&&typeof value==='object')for(const [key,child]of Object.entries(value)){
  const location=path+'.'+key;
  if(typeof child==='string')result.push({key,path:location,value:child});
  else scalarFields(child,location,result);
 }
 return result;
}
function registeredLinks(source,repoRoot){
 const external=[],local=[];
 for(const field of scalarFields(source)){
  if(/^(url|full_text_url)$|_url$/.test(field.key)){
   let valid=false;
   try{valid=['https:','http:'].includes(new URL(field.value).protocol);}catch{}
   external.push({field_path:field.path,url:field.value,status:valid?'REGISTERED-NOT-LIVE-CHECKED':'INVALID-URL'});
  }else if(/^(local_path|snapshot|provenance)$|_path$/.test(field.key)&&/[/\\]|\.[A-Za-z0-9]+$/.test(field.value)){
   const path=inside(repoRoot,field.value);
   local.push({field_path:field.path,path:path??field.value,status:path===null?'OUTSIDE-REPOSITORY':existsSync(join(repoRoot,path))?'PRESENT':'MISSING'});
  }
 }
 if(source.doi){
  const doi=String(source.doi).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').trim();
  external.push({field_path:'$.doi',url:'https://doi.org/'+doi,status:/^10\.\d{4,9}\/\S+$/.test(doi)?'REGISTERED-NOT-LIVE-CHECKED':'INVALID-DOI'});
 }
 return {external_links:external,local_links:local};
}
export function documentLink(repoRoot,path,href){
 const base={path,href,kind:'INTERNAL',target:null,anchor:null,status:'INVALID'};
 if(/^(https?:|mailto:)/i.test(href))return {...base,kind:'EXTERNAL',status:'EXTERNAL-NOT-LIVE-CHECKED'};
 if(/^[A-Za-z][A-Za-z0-9+.-]*:/.test(href)||href.startsWith('//'))return {...base,kind:'UNSUPPORTED',status:'UNSUPPORTED-SCHEME'};
 try{
  const fragment=href.indexOf('#'),query=href.indexOf('?');
  const end=Math.min(...[fragment,query,href.length].filter(n=>n>=0));
  const destination=decodeURIComponent(href.slice(0,end));
  base.anchor=fragment<0?null:decodeURIComponent(href.slice(fragment+1));
  const absolute=destination.startsWith('/')?resolve(repoRoot,destination.slice(1)):resolve(repoRoot,dirname(path),destination||path.split('/').at(-1));
  const target=relative(repoRoot,absolute);
  if(target==='..'||target.startsWith('..'+sep)||isAbsolute(target))return {...base,status:'OUTSIDE-REPOSITORY'};
  base.target=slash(target);
  base.status=existsSync(absolute)?'PRESENT':'MISSING';
  return base;
 }catch{return base;}
}

export function buildSourceNavigation({repoRoot=root,files=navigationFiles(repoRoot),registryFile=registryPath}={}){
 const bytes=readFileSync(join(repoRoot,registryFile)),registry=YAML.parse(bytes.toString('utf8'));
 if(!Array.isArray(registry?.sources))throw new Error('Canonical source registry must contain sources.');
 const sources=[],canonical=new Map(),aliases=new Map();
 for(const [index,source]of registry.sources.entries()){
  if(!/^SRC-\d{6}$/.test(source.source_id)||canonical.has(source.source_id))throw new Error('Invalid or duplicate canonical source ID: '+source.source_id);
  const entry={source_id:source.source_id,title:source.title??null,authors:source.authors??[],year:source.year??null,source_type:source.source_type??null,
   registry_pointer:'/sources/'+index,registry_metadata:source,...registeredLinks(source,repoRoot),usages:[]};
  canonical.set(source.source_id,entry);sources.push(entry);
 }
 for(const source of registry.sources)for(const alias of source.source_aliases||[]){
  if(canonical.has(alias)||aliases.has(alias))throw new Error('Ambiguous source alias: '+alias);
  aliases.set(alias,source.source_id);
 }
 const unresolved=[],patterns=[],links=[],issues=[],inputs=[];
 const add=(reference,usage)=>{
  const entry=canonical.get(reference)||canonical.get(aliases.get(reference));
  const item={...usage,reference,resolution:canonical.has(reference)?'CANONICAL':entry?'ALIAS':'UNRESOLVED'};
  if(entry)entry.usages.push(item);else unresolved.push({...item,source_id:reference});
 };
 for(const path of [...new Set(files)].sort()){
  const safe=inside(repoRoot,path);
  if(safe===null)throw new Error('Navigation input is outside repository: '+path);
  const input=readFileSync(join(repoRoot,safe)),text=input.toString('utf8');
  inputs.push({path:safe,sha256:hash(input)});
  const format=/\.md$/i.test(path)?'MARKDOWN':/\.json$/i.test(path)?'JSON':'YAML';
  try{
   if(format==='MARKDOWN'){
    parser.walkTokens(parser.lexer(text),token=>{
     // Code examples are descriptions, not actual scientific source usages.
     if(token.type==='text'&&!token.tokens)for(const match of token.text.matchAll(sourceToken)){
      const usage={path:safe,format,location:null,document_index:null,line:null,kind:'MARKDOWN-MENTION'};
      const suffix=token.text.slice(match.index+match[0].length);
      if(suffix.startsWith('-*')||suffix.startsWith('*'))patterns.push({...usage,pattern:match[0]+(suffix.startsWith('-*')?'-*':'*'),status:'SOURCE-ID-PATTERN; NOT-A-CONCRETE-CITATION'});
      else add(match[0],usage);
     }
     if(['link','image'].includes(token.type))links.push(documentLink(repoRoot,safe,token.href));
    });
   }else{
    const documents=format==='JSON'?[JSON.parse(text)]:YAML.parseAllDocuments(text).map(document=>{if(document.errors.length)throw new Error(document.errors.map(e=>e.message).join('; '));return document.toJSON();});
    for(const [document_index,document]of documents.entries())for(const reference of sourceReferences(document))add(reference.value,{path:safe,format,location:reference.path,document_index,line:null,kind:'STRUCTURED-REFERENCE'});
   }
  }catch(error){issues.push({path:safe,type:'PARSE-ERROR',message:error.message});}
 }
 sources.sort((a,b)=>a.source_id.localeCompare(b.source_id));
 const count=predicate=>sources.filter(predicate).length;
 const missingLocal=sources.flatMap(s=>s.local_links.filter(l=>l.status!=='PRESENT').map(l=>({source_id:s.source_id,...l})));
 const missingDocument=links.filter(link=>link.kind==='INTERNAL'&&link.status!=='PRESENT');
 return {schema_version:'1.0.0',generated_by:'scripts/build-source-navigation.mjs',registry:{path:registryFile,sha256:hash(bytes),registry_id:registry.registry?.registry_id??null},
  coverage:{included_roots:roots,included_root_files:extras,excluded_roots:excluded,files_scanned:inputs.length,
   policy:'Authored Markdown and structured YAML/JSON only. Source snapshots, frozen archive, generated publication/build copies, quality reports, code and schema examples are excluded. Markdown code examples are excluded. A mention is navigation evidence, not claim validation. External destinations and heading anchors are not checked live.'},
  summary:{registered_sources:sources.length,cited_sources:count(s=>s.usages.length>0),citation_occurrences:sources.reduce((n,s)=>n+s.usages.length,0),
   unresolved_source_ids:[...new Set(unresolved.map(u=>u.source_id))].sort(),unresolved_citation_occurrences:unresolved.length,source_id_pattern_mentions:patterns.length,sources_without_external_links:count(s=>!s.external_links.some(l=>l.status==='REGISTERED-NOT-LIVE-CHECKED')),
   sources_without_any_destination:count(s=>!s.external_links.some(l=>l.status==='REGISTERED-NOT-LIVE-CHECKED')&&!s.local_links.some(l=>l.status==='PRESENT')),
   sources_without_retrieval_metadata:count(s=>!s.registry_metadata.retrieved&&!s.registry_metadata.dated_extractions?.some(e=>e.retrieved)),
   sources_without_license_metadata:count(s=>!s.registry_metadata.license&&!s.registry_metadata.licence),missing_local_targets:missingLocal.length,document_link_occurrences:links.length,missing_document_targets:missingDocument.length,parse_errors:issues.length},
  sources,unresolved_references:unresolved,reference_patterns:patterns,document_links:links,missing_local_targets:missingLocal,missing_document_targets:missingDocument,issues,inputs};
}

export function compactSourceNavigation(report){
 const group=usages=>{
  const groups=new Map();
  for(const usage of usages){
   const key=usage.path+'\0'+usage.reference;
   if(!groups.has(key))groups.set(key,{...usage,location:null,document_index:null,line:null,occurrence_count:0});
   groups.get(key).occurrence_count++;
  }
  return [...groups.values()];
 };
 const detail={schema_version:report.schema_version,registry:report.registry,sources:Object.fromEntries(report.sources.map(source=>[source.source_id,{usages:source.usages}])),unresolved_references:report.unresolved_references};
 const bytes=gzipSync(Buffer.from(JSON.stringify(detail)+'\n'),{level:9});
 const compact={...report,detail_index:{path:detailPath,sha256:hash(bytes),format:'JSON-GZIP',notice:'Exact per-field occurrences; compressed download, not needed for navigation.'},
  sources:report.sources.map(source=>({...source,usages:group(source.usages).map(usage=>({...usage,occurrences_pointer:'/sources/'+source.source_id+'/usages'}))})),
  unresolved_references:group(report.unresolved_references).map(usage=>({...usage,occurrences_pointer:'/unresolved_references'}))};
 return {report:compact,detail:bytes};
}

export function checkSourceNavigation(report,{repoRoot=root,files=navigationFiles(repoRoot)}={}){
 const problems=[];
 const checkHash=(path,expected)=>{
  const safe=inside(repoRoot,path);
  if(safe===null||!existsSync(join(repoRoot,safe)))problems.push('Missing input: '+path);
  else if(hash(readFileSync(join(repoRoot,safe)))!==expected)problems.push('Changed input: '+path);
 };
 checkHash(report.registry.path,report.registry.sha256);
 for(const input of report.inputs)checkHash(input.path,input.sha256);
 const expected=report.inputs.map(input=>input.path).sort(),current=[...new Set(files)].sort();
 if(JSON.stringify(expected)!==JSON.stringify(current))problems.push('Input inventory changed; rebuild source navigation.');
 if(report.detail_index)checkHash(report.detail_index.path,report.detail_index.sha256);
 if(report.issues.length)problems.push('Navigation contains '+report.issues.length+' parse error(s).');
 return problems;
}

const markdown=value=>String(value??'UNKNOWN').replaceAll('|','\\|').replaceAll('\n',' ');
const href=path=>encodeURI('../../'+path).replaceAll('#','%23').replaceAll('?','%3F');
export function sourceNavigationGuide(report){
 const s=report.summary;
 let body=`# MAT Source Navigation\n\nGenerated by [the source navigation builder](../../scripts/build-source-navigation.mjs) from the [canonical source registry](../../${report.registry.path}). [Machine-readable index](../../${reportPath}). This is a derived navigation index; scientific records and the registry remain the owners.\n\n## Coverage and limits\n\n${report.coverage.policy}\n\nThe scan covers ${report.coverage.files_scanned} files, ${s.registered_sources} registered sources, ${s.cited_sources} sources mentioned in those files and ${s.citation_occurrences} resolved citation occurrences. A registered URL is a destination supplied by its owner; its presence does not prove accessibility or support for a scientific claim. Metadata not present in the registry remains unknown.\n\n| Finding | Count | Action |\n| --- | ---: | --- |\n| Unresolved source identifiers | ${s.unresolved_source_ids.length} | Review each owner; do not fabricate citations. |\n| Sources without an external destination | ${s.sources_without_external_links} | Preserve local-only sources; add verified bibliographic destinations where available. |\n| Sources without any known destination | ${s.sources_without_any_destination} | Locate an original source or mark retrieval unresolved. |\n| Sources without recorded retrieval metadata | ${s.sources_without_retrieval_metadata} | Record retrieval scope/date during the next source review. |\n| Sources without recorded licence metadata | ${s.sources_without_license_metadata} | Resolve redistribution rights before a publication release. |\n| Missing registered local targets | ${s.missing_local_targets} | Restore the documented snapshot or correct its registry path after review. |\n| Missing internal document destinations | ${s.missing_document_targets} | Correct the authored link or add its missing target. |\n| Parse errors | ${s.parse_errors} | Repair the input format before trusting coverage. |\n\n## Source directory\n\nFollow a source to its original destination or local snapshot, then follow its internal usage to the relevant record. The navigation index groups repeated references by owner file and preserves their counts. ${report.detail_index?'[Download every occurrence with its YAML/JSON field location](../../'+report.detail_index.path+') (compressed JSON).':'The uncompressed report includes every occurrence and its YAML/JSON field location.'}\n\n`;
 for(const source of report.sources){
  body+=`### ${source.source_id}\n\n${markdown(source.title)}. Type: ${markdown(source.source_type)}. Registry entry: [${source.source_id}](../../${report.registry.path}) (${source.registry_pointer}).\n\n`;
  const external=source.external_links.filter(link=>link.status==='REGISTERED-NOT-LIVE-CHECKED');
  const present=source.local_links.filter(link=>link.status==='PRESENT');
  const missing=source.local_links.filter(link=>link.status!=='PRESENT');
  body+=external.length?'External destinations: '+external.map((link,index)=>`[${link.field_path==='$.doi'?'DOI':index===0?'Original source':'Additional source'}](<${link.url.replaceAll('>','%3E')}>)`).join(', ')+'.\n\n':'External destination: UNKNOWN.\n\n';
  if(present.length)body+='Local copies: '+present.map(link=>`[${markdown(link.path)}](${href(link.path)})`).join(', ')+'.\n\n';
  if(missing.length)body+='Unresolved local copies: '+missing.map(link=>`${markdown(link.path)} (${link.status})`).join('; ')+'.\n\n';
  const files=[...new Set(source.usages.map(usage=>usage.path))];
  body+=files.length?'Internal usages: '+files.map(path=>`[${markdown(path)}](${href(path)})`).join(', ')+'.\n\n':'Internal usage: no mention found within the declared scan.\n\n';
 }
 body+='## Unresolved source references\n\n';
 body+=report.unresolved_references.length?report.unresolved_references.map(usage=>`- ${usage.source_id}: [${markdown(usage.path)}](${href(usage.path)}) — ${markdown(usage.location)}.\n`).join(''):'No unresolved source identifiers were found within the declared scan.\n';
 body+='\n## Missing document destinations\n\n';
 body+=report.missing_document_targets.length?report.missing_document_targets.map(link=>`- [${markdown(link.path)}](${href(link.path)}): ${markdown(link.href)} (${link.status}).\n`).join(''):'No missing internal document destinations were found within the declared scan.\n';
 return body;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--check')){
  const report=JSON.parse(readFileSync(join(root,reportPath),'utf8')),problems=checkSourceNavigation(report);
  if(readFileSync(join(root,guidePath),'utf8')!==sourceNavigationGuide(report))problems.push('Source navigation guide differs from its index.');
  problems.forEach(problem=>console.error(problem));
  console.log('Source navigation freshness: '+problems.length+' problem(s).');
  if(problems.length)process.exitCode=1;
 }else{
  const {report,detail}=compactSourceNavigation(buildSourceNavigation());
  mkdirSync(join(root,dirname(reportPath)),{recursive:true});
  writeFileSync(join(root,detailPath),detail);
  writeFileSync(join(root,reportPath),JSON.stringify(report,null,2)+'\n');
  writeFileSync(join(root,guidePath),sourceNavigationGuide(report));
  console.log(JSON.stringify(report.summary));
  if(report.issues.length)process.exitCode=1;
 }
}

export type SourceUsage={path:string;format:'YAML'|'JSON'|'MARKDOWN';location:string|null;document_index:number|null;line:number|null;reference:string;resolution:'CANONICAL'|'ALIAS'|'UNRESOLVED';kind:'STRUCTURED-REFERENCE'|'MARKDOWN-MENTION';occurrence_count?:number;occurrences_pointer?:string};
export type NavigationSource={source_id:string;title:string|null;authors:unknown[];year:string|number|null;source_type:string|null;registry_pointer:string;registry_metadata:Record<string,unknown>;external_links:{field_path:string;url:string;status:'REGISTERED-NOT-LIVE-CHECKED'}[];local_links:{field_path:string;path:string;status:'PRESENT'|'MISSING'|'OUTSIDE-REPOSITORY'}[];usages:SourceUsage[]};
export type SourceNavigationReport={registry:{path:string;sha256:string};detail_index?:{path:string;sha256:string};sources:NavigationSource[];unresolved_references:(SourceUsage&{source_id:string})[]};
export type SourceFilter='all'|'external'|'local'|'metadata';
const isObject=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const isText=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
const nullableText=(value:unknown)=>value===null||typeof value==='string';
const nullableInteger=(value:unknown)=>value===null||(typeof value==='number'&&Number.isSafeInteger(value)&&value>=0);
function validUsage(value:unknown,unresolved=false):value is SourceUsage{
 return isObject(value)&&isText(value.path)&&['YAML','JSON','MARKDOWN'].includes(String(value.format))&&nullableText(value.location)&&nullableInteger(value.document_index)&&nullableInteger(value.line)&&isText(value.reference)&&(unresolved?value.resolution==='UNRESOLVED':['CANONICAL','ALIAS'].includes(String(value.resolution)))&&['STRUCTURED-REFERENCE','MARKDOWN-MENTION'].includes(String(value.kind))&&(value.occurrence_count===undefined||(typeof value.occurrence_count==='number'&&Number.isSafeInteger(value.occurrence_count)&&value.occurrence_count>0))&&(value.occurrences_pointer===undefined||isText(value.occurrences_pointer));
}
export function parseSourceNavigation(value:unknown):SourceNavigationReport{
 if(!isObject(value)||value.schema_version!=='1.0.0'||!isObject(value.registry)||!isText(value.registry.path)||!isText(value.registry.sha256)||!Array.isArray(value.sources)||!Array.isArray(value.unresolved_references))throw Error('Source navigation index is missing its registry, sources or unresolved-reference list.');
 if(value.detail_index!==undefined&&(!isObject(value.detail_index)||!isText(value.detail_index.path)||!isText(value.detail_index.sha256)))throw Error('Source navigation index contains an incomplete detail index reference.');
 const ids=new Set<string>();
 for(const source of value.sources){
  if(!isObject(source)||!isText(source.source_id)||!nullableText(source.title)||!Array.isArray(source.authors)||!(source.year===null||typeof source.year==='string'||(typeof source.year==='number'&&Number.isFinite(source.year)))||!nullableText(source.source_type)||!isText(source.registry_pointer)||!isObject(source.registry_metadata)||!Array.isArray(source.external_links)||!Array.isArray(source.local_links)||!Array.isArray(source.usages))throw Error('Source navigation index contains an incomplete registered source.');
  if(ids.has(source.source_id))throw Error('Source navigation index contains duplicate registered sources.');
  ids.add(source.source_id);
  for(const link of source.external_links)if(!isObject(link)||!isText(link.field_path)||!isText(link.url)||!/^https?:\/\//i.test(link.url)||link.status!=='REGISTERED-NOT-LIVE-CHECKED')throw Error('Source navigation index contains an unsupported external link.');
  for(const link of source.local_links)if(!isObject(link)||!isText(link.field_path)||!isText(link.path)||!['PRESENT','MISSING','OUTSIDE-REPOSITORY'].includes(String(link.status)))throw Error('Source navigation index contains an incomplete local link.');
  if(!source.usages.every(usage=>validUsage(usage)))throw Error('Source navigation index contains an incomplete usage location.');
 }
 if(!value.unresolved_references.every(reference=>isObject(reference)&&isText(reference.source_id)&&validUsage(reference,true)))throw Error('Source navigation index contains an incomplete unresolved reference.');
 return value as unknown as SourceNavigationReport;
}
export function registeredAuthors(source:NavigationSource):unknown[]{
 const metadata=source.registry_metadata;
 const value=Array.isArray(metadata.authors)&&metadata.authors.length?metadata.authors:metadata.author??source.authors;
 return value===null||value===undefined||value===''?[]:Array.isArray(value)?value:[value];
}
export function missingSourceMetadata(source:NavigationSource):string[]{
 return [!source.title?'title':null,!registeredAuthors(source).some(isText)?'authors':null,source.year===null||source.year===''?'year':null,!source.source_type?'source type':null].filter((value):value is string=>value!==null);
}
export function filterNavigationSources(sources:NavigationSource[],query:string,filter:SourceFilter):NavigationSource[]{
 const needle=query.trim().toLowerCase();
 return sources.filter(source=>(!needle||(source.source_id+' '+(source.title??'')).toLowerCase().includes(needle))&&(filter==='all'||(filter==='external'&&source.external_links.length>0)||(filter==='local'&&source.local_links.some(link=>link.status==='PRESENT'))||(filter==='metadata'&&missingSourceMetadata(source).length>0)));
}

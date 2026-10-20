import {useEffect,useMemo,useState} from 'react';
import {assetURL} from '../data-loader';
import {download} from '../exports';
import {citationFilename,formatSourceCitation} from '../source-citations';
import type {CitationFormat} from '../source-citations';
import type {RecordData} from '../data-loader';
import {filterNavigationSources,missingSourceMetadata,parseSourceNavigation,registeredAuthors} from '../source-navigation';
import type {NavigationSource,SourceFilter,SourceNavigationReport,SourceUsage} from '../source-navigation';

const display=(value:unknown)=>value===null||value===undefined||value===''?'NOT-REPORTED':typeof value==='string'||typeof value==='number'?String(value):JSON.stringify(value);
const pageSize=15;
export function SourceCitation({source}:{source:NavigationSource}){
 const [format,setFormat]=useState<CitationFormat>('plain'),[message,setMessage]=useState('');
 const citation=useMemo(()=>formatSourceCitation(source,format),[source,format]);
 return <details><summary>Export this source reference</summary><p>These references use registered metadata. Names and attribution are preserved as recorded; this is a plain reference, not a fully normalized APA citation. Missing fields remain unresolved.</p><label>Reference format <select value={format} onChange={event=>{setFormat(event.target.value as CitationFormat);setMessage('')}}><option value="plain">Plain reference</option><option value="bibtex">BibTeX</option><option value="ris">RIS</option></select></label>{citation.missingMetadata.length>0&&<p>Metadata not reported or not scalar: {citation.missingMetadata.join(', ')}.</p>}<textarea aria-label={source.source_id+' source reference'} rows={10} readOnly value={citation.text} style={{width:'100%',maxWidth:'100%'}}/><div className="controls"><button onClick={async()=>{try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(citation.text);setMessage('Reference copied.')}catch{setMessage('Copy is unavailable. Select the reference text to copy it.')}}}>Copy reference</button><button onClick={()=>download(citationFilename(source,format),citation.text,citation.mimeType)}>Download reference</button></div>{message&&<p role="status">{message}</p>}</details>;
}
export function SourceNavigation({records,onNavigate}:{records:RecordData[];onNavigate:(id:string)=>void}){
 const [report,setReport]=useState<SourceNavigationReport|null>(null),[error,setError]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState<SourceFilter>('all'),[page,setPage]=useState(0),[retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setError('');setReport(null);
  fetch(assetURL('data/indexes/source-navigation.json'),{signal:controller.signal}).then(response=>{
   if(!response.ok)throw Error('Source navigation could not load ('+response.status+').');
   if(!response.headers.get('content-type')?.toLowerCase().includes('json'))throw Error('The server returned a page instead of the source navigation index. Rebuild the publication assets.');
   return response.json();
  }).then(parseSourceNavigation).then(data=>{if(!controller.signal.aborted)setReport(data)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:String(reason))});
  return()=>controller.abort();
 },[retry]);
 const filtered=useMemo(()=>filterNavigationSources(report?.sources??[],query,filter),[report,query,filter]);
 const usageLink=(usage:SourceUsage)=>records.some(record=>record.id===usage.path)?<button onClick={()=>onNavigate(usage.path)}>Read {usage.path}</button>:<a href={assetURL(usage.path)} target="_blank" rel="noreferrer">Open {usage.path}</a>;
 return <section className="source-navigation" aria-labelledby="source-navigation-title" style={{maxWidth:'100%',overflowWrap:'anywhere'}}>
  <h3 id="source-navigation-title">Source navigation</h3>
  <p>Search the existing source registry and follow its recorded uses. External links are registered references whose current availability has not been checked. Missing metadata and unresolved source IDs remain visible.</p>
  <p><button onClick={()=>onNavigate('docs/05-index/Source-Navigation.md')}>Read the source navigation guide</button> · <a href={assetURL('data/indexes/source-navigation.json')} target="_blank" rel="noreferrer">Open the generated source index</a></p>
  {!report&&!error&&<p role="status">Loading source navigation…</p>}
  {error&&<div role="alert"><p>{error}</p><button onClick={()=>setRetry(value=>value+1)}>Retry source navigation</button></div>}
  {report&&<>
   <p><a href={assetURL(report.registry.path)} target="_blank" rel="noreferrer">Canonical source registry</a> · {report.sources.length} registered sources · {new Set(report.unresolved_references.map(reference=>reference.source_id)).size} unresolved source IDs in the scanned documents.</p>
   {report.detail_index&&<p>Uses are grouped by owner file. <a href={assetURL(report.detail_index.path)} target="_blank" rel="noreferrer">Download exact citation locations</a> as compressed JSON for the preserved per-field occurrences.</p>}
   <div className="controls" style={{padding:'.75rem 0'}}><label style={{flexDirection:'column',alignItems:'flex-start',maxWidth:'100%'}}>Search source ID or title<input value={query} placeholder="SRC ID or source title" onChange={event=>{setQuery(event.target.value);setPage(0)}}/></label><label style={{flexDirection:'column',alignItems:'flex-start',maxWidth:'100%'}}>Source filter<select value={filter} onChange={event=>{setFilter(event.target.value as SourceFilter);setPage(0)}} style={{maxWidth:'100%'}}><option value="all">All registered sources</option><option value="external">Has an external link</option><option value="local">Has a present local file</option><option value="metadata">Has missing metadata</option></select></label></div>
   <p role="status">{filtered.length} matching registered sources</p>
   <ul className="source-navigation-results" style={{paddingLeft:'1.25rem'}}>{filtered.slice(page*pageSize,(page+1)*pageSize).map(source=><li key={source.source_id} data-source-id={source.source_id} style={{margin:'1rem 0',borderBottom:'1px solid var(--line)',paddingBottom:'1rem'}}>
    <h4>{source.source_id} — {source.title||'Title NOT-REPORTED'}</h4>
    <p>Authors: {registeredAuthors(source).length?registeredAuthors(source).map(display).join('; '):'NOT-REPORTED'} · Year: {display(source.year)} · Source type: {display(source.source_type)}</p>
    <p>Registry review: {display(source.registry_metadata.verification_status)} · Retrieval date: {display(source.registry_metadata.retrieved)} · License: {display(source.registry_metadata.license??source.registry_metadata.licence)}</p>
    {missingSourceMetadata(source).length>0&&<p>Unresolved metadata: {missingSourceMetadata(source).join(', ')}.</p>}
    {source.external_links.length?<ul aria-label={source.source_id+' external references'}>{source.external_links.map((link,index)=><li key={index}><a href={link.url} target="_blank" rel="noreferrer">Original reference ({link.field_path})</a> · Registered; current availability not checked</li>)}</ul>:<p>External reference: NOT-REPORTED-IN-REGISTRY.</p>}
    {source.local_links.length?<ul aria-label={source.source_id+' local files'}>{source.local_links.map((link,index)=><li key={index}>{link.status==='PRESENT'?<a href={assetURL(link.path)} target="_blank" rel="noreferrer">{link.path}</a>:link.path} · {link.status} · {link.field_path}</li>)}</ul>:<p>Local source file: NOT-REPORTED-IN-REGISTRY.</p>}
    <SourceCitation source={source}/>
    <details><summary>Recorded uses ({source.usages.length} owner references)</summary>{source.usages.length?<ul>{source.usages.map((usage,index)=><li key={index}>{usageLink(usage)}<small style={{display:'block'}}>{usage.format} · {usage.kind} · {usage.resolution}{usage.occurrence_count!==undefined?' · '+usage.occurrence_count+' citation occurrences':''}{usage.line!==null?' · line '+usage.line:''}{usage.location!==null?' · '+usage.location:''}{usage.document_index!==null?' · document '+usage.document_index:''}{usage.occurrences_pointer?' · Exact locations: '+usage.occurrences_pointer:''}</small></li>)}</ul>:<p>No uses were found within the documented scan coverage.</p>}</details>
    <details><summary>Exact registry metadata and provenance</summary><p>Registry pointer: <code>{source.registry_pointer}</code> · Registry SHA-256: <code>{report.registry.sha256}</code></p><pre>{JSON.stringify(source.registry_metadata,null,2)}</pre></details>
   </li>)}</ul>
   {!filtered.length&&<p>No matching registered sources. Clear the search or choose another filter.</p>}
   <div className="controls" style={{padding:'.75rem 0'}}><button disabled={page===0} onClick={()=>setPage(value=>value-1)}>Previous sources</button><span>Source page {page+1} of {Math.max(1,Math.ceil(filtered.length/pageSize))}</span><button disabled={(page+1)*pageSize>=filtered.length} onClick={()=>setPage(value=>value+1)}>Next sources</button></div>
   <details><summary>Unresolved references ({report.unresolved_references.length} owner references)</summary>{report.unresolved_references.length?<ul>{report.unresolved_references.map((usage,index)=><li key={index}><strong>{usage.source_id}</strong> · {usageLink(usage)}{usage.line!==null?' · line '+usage.line:''}{usage.location!==null?' · '+usage.location:''}{usage.occurrence_count!==undefined?' · '+usage.occurrence_count+' citation occurrences':''}<small style={{display:'block'}}>No matching canonical source owner was resolved by the index.{usage.occurrences_pointer?' Exact locations: '+usage.occurrences_pointer:''}</small></li>)}</ul>:<p>No unresolved source IDs were detected within the documented scan coverage. This does not establish scientific review or complete source coverage.</p>}</details>
  </>}
 </section>;
}

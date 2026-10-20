import {useEffect,useState} from 'react';
import type {CSSProperties} from 'react';
import {assetURL} from '../data-loader';

type Provenance={path:string;pointer:string;source_id:string;source_locator:string|null;source_url?:string|null};
type Reading={binding_id:string;object_ref:string;state:Record<string,unknown>;metric:string;value:number;unit:string;uncertainty:number|null;uncertainty_status:string;evidence_type:string;conditions:Record<string,unknown>;provenance:Provenance;limitations:string[]};
type Relationship={source:string;type:string;target:string;evidence:string|null;provenance:{path:string;pointer:string}};
type ReadingReport={reading_examples:Reading[];reading_relationships:Relationship[]};
const isObject=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const isText=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
function parseReport(value:unknown):ReadingReport{
 if(!isObject(value)||!Array.isArray(value.reading_examples)||!value.reading_examples.length||!Array.isArray(value.reading_relationships))throw Error('Canonical reading report is missing its readings or relationships.');
 const ids=new Set<string>();
 for(const r of value.reading_examples){
  if(!isObject(r)||!['binding_id','object_ref','metric','unit','uncertainty_status','evidence_type'].every(key=>isText(r[key]))||typeof r.value!=='number'||!Number.isFinite(r.value)||!(r.uncertainty===null||(typeof r.uncertainty==='number'&&Number.isFinite(r.uncertainty)&&r.uncertainty>=0))||!isObject(r.state)||!isObject(r.conditions)||!Array.isArray(r.limitations)||!r.limitations.every(item=>typeof item==='string')||!isObject(r.provenance)||!isText(r.provenance.path)||!isText(r.provenance.pointer)||!isText(r.provenance.source_id)||!(r.provenance.source_locator===null||typeof r.provenance.source_locator==='string'))throw Error('Canonical reading report contains an incomplete reading.');
  if(r.provenance.source_url!==undefined&&r.provenance.source_url!==null&&(typeof r.provenance.source_url!=='string'||!/^https?:\/\//i.test(r.provenance.source_url)))throw Error('Canonical reading report contains an unsupported source URL.');
  if(ids.has(r.binding_id as string))throw Error('Canonical reading report contains duplicate readings.');
  ids.add(r.binding_id as string);
 }
 for(const relation of value.reading_relationships){
  if(!isObject(relation)||!['source','type','target'].every(key=>isText(relation[key]))||!(relation.evidence===null||typeof relation.evidence==='string')||!isObject(relation.provenance)||!isText(relation.provenance.path)||!isText(relation.provenance.pointer))throw Error('Canonical reading report contains an incomplete relationship.');
 }
 return value as unknown as ReadingReport;
}
const cellStyle:CSSProperties={padding:'.65rem',borderBottom:'1px solid var(--line)',textAlign:'left',verticalAlign:'top'};
const contextText=(value:unknown)=>typeof value==='string'||typeof value==='number'?String(value):JSON.stringify(value);
const locatorURL=(locator:string|null)=>locator&&/^(?:data|records|docs|book)\//.test(locator)?assetURL(locator):locator&&/^https?:\/\//i.test(locator)?locator:null;

export function CanonicalReadings(){
 const [report,setReport]=useState<ReadingReport|null>(null),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  fetch(assetURL('data/quality/mat-update-intake.json'),{signal:controller.signal}).then(response=>{
   if(!response.ok)throw Error('Canonical reading data could not load ('+response.status+').');
   if(!response.headers.get('content-type')?.toLowerCase().includes('json'))throw Error('The server returned a page instead of canonical reading data. Rebuild the publication assets.');
   return response.json();
  }).then(parseReport).then(data=>{if(!controller.signal.aborted)setReport(data)}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:String(reason))});
  return()=>controller.abort();
 },[]);
 return <section aria-labelledby="canonical-readings-title" className="canonical-readings" style={{margin:'1.5rem 0',maxWidth:'100%',minWidth:0}}>
  <h2 id="canonical-readings-title">Canonical readings and evidence</h2>
  <p>Compare the named subjects, states and source records. Matching numbers or units alone do not establish a shared mechanism, biological effect or treatment. Values retain their original evidence and uncertainty labels.</p>
  {!report&&!error&&<p role="status">Loading canonical readings…</p>}
  {error&&<p role="alert">{error} The publisher reference library remains available below.</p>}
  {report&&<>
   <div className="table-scroll" tabIndex={0} role="region" aria-label="Canonical readings comparison, scroll horizontally for all columns">
    <table style={{borderCollapse:'collapse',width:'100%',minWidth:'58rem',fontSize:'.875rem'}}>
     <caption style={{textAlign:'left',padding:'.5rem 0'}}>Source-bound reading examples · independent review remains pending</caption>
     <thead><tr>{['Subject and state','Metric','Value','Uncertainty','Evidence','Source and context'].map(label=><th scope="col" style={cellStyle} key={label}>{label}</th>)}</tr></thead>
     <tbody>{report.reading_examples.map(reading=><tr key={reading.binding_id} data-reading-id={reading.binding_id}>
      <td style={{...cellStyle,overflowWrap:'anywhere'}}><strong>{reading.object_ref}</strong>{Object.entries(reading.state).map(([key,value])=><small key={key} style={{display:'block'}}>{key.replaceAll('_',' ')}: {contextText(value)}</small>)}</td>
      <th scope="row" style={cellStyle}>{reading.metric}</th>
      <td style={{...cellStyle,whiteSpace:'nowrap'}}>{String(reading.value)} {reading.unit}</td>
      <td style={cellStyle}>{reading.uncertainty===null?'UNKNOWN':<>±{String(reading.uncertainty)} {reading.unit}</>}<small style={{display:'block'}}>{reading.uncertainty_status}</small></td>
      <td style={cellStyle}>{reading.evidence_type}</td>
      <td style={{...cellStyle,overflowWrap:'anywhere'}}><a href={reading.provenance.source_url||assetURL(reading.provenance.path)} target="_blank" rel="noreferrer" style={{textDecoration:'underline'}}>{reading.provenance.source_id} · {reading.provenance.source_url?'original source':'canonical owner'}</a><details><summary>Conditions, provenance and limitations</summary>
       <dl>{Object.entries(reading.conditions).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd style={{marginLeft:'1rem'}}>{contextText(value)}</dd></div>)}</dl>
       <p><a href={assetURL(reading.provenance.path)} target="_blank" rel="noreferrer" style={{textDecoration:'underline'}}>Canonical owner</a> · Owner pointer: <code>{reading.provenance.pointer}</code></p>
       <p>Source locator: {reading.provenance.source_locator??'NOT-REPORTED-IN-OWNER'}</p>
       {locatorURL(reading.provenance.source_locator)&&<p><a href={locatorURL(reading.provenance.source_locator)!} target="_blank" rel="noreferrer" style={{textDecoration:'underline'}}>Open the recorded source locator</a></p>}
       <ul>{reading.limitations.map((limitation,index)=><li key={index}>{limitation}</li>)}</ul>
      </details></td>
     </tr>)}</tbody>
    </table>
   </div>
   <h3>Canonical relationships</h3>
   <p>These links retain the existing relationship registry. An unspecified evidence label remains visible.</p>
   {report.reading_relationships.length?<ul aria-label="Canonical reading relationships">{report.reading_relationships.map((relation,index)=><li key={index} style={{overflowWrap:'anywhere'}}><strong>{relation.source}</strong> → {relation.type} → <strong>{relation.target}</strong> · Evidence: {relation.evidence??'NOT-SPECIFIED-IN-REGISTRY'} · <a href={assetURL(relation.provenance.path)} target="_blank" rel="noreferrer" style={{textDecoration:'underline'}}>Relationship source</a><small style={{display:'block'}}>Registry pointer: {relation.provenance.pointer}</small></li>)}</ul>:<p>No relationships were included in this reading report.</p>}
  </>}
  <p><a href={assetURL('docs/07-migration/Russell-1926-Primary-Source.md')} target="_blank" rel="noreferrer" style={{textDecoration:'underline'}}>Explore Russell’s original charts and historical context</a></p>
 </section>;
}

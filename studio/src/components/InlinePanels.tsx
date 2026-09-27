import {useEffect,useState} from 'react';
import {assetURL} from '../data-loader';
interface Panel{panel_id:string;reference_label:string;locked_visual_slots:string[];asset_path?:string|null;review?:string;source_ids?:string[]}
let request:Promise<{elements:{record_id:string;panels:Panel[]}[]}>|undefined;
export function InlinePanels({path,tokens}:{path:string;tokens:string[]}){
 const [panels,setPanels]=useState<Panel[]>([]),[error,setError]=useState('');const id='MAT:'+(path.match(/^records\/(\d{4})-/)?.[1]||'');
 useEffect(()=>{let active=true;request??=fetch(assetURL('data/quality/panel-image-plan.json')).then(r=>{if(!r.ok)throw Error('Image register unavailable');return r.json()}).catch(e=>{request=undefined;throw e});request.then(plan=>{if(active)setPanels(plan.elements.find(e=>e.record_id===id)?.panels||[])}).catch(e=>active&&setError(String(e)));return()=>{active=false}},[id]);
 const selected=panels.filter(p=>tokens.includes(p.panel_id)||tokens.includes(p.locked_visual_slots[0]));
 return <section className="inline-panels" aria-label="Section illustrations">{error&&<p role="alert">{error}</p>}{selected.length?selected.map(p=><figure key={p.panel_id} data-inline-panel={p.panel_id}><figcaption><strong>{p.panel_id} — {p.reference_label}</strong><small>{id}:{p.panel_id} · {p.locked_visual_slots.join(', ')}</small></figcaption>{p.asset_path?<a href={assetURL(p.asset_path)} target="_blank" rel="noreferrer"><img src={assetURL(p.asset_path)} alt={p.reference_label} loading="lazy"/></a>:<div className="image-placeholder">Image pending — {p.panel_id}<small>Section placeholder retained; generation deferred.</small></div>}<p>{p.review||'Element-specific content and sources require review. Template labels are adapted to this element before image generation.'}</p>{p.source_ids?.length?<p>Source IDs: {p.source_ids.join(', ')}</p>:null}</figure>):<div className="image-placeholder">Visual slot {tokens.join(', ')} — image register pending</div>}</section>
}

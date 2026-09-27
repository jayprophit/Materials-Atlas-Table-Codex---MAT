import {Children,isValidElement,ReactNode} from 'react';
import {InlinePanels} from './InlinePanels';
import {prepareInlinePanels} from '../inline-panels';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {assetURL} from '../data-loader';
export function resolveLink(url:string,path:string):string{
 if(/^(https?:|mailto:)/i.test(url))return url;
 if(url.startsWith('#'))return url;
 if(/^[a-z][a-z0-9+.-]*:/i.test(url)||url.startsWith('//'))return '';
 const base=new URL(path,'https://mat.invalid/');
 const u=new URL(url,base);
 return assetURL(u.pathname.slice(1))+u.search+u.hash;
}
export function Markdown({body,path,onNavigate}:{body:string;path:string;onNavigate?:(path:string)=>void}){
 return <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={u=>resolveLink(u,path)} components={{
 pre:({children})=>{const text=Children.toArray(children).map(c=>isValidElement<{children?:ReactNode}>(c)?String(c.props.children||''):'').join('');const tokens=[...text.matchAll(/MAT-VISUAL:\s*(V\d{2})/g)].map(m=>m[1]);const panelCode=Children.toArray(children).some(c=>isValidElement<{className?:string}>(c)&&c.props.className==='language-mat-panels');if(panelCode)tokens.push(...(text.match(/[AB]\d{2}/g)||[]));return tokens.length?<InlinePanels path={path} tokens={[...new Set(tokens)]}/>:<pre>{children}</pre>},
 a:({href,children})=><a href={href} onClick={e=>{if(href&&onNavigate&&!/^(https?:|mailto:|#)/.test(href)&&href.split('#')[0].endsWith('.md')){e.preventDefault();onNavigate(decodeURI(href.replace(import.meta.env.BASE_URL,'')))}}}>{children}</a>,
 img:({src,alt})=><img src={src} alt={alt||'Uncaptioned figure — description required'} loading="lazy" onError={e=>{e.currentTarget.alt='Unavailable figure: '+(alt||src);}}/>
 }}>{prepareInlinePanels(body,path)}</ReactMarkdown>;
}

import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import YAML from 'yaml';
import {root} from './lib.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const index=JSON.parse(readFileSync(join(root,'data/catalog/ionisation-evaluation-index.json'),'utf8'));
const manifest=JSON.parse(readFileSync(join(root,'data/quality/ionisation-chart-manifest.json'),'utf8'));
if(manifest.elements.length!==index.elements.length)throw new Error('Chart coverage mismatch');
const seen=new Set(),images=new Set();let count=0;
for(const r of manifest.elements){
 if(seen.has(r.record_id))throw new Error('Duplicate record '+r.record_id);seen.add(r.record_id);
 const e=index.elements.find(e=>e.mat_id===r.record_id);if(!e||e.data!==r.input)throw new Error('Unknown chart owner');
 const raw=readFileSync(join(root,r.input),'utf8').replace(/\r\n/g,'\n');
 if(hash(raw)!==r.input_sha256)throw new Error('Stale chart input '+r.record_id);
 const data=YAML.parse(raw),numeric=data.entries.filter(x=>x.ionisation_energy.value!==null);
 if(numeric.length!==r.numeric_points)throw new Error('Numeric coverage mismatch '+r.record_id);
 if(!numeric.length){if(r.chart!==null||r.status!=='INSUFFICIENT DATA')throw new Error('Fabricated empty chart');continue;}
 const stem=r.input.split('/')[1],expected=`records/${stem}/graphs/${stem}-GRAPH-NIST-Ionisation-Ladder.svg`;
 if(r.chart!==expected||!existsSync(join(root,r.chart)))throw new Error('Chart path mismatch');
 const bytes=readFileSync(join(root,r.chart));
 if(hash(bytes)!==r.sha256||images.has(r.sha256))throw new Error('Changed or duplicate chart');images.add(r.sha256);
 if(!bytes.toString('utf8').includes('logarithmic scale'))throw new Error('Missing scale label');
 if(!readFileSync(join(root,e.chapter),'utf8').includes(`graphs/${stem}-GRAPH-NIST-Ionisation-Ladder.svg`))throw new Error('Missing chapter chart link');
 count++;
}
console.log(`Validated ${count} source-bound charts and ${manifest.elements.length-count} explicit no-data records.`);

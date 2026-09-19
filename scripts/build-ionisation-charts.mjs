// Prepare plotting inputs directly from the retained, validated per-element evaluation.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import YAML from 'yaml';
import {root} from './lib.mjs';
const index=JSON.parse(readFileSync(join(root,'data/catalog/ionisation-evaluation-index.json'),'utf8'));
const rows=index.elements.map(e=>{
 const raw=readFileSync(join(root,e.data),'utf8').replace(/\r\n/g,'\n'),d=YAML.parse(raw),stem=e.data.split('/')[1];
 return {record_id:d.record_id,stem,z:e.z,input:e.data,input_sha256:createHash('sha256').update(raw).digest('hex'),
  entries:d.entries.map(r=>({q:r.charge,value:r.ionisation_energy.value,uncertainty:r.ionisation_energy.uncertainty,status:r.ionisation_energy.value_status,source_line:r.source_line}))};
});
mkdirSync(join(root,'.mat-local'),{recursive:true});
const input=join(root,'.mat-local/ionisation-chart-input.json');writeFileSync(input,JSON.stringify(rows));
const python=process.argv[2];if(!python)throw new Error('Pass a Python interpreter with matplotlib installed.');
const r=spawnSync(python,[join(root,'scripts/plot-ionisation.py'),input,root],{stdio:'inherit'});
if(r.status!==0)process.exitCode=r.status||1;

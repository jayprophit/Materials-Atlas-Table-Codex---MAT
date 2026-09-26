import {readFileSync,writeFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';import YAML from 'yaml';import {root,R} from './lib.mjs';import {balmerData,balmerChart} from './hydrogen-balmer.mjs';
if(!process.argv[2])throw Error('Python interpreter required');
const raw=R(balmerData),d=YAML.parse(raw),input=join(root,'.mat-local/hydrogen-balmer-input.json');
writeFileSync(input,JSON.stringify({input:balmerData,input_sha256:createHash('sha256').update(raw).digest('hex'),chart:balmerChart,entries:d.entries}));
const r=spawnSync(process.argv[2],[join(root,'scripts/plot-hydrogen-balmer.py'),root,input],{stdio:'inherit'});if(r.status!==0)process.exitCode=r.status||1;

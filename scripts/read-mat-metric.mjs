import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {root} from './lib.mjs';
import {loadReading} from './mat-reading.mjs';
const bindings=JSON.parse(readFileSync(join(root,'data/research/mat-dashboard-bindings.json'),'utf8')).bindings;
const id=process.argv[2];
if(!id){console.log(JSON.stringify({available_bindings:bindings.map(b=>({id:b.binding_id,metric:b.metric,object:b.object_ref}))},null,2));}
else{
 const binding=bindings.find(b=>b.binding_id===id);
 if(!binding)throw new Error('Unknown binding; run without arguments to list supported readings');
 console.log(JSON.stringify(loadReading(binding),null,2));
}

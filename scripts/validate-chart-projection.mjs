// Validate retained chart owners read-only, independently of a publication build.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildChartProjection} from './mat-chart-projection.mjs';

export function validateChartProjection(root=resolve(import.meta.dirname,'..')){
 const report=buildChartProjection(root);
 return report.summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const summary=validateChartProjection();console.log('Chart projection PASS: '+summary.records+' canonical records; '+summary.available_charts+' retained elemental charts; '+summary.material_composition_charts+' material composition chart(s); '+JSON.stringify(summary.available_by_family));}
 catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1}
}

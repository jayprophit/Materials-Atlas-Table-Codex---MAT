export type ElementChartFamily='AME2020'|'NIST-IONISATION'|'NIST-THERMOCHEMISTRY';
export type ChartFamily=ElementChartFamily|'MATERIAL-COMPOSITION';
export type ChartSource={source_id:string;title:string|null;url:string|null;doi:string|null;review:string|null;registry_path:string};
export type RecordChart={family:ChartFamily;title:string;status:'AVAILABLE'|'INSUFFICIENT-DATA'|'NOT-APPLICABLE';reason:string|null;svg:string|null;owner:string|null;csv:string|null;chapter:string;sources:ChartSource[];columns:string[];rows:(string|number|null)[][];context:Record<string,unknown>;numeric_points?:number};
export type MaterialChart={material_ref:string;state_ref:string;name:string;table:string;process_svg:string;steps:{order:number;label:string;description:string;source_locator:string;input_states:string[];output_states:string[];parameters:{metric:string;display:string}[]}[];limitations:string[];chart:RecordChart};
export type ChartRecord={record_id:string;name:string;kind:'FOUNDATION'|'CONFIRMED-ELEMENT';chapter:string;charts:RecordChart[];material_charts:MaterialChart[]};
export type ChartProjection={schema_version:'1.0.0';scope:string;notice:string;summary:{records:number;confirmed_elements:number;available_charts:number;material_composition_charts:number;available_by_family:Record<ElementChartFamily,number>};inputs:{path:string;sha256:string}[];records:ChartRecord[]};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
export function safeChartPath(value:unknown):value is string{
 if(!text(value)||value!==value.trim()||/[\\?#\u0000-\u001f\u007f]/.test(value))return false;
 try{const decoded=decodeURIComponent(value);return !decoded.startsWith('/')&&!decoded.includes('\\')&&!decoded.split('/').some(part=>part==='..'||part==='')&&!/^[a-z][a-z0-9+.-]*:/i.test(decoded)&&!/[\u0000-\u001f\u007f]/.test(decoded)}catch{return false}
}
export function safeChartSourceUrl(value:unknown):string|null{
 if(!text(value)||/[\u0000-\u0020\u007f\\]/.test(value))return null;
 try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?value:null}catch{return null}
}
function assertChart(chart:unknown,permitted:string[]):asserts chart is RecordChart{
 if(!object(chart)||!permitted.includes(String(chart.family))||!text(chart.title)||!['AVAILABLE','INSUFFICIENT-DATA','NOT-APPLICABLE'].includes(String(chart.status))||!safeChartPath(chart.chapter)||!object(chart.context)||!Array.isArray(chart.sources)||!Array.isArray(chart.columns)||!chart.columns.every(text)||!Array.isArray(chart.rows)||(chart.reason!==null&&!text(chart.reason)))throw Error('The chart catalogue contains an incomplete chart.');
 for(const key of ['svg','owner','csv'])if(chart[key]!==null&&!safeChartPath(chart[key]))throw Error('The chart catalogue contains an unsafe asset path.');
 if(chart.status==='AVAILABLE'){if(!chart.svg||!chart.owner||!chart.rows.length||!chart.sources.length)throw Error('An available chart is missing its asset or source values.')}else if(chart.svg!==null||chart.rows.length)throw Error('A missing/reference chart contains unsupported numeric data.');
 if(!chart.rows.every(row=>Array.isArray(row)&&row.length===(chart.columns as unknown[]).length&&row.every(cell=>cell===null||typeof cell==='string'||(typeof cell==='number'&&Number.isFinite(cell)))))throw Error('The chart catalogue contains invalid table values.');
 for(const source of chart.sources)if(!object(source)||!text(source.source_id)||!safeChartPath(source.registry_path)||['title','doi','review'].some(key=>source[key]!==null&&typeof source[key]!=='string')||(source.url!==null&&!safeChartSourceUrl(source.url)))throw Error('The chart catalogue contains an unsafe or unresolved source.');
}
export function parseChartProjection(value:unknown):ChartProjection{
 if(!object(value)||value.schema_version!=='1.0.0'||!text(value.scope)||!text(value.notice)||!object(value.summary)||!Array.isArray(value.inputs)||!Array.isArray(value.records))throw Error('The chart catalogue is incomplete.');
 const summary=value.summary;
 const ids=new Set<string>(),materialIds=new Set<string>(),counts:Record<ElementChartFamily,number>={'AME2020':0,'NIST-IONISATION':0,'NIST-THERMOCHEMISTRY':0};let count=0,confirmed=0,materialCount=0;
 for(const input of value.inputs)if(!object(input)||!safeChartPath(input.path)||typeof input.sha256!=='string'||!/^[a-f0-9]{64}$/.test(input.sha256))throw Error('The chart catalogue contains incomplete provenance.');
 for(const record of value.records){
  if(!object(record)||!text(record.record_id)||!/^MAT:\d{4,}$/.test(record.record_id)||ids.has(record.record_id)||!text(record.name)||!safeChartPath(record.chapter)||!['FOUNDATION','CONFIRMED-ELEMENT'].includes(String(record.kind))||!Array.isArray(record.charts)||!Array.isArray(record.material_charts))throw Error('The chart catalogue contains a duplicate or incomplete record.');
  ids.add(record.record_id);if(record.kind==='CONFIRMED-ELEMENT')confirmed++;
  if((record.record_id==='MAT:0000')!==(record.kind==='FOUNDATION'))throw Error('The foundation identity has an incorrect object type.');
  const families=new Set<string>();
  for(const chart of record.charts){
   assertChart(chart,['AME2020','NIST-IONISATION','NIST-THERMOCHEMISTRY']);if(families.has(chart.family))throw Error('The chart catalogue contains a duplicate chart family.');
   families.add(chart.family);
   if(chart.status==='AVAILABLE'){count++;counts[chart.family as ElementChartFamily]++}
   if(record.kind==='FOUNDATION'&&chart.status!=='NOT-APPLICABLE'||record.kind==='CONFIRMED-ELEMENT'&&chart.status==='NOT-APPLICABLE')throw Error('The chart applicability differs from its object type.');
  }
  if(families.size!==3)throw Error('The chart catalogue is missing a chart family.');
  for(const material of record.material_charts){
   if(record.kind==='FOUNDATION'||!object(material)||!text(material.material_ref)||!material.material_ref.startsWith(record.record_id+':MATERIAL:')||materialIds.has(material.material_ref)||!text(material.state_ref)||!material.state_ref.startsWith(material.material_ref+':STATE:')||!text(material.name)||!safeChartPath(material.table)||!safeChartPath(material.process_svg)||!Array.isArray(material.steps)||!material.steps.length||!Array.isArray(material.limitations)||!material.limitations.every(text))throw Error('The chart catalogue contains an incomplete material reference.');
   assertChart(material.chart,['MATERIAL-COMPOSITION']);if(material.chart.status!=='AVAILABLE')throw Error('The material reference is missing source-backed data.');
   for(const [index,step] of material.steps.entries())if(!object(step)||step.order!==index+1||!text(step.label)||!text(step.description)||!text(step.source_locator)||!Array.isArray(step.input_states)||!step.input_states.every(text)||!Array.isArray(step.output_states)||!step.output_states.every(text)||!Array.isArray(step.parameters)||!step.parameters.every(parameter=>object(parameter)&&text(parameter.metric)&&text(parameter.display)))throw Error('The chart catalogue contains an incomplete material preparation sequence.');
   materialIds.add(material.material_ref);materialCount++;
  }
 }
 if(!ids.has('MAT:0000')||summary.records!==ids.size||summary.confirmed_elements!==confirmed||summary.available_charts!==count||summary.material_composition_charts!==materialCount||!object(summary.available_by_family)||Object.entries(counts).some(([family,total])=>(summary.available_by_family as Record<string,unknown>)[family]!==total))throw Error('The chart catalogue coverage summary does not match its records.');
 return value as unknown as ChartProjection;
}
export function chartValue(value:string|number|null):string{return value===null?'UNKNOWN':String(value)}

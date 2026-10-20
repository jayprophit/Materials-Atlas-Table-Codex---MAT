import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseChartProjection,safeChartPath,safeChartSourceUrl,chartValue} from './chart-gallery';
import type {ChartProjection,RecordChart,ChartFamily,MaterialChart} from './chart-gallery';
import {ChartCard,RecordCharts,MaterialCharts} from './components/ChartGallery';

// UI-only fixtures. No test values are written to scientific owners or publication data.
const chapter='records/0001-Hydrogen-H/0001-Hydrogen-H.md';
const source={source_id:'SRC-TEST',title:'Test source',url:'https://example.org/source',doi:null,review:'TEST-ONLY',registry_path:'data/registries/sources.yaml'};
function chart(family:ChartFamily,status:RecordChart['status']='AVAILABLE'):RecordChart{
 return {family,title:family+' fixture',status,reason:status==='AVAILABLE'?null:'No values accessioned in this fixture.',svg:status==='AVAILABLE'?'records/0001-Hydrogen-H/graphs/fixture.svg':null,owner:status==='AVAILABLE'?'records/0001-Hydrogen-H/data/fixture.yaml':null,csv:null,chapter,sources:status==='AVAILABLE'?[{...source}]:[],columns:status==='AVAILABLE'?['Coordinate','Value','Uncertainty','Evidence']:[],rows:status==='AVAILABLE'?[[1,0,null,'THEORETICAL']]:[],context:{reference_state:'Named fixture state',y_unit:'eV',scale:'LINEAR'}};
}
function fixture():ChartProjection{
 const families=['AME2020','NIST-IONISATION','NIST-THERMOCHEMISTRY'] as const;
 return {schema_version:'1.0.0',scope:'Test fixture scope',notice:'Test fixture: excluded legacy abundance.',summary:{records:2,confirmed_elements:1,available_charts:1,material_composition_charts:0,available_by_family:{AME2020:1,'NIST-IONISATION':0,'NIST-THERMOCHEMISTRY':0}},inputs:[{path:'data/quality/fixture.json',sha256:'a'.repeat(64)}],records:[
  {record_id:'MAT:0000',name:'Origin',kind:'FOUNDATION',chapter:'records/0000-Origin-State/0000-Origin-State.md',charts:families.map(family=>chart(family,'NOT-APPLICABLE')),material_charts:[]},
  {record_id:'MAT:0001',name:'Hydrogen',kind:'CONFIRMED-ELEMENT',chapter,charts:families.map(family=>chart(family,family==='AME2020'?'AVAILABLE':'INSUFFICIENT-DATA')),material_charts:[]}
 ]};
}
function material():MaterialChart{
 return {material_ref:'MAT:0001:MATERIAL:TEST',state_ref:'MAT:0001:MATERIAL:TEST:STATE:CHIPS',name:'Test material',table:'records/0001-Hydrogen-H/tables/fixture.md',process_svg:'records/0001-Hydrogen-H/diagrams/fixture.svg',steps:[{order:1,label:'Source preparation',description:'Fixture context',source_locator:'fixture page 1',input_states:['INPUT'],output_states:['CHIPS'],parameters:[{metric:'source_geometry',display:'approximately 1 mm'}]}],limitations:['Fixture source: conditions unknown'],chart:{...chart('MATERIAL-COMPOSITION'),columns:['Constituent','Value','Expanded U','Assignment'],rows:[['Fixture A','1.00','0.01','CERTIFIED'],['Fixture B','0.01',null,'INFORMATION']],context:{reference_state:'Fixture material state',coverage:'PARTIAL',unit:'wt%',reported_sum_wt_percent:1.01,combined_uncertainty:null,process_arrow_meaning:'ORDERED-SOURCE-REPORTED-SEQUENCE'}}};
}

describe('source-bound chart catalogue reader',()=>{
 it('retains zero, unknown and evidence qualifiers without numeric coercion',()=>{
  const result=parseChartProjection(fixture());expect(result.records[1].charts[0].rows[0]).toEqual([1,0,null,'THEORETICAL']);
  expect(chartValue(0)).toBe('0');expect(chartValue(null)).toBe('UNKNOWN');expect(chartValue('0.00')).toBe('0.00');
 });
 it('rejects unsafe owner/source routes and malformed table shapes',()=>{
  for(const path of ['../private','records/%2e%2e/private','C:/private','file:///private','https://example.org/','/records/a','records/a\\b','records/a?x=1','records/a#section','records//a'])expect(safeChartPath(path)).toBe(false);
  expect(safeChartPath('records/0001-Hydrogen-H/graphs/example.svg')).toBe(true);
  expect(safeChartSourceUrl('javascript:alert(1)')).toBeNull();expect(safeChartSourceUrl('file:///C:/private')).toBeNull();
  expect(safeChartSourceUrl('https://example.org/source')).toBe('https://example.org/source');
  const malformed=fixture();malformed.records[1].charts[0].rows[0].pop();expect(()=>parseChartProjection(malformed)).toThrow(/table values/);
  const unsafe=fixture();unsafe.records[1].charts[0].sources[0].url='javascript:alert(1)';expect(()=>parseChartProjection(unsafe)).toThrow(/unsafe or unresolved source/);
 });
 it('validates canonical coverage, unique families and foundation applicability',()=>{
  let invalid=fixture();invalid.records[1].charts[1]=invalid.records[1].charts[0];expect(()=>parseChartProjection(invalid)).toThrow(/duplicate chart family/);
  invalid=fixture();invalid.summary.available_by_family.AME2020=2;expect(()=>parseChartProjection(invalid)).toThrow(/coverage summary/);
  invalid=fixture();invalid.records[0].kind='CONFIRMED-ELEMENT';expect(()=>parseChartProjection(invalid)).toThrow(/foundation identity/);
  invalid=fixture();invalid.records[0].charts[0]=chart('AME2020');expect(()=>parseChartProjection(invalid)).toThrow(/applicability/);
  invalid=fixture();invalid.inputs[0].sha256='not-a-hash';expect(()=>parseChartProjection(invalid)).toThrow(/provenance/);
 });
 it('renders no images or value tables for foundation and missing-data cards',()=>{
  const foundation=renderToStaticMarkup(<RecordCharts record={fixture().records[0]} onNavigate={()=>{}}/>);
  expect(foundation).toContain('no elemental mass');expect(foundation).toContain('Not applicable');expect(foundation).not.toContain('<img');expect(foundation).not.toContain('<table');
  const missing=renderToStaticMarkup(<ChartCard chart={chart('NIST-IONISATION','INSUFFICIENT-DATA')} onNavigate={()=>{}}/>);
  expect(missing).toContain('Insufficient source data');expect(missing).not.toContain('<img');expect(missing).not.toContain('<table');
 });
 it('provides source links, units and an accessible table preserving explicit unknowns',()=>{
  const html=renderToStaticMarkup(<ChartCard chart={chart('AME2020')} onNavigate={()=>{}}/>);
  expect(html).toContain('Reference state: Named fixture state');expect(html).toContain('Vertical unit: eV');expect(html).toContain('Chart scale: LINEAR');
  expect(html).toContain('href="/records/0001-Hydrogen-H/graphs/fixture.svg"');expect(html).toContain('href="https://example.org/source"');
  expect(html).toContain('<caption>');expect(html).toContain('role="region"');expect(html).toContain('tabindex="0"');expect(html).toContain('<td>0</td>');expect(html).toContain('<td>UNKNOWN</td>');expect(html).toContain('THEORETICAL');
 });
 it('paginates long data tables while retaining complete-download links',()=>{
  const large=chart('NIST-THERMOCHEMISTRY');large.rows=Array.from({length:60},(_,index)=>[index,1,null,'CALCULATED']);large.csv='records/0001-Hydrogen-H/tables/fixture.csv';
  const html=renderToStaticMarkup(<ChartCard chart={large} onNavigate={()=>{}}/>);
  expect((html.match(/<tr>/g)??[]).length).toBe(26);expect(html).toContain('Value page 1 of 3');expect(html).toContain('Complete source CSV');expect(html).toContain('60 rows');
 });
 it('keeps related material assignments and process context separate from elemental chart counts',()=>{
  const report=fixture();report.records[1].material_charts=[material()];report.summary.material_composition_charts=1;
  expect(parseChartProjection(report).summary.available_charts).toBe(1);
  const html=renderToStaticMarkup(<MaterialCharts material={material()} onNavigate={()=>{}}/>);
  expect(html).toContain('unreported balance remains unassigned');expect(html).toContain('not a property of pure Iron');expect(html).toContain('INFORMATION uncertainty is UNKNOWN');
  expect(html).toContain('CERTIFIED');expect(html).toContain('<td>UNKNOWN</td>');expect(html).toContain('ORDERED-SOURCE-REPORTED-SEQUENCE');expect(html).toContain('approximately 1 mm');expect(html).toContain('zero credit');
  report.records[1].material_charts[0].state_ref='MAT:0002:MATERIAL:TEST:STATE:CHIPS';expect(()=>parseChartProjection(report)).toThrow(/incomplete material reference/);
 });
});

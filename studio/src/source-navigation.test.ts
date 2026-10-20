import {describe,it,expect} from 'vitest';
import {filterNavigationSources,missingSourceMetadata,parseSourceNavigation,registeredAuthors} from './source-navigation';
import type {NavigationSource} from './source-navigation';

// Shape fixtures only; these labels and numbers are not scientific source records.
const source=(overrides:Partial<NavigationSource>={}):NavigationSource=>({source_id:'SRC-000001',title:'Navigation test fixture',authors:[],year:null,source_type:null,registry_pointer:'/sources/0',registry_metadata:{verification_status:'UNREVIEWED-TEST-FIXTURE'},external_links:[],local_links:[],usages:[],...overrides});
const report=(sources:NavigationSource[])=>({schema_version:'1.0.0',registry:{path:'data/registries/sources.yaml',sha256:'a'.repeat(64)},sources,unresolved_references:[]});
describe('source navigation projection',()=>{
 it('retains singular authors and ambiguous attribution without inferring organizations as authors',()=>{
  const singular=source({year:2020,source_type:'TEST',registry_metadata:{author:'Recorded author'}});
  expect(registeredAuthors(singular)).toEqual(['Recorded author']);expect(missingSourceMetadata(singular)).toEqual([]);
  expect(filterNavigationSources([singular],'','metadata')).toEqual([]);
  const ambiguous=source({registry_metadata:{author:{name:'Unresolved attribution'}}});
  expect(registeredAuthors(ambiguous)).toEqual([{name:'Unresolved attribution'}]);expect(missingSourceMetadata(ambiguous)).toContain('authors');
  expect(registeredAuthors(source({registry_metadata:{organization:'Recorded organization'}}))).toEqual([]);
 });
 it('preserves exact registry metadata and visible gaps without inventing links',()=>{
  const s=source(),parsed=parseSourceNavigation(report([s]));
  expect(parsed.sources[0]).toBe(s);
  expect(parsed.sources[0].registry_metadata.verification_status).toBe('UNREVIEWED-TEST-FIXTURE');
  expect(parsed.sources[0].external_links).toEqual([]);
  expect(missingSourceMetadata(s)).toEqual(['authors','year','source type']);
 });
 it('searches source IDs or titles and filters the registered link and metadata coverage',()=>{
  const sources=[source(),source({source_id:'SRC-000002',title:'Second test fixture',authors:['Test author'],year:2000,source_type:'TEST',external_links:[{field_path:'$.url',url:'https://example.test/reference',status:'REGISTERED-NOT-LIVE-CHECKED'}]}),source({source_id:'SRC-000003',title:'Local test fixture',local_links:[{field_path:'$.local_path',path:'data/test-fixture.txt',status:'PRESENT'}]})];
  expect(filterNavigationSources(sources,' src-000002 ','all').map(s=>s.source_id)).toEqual(['SRC-000002']);
  expect(filterNavigationSources(sources,'LOCAL TEST','all').map(s=>s.source_id)).toEqual(['SRC-000003']);
  expect(filterNavigationSources(sources,'','external').map(s=>s.source_id)).toEqual(['SRC-000002']);
  expect(filterNavigationSources(sources,'','local').map(s=>s.source_id)).toEqual(['SRC-000003']);
  expect(filterNavigationSources(sources,'','metadata').map(s=>s.source_id)).toEqual(['SRC-000001','SRC-000003']);
 });
 it('rejects malformed reports, duplicate sources and unsafe external URL schemes',()=>{
  expect(()=>parseSourceNavigation({})).toThrow(/missing/);
  expect(()=>parseSourceNavigation(report([source(),source()]))).toThrow(/duplicate/);
  expect(()=>parseSourceNavigation(report([source({external_links:[{field_path:'$.url',url:'javascript:alert(1)',status:'REGISTERED-NOT-LIVE-CHECKED'}]})]))).toThrow(/external link/);
  const bad=report([source()]);bad.sources[0].usages.push({path:'docs/test.md',format:'MARKDOWN',location:null,document_index:null,line:-1,reference:'SRC-000001',resolution:'CANONICAL',kind:'MARKDOWN-MENTION'});
  expect(()=>parseSourceNavigation(bad)).toThrow(/usage location/);
 });
 it('keeps grouped citation counts and unresolved source IDs separate from registered owners',()=>{
  const usage={path:'docs/test-fixture.md',format:'MARKDOWN' as const,location:null,document_index:null,line:null,reference:'SRC-000001',resolution:'CANONICAL' as const,kind:'MARKDOWN-MENTION' as const,occurrence_count:3,occurrences_pointer:'/occurrences/0'};
  const unresolved={...usage,reference:'SRC-999999',source_id:'SRC-999999',resolution:'UNRESOLVED' as const};
  const parsed=parseSourceNavigation({...report([source({usages:[usage]})]),detail_index:{path:'data/indexes/test-fixture.json.gz',sha256:'b'.repeat(64)},unresolved_references:[unresolved]});
  expect(parsed.sources[0].usages[0].occurrence_count).toBe(3);
  expect(parsed.detail_index?.path).toBe('data/indexes/test-fixture.json.gz');
  expect(parsed.unresolved_references[0].source_id).toBe('SRC-999999');
  expect(()=>parseSourceNavigation(report([source({usages:[unresolved]})]))).toThrow(/usage location/);
 });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import YAML from 'yaml';
import {gunzipSync} from 'node:zlib';
import {buildSourceNavigation,documentLink,sourceNavigationGuide,compactSourceNavigation,checkSourceNavigation} from '../build-source-navigation.mjs';
import {root} from '../lib.mjs';

function fixture(t,sources){
 const repoRoot=mkdtempSync(join(tmpdir(),'mat-source-navigation-'));
 t.after(()=>rmSync(repoRoot,{recursive:true,force:true}));
 const write=(path,content)=>{mkdirSync(join(repoRoot,dirname(path)),{recursive:true});writeFileSync(join(repoRoot,path),content);};
 write('data/registries/sources.yaml',YAML.stringify({registry:{registry_id:'MAT:REG:SOURCES'},sources}));
 return {repoRoot,write};
}
const source={source_id:'SRC-000001',source_aliases:['SRC-H-001'],title:'Original measurement',url:'https://example.org/paper',local_path:'data/research/sources/snapshot.txt',doi:'10.1234/original'};

test('source navigation joins canonical IDs and aliases without inventing source metadata',t=>{
 const f=fixture(t,[source,{source_id:'SRC-000002'}]);
 f.write(source.local_path,'Original source contents');
 f.write('records/example.yaml','source_id: SRC-000001\nsources: [SRC-H-001, SRC-999999]\n---\nsource_id: SRC-000002\n');
 f.write('docs/example.md','A source: SRC-000001. Historical family SRC-H-HIST-*.\n\n```yaml\nsource_id: SRC-999998\n```\n\n[Original](https://example.org/paper) and [Owner](../records/example.yaml).\n');
 const report=buildSourceNavigation({repoRoot:f.repoRoot,files:['records/example.yaml','docs/example.md']});
 assert.equal(report.summary.registered_sources,2);assert.equal(report.summary.cited_sources,2);
 assert.equal(report.summary.citation_occurrences,4);
 assert.deepEqual(report.summary.unresolved_source_ids,['SRC-999999']);
 assert.equal(report.summary.source_id_pattern_mentions,1);assert.equal(report.reference_patterns[0].pattern,'SRC-H-HIST-*');
 assert.equal(report.sources[0].local_links[0].status,'PRESENT');
 assert.equal(report.sources[0].external_links[0].status,'REGISTERED-NOT-LIVE-CHECKED');
 assert.ok(report.sources[0].external_links.some(link=>link.url==='https://doi.org/10.1234/original'));
 assert.equal(report.sources[0].usages.find(usage=>usage.reference==='SRC-H-001').resolution,'ALIAS');
 assert.equal(report.sources[1].usages[0].document_index,1);
 assert.equal(report.sources[1].title,null);assert.equal(report.sources[1].registry_metadata.retrieved,undefined);
 assert.equal(report.document_links.length,2);assert.equal(report.document_links[1].target,'records/example.yaml');
 assert.equal(report.document_links[1].status,'PRESENT');
 assert.equal(report.unresolved_references[0].location,'$.sources[1]');
 assert.match(sourceNavigationGuide(report),/Original source/);
 assert.doesNotMatch(sourceNavigationGuide(report),/SRC-999998/);
});

test('JSON arrays and source metadata remain exact and output is deterministic',t=>{
 const f=fixture(t,[{source_id:'SRC-000001',dated_extractions:[{retrieved:'2026-10-03',snapshot:'data/catalog/source.json'}],verification_status:'SELECTED-CLAIMS-CHECKED',licence:'Documented source terms'}]);
 f.write('data/catalog/source.json','{}');f.write('records/example.json',JSON.stringify({observations:[{source_ids:['SRC-000001'],value:null,evidence_type:'UNVERIFIED'}]}));
 const options={repoRoot:f.repoRoot,files:['records/example.json']};
 const first=buildSourceNavigation(options),second=buildSourceNavigation(options);
 assert.deepEqual(first,second);assert.equal(first.summary.sources_without_retrieval_metadata,0);
 assert.equal(first.sources[0].local_links[0].status,'PRESENT');
 assert.equal(first.sources[0].registry_metadata.verification_status,'SELECTED-CLAIMS-CHECKED');
 assert.equal(first.sources[0].usages[0].location,'$.observations[0].source_ids[0]');
 assert.equal(first.summary.sources_without_any_destination,0);
 assert.equal(first.summary.sources_without_license_metadata,0);
});

test('compact navigation retains every exact field location in deterministic compressed detail',t=>{
 const f=fixture(t,[source]);
 f.write('records/example.yaml','measurements:\n  - source_id: SRC-000001\n  - source_id: SRC-000001\n  - source_id: SRC-H-001\n');
 const full=buildSourceNavigation({repoRoot:f.repoRoot,files:['records/example.yaml']});
 const first=compactSourceNavigation(full),second=compactSourceNavigation(full);
 assert.deepEqual(first,second);assert.equal(first.report.sources[0].usages.length,2);
 assert.equal(first.report.sources[0].usages[0].occurrence_count,2);
 assert.equal(first.report.sources[0].usages[0].location,null);
 const detail=JSON.parse(gunzipSync(first.detail).toString('utf8'));
 assert.deepEqual(detail.sources['SRC-000001'].usages,full.sources[0].usages);
 assert.equal(detail.sources['SRC-000001'].usages[1].location,'$.measurements[1].source_id');
 assert.equal(first.report.detail_index.format,'JSON-GZIP');
 assert.match(sourceNavigationGuide(first.report),/Download every occurrence/);
});

test('freshness check detects changed owners, added inputs and missing detailed index',t=>{
 const f=fixture(t,[source]);
 f.write('records/example.yaml','source_id: SRC-000001');
 const files=['records/example.yaml'],full=buildSourceNavigation({repoRoot:f.repoRoot,files});
 const {report,detail}=compactSourceNavigation(full);
 assert.ok(checkSourceNavigation(report,{repoRoot:f.repoRoot,files}).some(error=>error.startsWith('Missing input: data/indexes/')));
 f.write(report.detail_index.path,detail);
 assert.deepEqual(checkSourceNavigation(report,{repoRoot:f.repoRoot,files}),[]);
 f.write(files[0],'source_id: SRC-H-001');
 assert.ok(checkSourceNavigation(report,{repoRoot:f.repoRoot,files}).some(error=>error==='Changed input: records/example.yaml'));
 assert.ok(checkSourceNavigation(report,{repoRoot:f.repoRoot,files:[...files,'docs/new.md']}).some(error=>error.startsWith('Input inventory changed')));
});

test('missing and unsafe destinations remain visible without executable links',t=>{
 const f=fixture(t,[{source_id:'SRC-000001',url:'javascript:alert(1)',local_path:'../outside.pdf',doi:'not-a-doi'}]);
 f.write('docs/example.md','[Missing](missing.md) [Unsafe](javascript:alert(1)) [Reference][a]\n\n[a]: ../records/absent.yaml\n');
 const report=buildSourceNavigation({repoRoot:f.repoRoot,files:['docs/example.md']});
 assert.equal(report.sources[0].external_links[0].status,'INVALID-URL');
 assert.equal(report.sources[0].external_links[1].status,'INVALID-DOI');
 assert.equal(report.sources[0].local_links[0].status,'OUTSIDE-REPOSITORY');
 assert.equal(report.summary.sources_without_any_destination,1);
 assert.equal(report.summary.missing_document_targets,2);
 assert.equal(report.document_links.find(link=>link.kind==='UNSUPPORTED').status,'UNSUPPORTED-SCHEME');
 assert.doesNotMatch(sourceNavigationGuide(report),/\]\(<javascript:/);
 assert.equal(documentLink(f.repoRoot,'docs/example.md','../../outside.md').status,'OUTSIDE-REPOSITORY');
 assert.equal(documentLink(f.repoRoot,'docs/example.md','%ZZ').status,'INVALID');
 assert.equal(documentLink(f.repoRoot,'docs/example.md','#existing-heading').target,'docs/example.md');
});

test('ambiguous source identities and parse failures cannot appear as complete navigation',t=>{
 const f=fixture(t,[source,{source_id:'SRC-000001'}]);
 assert.throws(()=>buildSourceNavigation({repoRoot:f.repoRoot,files:[]}),/duplicate canonical/);
 f.write('data/registries/sources.yaml',YAML.stringify({sources:[source,{source_id:'SRC-000002',source_aliases:['SRC-H-001']}]}));
 assert.throws(()=>buildSourceNavigation({repoRoot:f.repoRoot,files:[]}),/Ambiguous source alias/);
 f.write('data/registries/sources.yaml',YAML.stringify({sources:[source]}));
 f.write('records/invalid.yaml','source_id: [SRC-000001');
 const report=buildSourceNavigation({repoRoot:f.repoRoot,files:['records/invalid.yaml']});
 assert.equal(report.summary.parse_errors,1);assert.equal(report.summary.citation_occurrences,0);
 assert.equal(report.issues[0].path,'records/invalid.yaml');
 assert.throws(()=>buildSourceNavigation({repoRoot:f.repoRoot,files:['../outside.yaml']}),/outside repository/);
});

test('Hydrogen source navigation preserves canonical experiment provenance and external destination',()=>{
 const experiment='records/0001-Hydrogen-H/experiments/0001-Hydrogen-H-Experiments.yaml';
 const report=buildSourceNavigation({repoRoot:root,files:[experiment]});
 const hyperfine=report.sources.find(source=>source.source_id==='SRC-000009');
 assert.ok(hyperfine.usages.some(usage=>usage.path===experiment&&usage.location==='$.experiments[0].source_id'));
 assert.ok(hyperfine.external_links.some(link=>link.url==='https://tf.nist.gov/general/pdf/13.pdf'));
 assert.match(hyperfine.registry_metadata.verification_status,/NOT-INDEPENDENT-REPLICATION/);
 assert.equal(report.summary.parse_errors,0);
 const owner=readFileSync(join(root,experiment),'utf8');
 assert.match(owner,/1420405751\.768/); // Navigation reads the owner without changing its measurement.
});

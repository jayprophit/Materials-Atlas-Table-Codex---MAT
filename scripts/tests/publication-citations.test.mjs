import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationCitations} from '../publication-citations.mjs';
test('known guide diagnostics are preserved separately from genuine missing citations',()=>{
 const text='Registered SRC-000001. Unresolved SRC-000002. SRC-000003 newly missing.',known=new Map([['SRC-000001',{}]]);
 const result=publicationCitations(text,'docs/05-index/Source-Navigation.md',known,['SRC-000002']);
 assert.deepEqual(result.sourceIds,['SRC-000001','SRC-000003']);assert.deepEqual(result.missingSources,['SRC-000003']);
 assert.deepEqual(result.referenceDiagnostics,[{source_id:'SRC-000002',role:'UNRESOLVED-NAVIGATION-DIAGNOSTIC',owner:'data/indexes/source-navigation.json'}]);
 const chapter=publicationCitations(text,'records/0001-Hydrogen-H/0001-Hydrogen-H.md',known,['SRC-000002']);
 assert.deepEqual(chapter.missingSources,['SRC-000002','SRC-000003']);assert.deepEqual(chapter.referenceDiagnostics,[]);
 const ordinary=publicationCitations(text,'docs/reference.md',known,['SRC-000002']);assert.deepEqual(ordinary.missingSources,chapter.missingSources);
});

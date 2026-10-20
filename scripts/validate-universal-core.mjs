import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {root} from './lib.mjs';
import {buildUniversalObjects,verifyOwner,hash,universalSchema} from './mat-universal-object.mjs';
import {loadMaterialExample} from './mat-material.mjs';
import {loadNeutralHydrogen} from './mat-atomic.mjs';

const objects=buildUniversalObjects();
objects.forEach(o=>verifyOwner(o));
const material=loadMaterialExample();
const atom=loadNeutralHydrogen();
verifyOwner(material.object);
const sourcePath='data/research/sources/mat-update-2026-09-29.txt';
const source=readFileSync(join(root,sourcePath),'utf8');
const section=n=>source.split(new RegExp(`^# ${n}\\. .+$`,'m'))[1]?.split(/^# \d+\. /m)[0]??'';
const operators=section(32).split('Important:')[0].split(/\r?\n/).filter(l=>/^[ABC] [+×÷-] [ABC] = [ABC]$/.test(l));
const expressions=section(33).split(/\r?\n/).filter(l=>/^[ABC] [+×÷-] [ABC] [+×÷-] [ABC] = x$/.test(l));
if(operators.length!==12||new Set(operators).size!==12||expressions.length!==24||new Set(expressions).size!==24)throw Error('Authored expression preservation changed');
const report={schema_version:'1.0.0',scope:'Read-only universal contract coverage; no scientific completeness or physical solver certification',
  counts:{objects:objects.length,foundation:objects.filter(o=>o.recognition==='FOUNDATION').length,recognised:objects.filter(o=>o.recognition==='RECOGNISED').length,proposed:objects.filter(o=>o.recognition==='PROPOSED-NOT-RECOGNISED').length,non_element:objects.filter(o=>o.recognition==='NOT-AN-ELEMENT').length},
  schema:{path:universalSchema,sha256:hash(readFileSync(join(root,universalSchema)))},
  author_framework:{source:sourcePath,source_sha256:hash(readFileSync(join(root,sourcePath))),status:'AUTHOR-FRAMEWORK',execution:'NEVER-EVALUATED-AS-ALGEBRA',operators,expressions},
  objects,material_examples:[material],atomic_examples:[atom]};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else console.log('Universal core: '+JSON.stringify(report.counts)+'; 12 authored operators and 24 expressions preserved, not executed.');

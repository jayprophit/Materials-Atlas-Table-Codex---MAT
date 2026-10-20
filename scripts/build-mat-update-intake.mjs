import fs from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {root,loadYaml} from './lib.mjs';
import {loadReading,loadReadingComparison,checkFrequencyPeriod} from './mat-reading.mjs';
import {loadMaterialExample,materialOwnerPath} from './mat-material.mjs';
import {loadNeutralHydrogen,atomicSourcePaths} from './mat-atomic.mjs';
const read=p=>JSON.parse(fs.readFileSync(join(root,p),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const review=read('data/research/mat-update-review.json');
const bytes=fs.readFileSync(join(root,review.source.path));
if(sha(bytes)!==review.source.sha256)throw new Error('Reference bytes changed; create a new accession rather than silently reindexing');
const lines=bytes.toString('utf8').split(/\r?\n/);if(lines.at(-1)==='')lines.pop();
const headings=lines.map((line,i)=>{const m=line.match(/^# (\d+)\. (.+)$/);return m?{number:Number(m[1]),title:m[2],start_line:i+1}:null;}).filter(Boolean);
if(headings.length!==143||headings.some((h,i)=>h.number!==i))throw new Error('Expected ordered sections 0 through 142');
const sections=headings.map((h,i)=>{
 const end_line=(headings[i+1]?.start_line??lines.length+1)-1;
 const matches=review.groups.filter(g=>h.number>=g.section_range[0]&&h.number<=g.section_range[1]);
 if(matches.length!==1)throw new Error('Ambiguous or absent section mapping '+h.number);
 const g=matches[0];
 return {...h,end_line,text_lf_sha256:sha(lines.slice(h.start_line-1,end_line).join('\n')),source_id:review.source.source_id,group:g.id,
   task_id:'MAT-UPDATE-20260929-'+String(h.number).padStart(3,'0'),status:'OPEN',evidence_lane:g.evidence_lane,implementation_progress:review.section_progress?.[h.number]??null,
   candidate_owners:g.candidate_owners,acceptance:'Review every subrequirement in the preserved section, document applicable canonical owners, source/evidence/state semantics, implementation and tests or a justified remaining gap. Group-level matching or a successful batch is not section completion.'};
});
const bindings=read('data/research/mat-dashboard-bindings.json').bindings;
const inputs=['data/research/mat-update-review.json','data/research/mat-dashboard-bindings.json',...new Set(bindings.map(b=>b.path)),'records/0000-Origin-State/data/structured/0000-Origin-State.yaml','data/registries/sources.yaml','data/quality/panel-image-plan.json','records/0001-Hydrogen-H/relationships/0001-Hydrogen-H-Relationships.yaml',...(review.additional_intakes??[]).map(s=>s.path)];
const comparison=loadReadingComparison();
const material=loadMaterialExample();
const atom=loadNeutralHydrogen();
inputs.push(...Object.values(atomicSourcePaths),'scripts/mat-atomic.mjs','scripts/nist-ionisation.mjs');
inputs.push(materialOwnerPath,material.source.local_path,'data/schema/1.0.0/mat-universal-object.schema.json');
if(review.documentation_review)inputs.push(review.documentation_review);
if(review.continuation?.chat_reconciliation)inputs.push(review.continuation.chat_reconciliation.path);
const hydrogen=loadYaml(bindings[0].path),foundation=loadYaml('records/0000-Origin-State/data/structured/0000-Origin-State.yaml');
const report={version:'1.0.0',generated_by:'scripts/build-mat-update-intake.mjs',source:review.source,image:review.image,continuation:review.continuation??null,additional_intakes:review.additional_intakes??[],
  scope:'Complete section-level preservation and first mapping of this one update file. All scientific, subrequirement, external-research and full-system acceptance remains open.',
  summary:{numbered_sections:sections.length,source_lines:lines.length,mapping_groups:review.groups.length,image_panels:review.image.panels.length,image_issues:review.image.issues.length,accepted_scientific_image_values:0,standalone_panel_credit:0,bounded_readings:bindings.length,section_tasks_complete:0},
  preamble:{start_line:1,end_line:headings[0].start_line-1,text_lf_sha256:sha(lines.slice(0,headings[0].start_line-1).join('\n'))},sections,
  identity_checks:{foundation:{record_id:foundation.mat_id,record_class:foundation.record_class,chemical_element:foundation.identity.chemical_element,atomic_number:foundation.identity.atomic_number},hydrogen:{record_id:hydrogen.mat_id,name:hydrogen.record_name,symbol:hydrogen.symbol,atomic_number:hydrogen.atomic_number}},
  image_arithmetic_diagnostic:{source_id:review.image.source_id,panel:4,printed_frequency_hz:6.579e15,printed_period_s:1.519e-15,...checkFrequencyPeriod(6.579e15,1.519e-15)},
  reading_examples:comparison.readings,reading_relationships:comparison.relationships,comparison_policy:comparison.comparison_policy,historical_overlay_status:comparison.historical_overlay_status,material_examples:[material],atomic_examples:[atom],documentation_review:review.documentation_review??null,
  inputs:inputs.map(path=>{
    const bytes=fs.readFileSync(join(root,path));
    return path.endsWith('.pdf')?{path,sha256:sha(bytes)}:{path,sha256_lf:sha(bytes.toString('utf8').replace(/\r\n/g,'\n'))};
  })};
fs.writeFileSync(join(root,'data/quality/mat-update-intake.json'),JSON.stringify(report,null,2)+'\n');
const esc=s=>String(s).replace(/\|/g,'\\|');
const link=p=>`[${p}](../../${p})`;
const doc=[
 '# MAT master update — audit, reference review and first implementation',
 '## Additive universal-core continuation',
 'The subsequent [universal core stage 1](../02-data/12-Universal-Core-Stage-1.md) adds a shared owner/state contract and constrained composition arithmetic. The [3 October reconciliation](MAT-Knowledge-Integration-2026-10-03.md) preserves the additional 24-section knowledge handoff and 28-section universal coverage requirement, maps them to existing section tasks, and adds a fifth canonical experiment reading with a reader/API comparison. Partial progress and the exact current task are recorded in the existing machine-readable intake and MAT-TODO ledger. The sections below retain the earlier audit and its acceptance gaps; no section is automatically complete.',
 `The supplied 29 September update is preserved as ${review.source.source_id}: ${link(review.source.path)} (${review.source.bytes.toLocaleString('en-GB')} bytes; SHA-256 ${review.source.sha256}). All ${sections.length} numbered sections and the preamble have line locators and hashes in the [machine-readable intake](../../data/quality/mat-update-intake.json). This is a requirements catalogue, not a claim that those capabilities exist.`,
 `The supplied dashboard is ${review.image.source_id}: [unaltered reference image](../../${review.image.path}) (${review.image.bytes.toLocaleString('en-GB')} bytes; SHA-256 ${review.image.sha256}). It is a 16-panel layout reference with unaccepted scientific content. It receives zero credit toward the original 22 separate images per element. Existing assets and placeholders remain in place.`,
 '## A. Current architecture',
 'The canonical root remains the existing MAT repository. Primary chapter and structured records, source registries, relationship registries, visual/table/graph manifests and generated publication projections already exist. The full scientific scope remains foundation 0000, 118 recognised elements and separate proposed 119–188 entries. The current advanced audit reports no wholly accepted advanced element; candidate presence is not scientific completeness.',
 '## B. Schema and record flow',
 'The universal state schema already covers identity, nuclear/quantum/electronic, electromagnetic/spectral, chemical/structural/thermal/mechanical, pressure/environment/process/geometry/time/scale layers. The audit tracks 652 requirements per canonical record. The shared measurement schema accepts optional fields; it does not enforce a complete state/condition/source envelope for every legacy number. This continuation adds a bounded reading projection and leaves the locked parent schema and numeric owners unchanged. New proposed class names need a reviewed migration/crosswalk before they can enter canonical IDs.',
 '## C. Foundation 0000',
 `${link('records/0000-Origin-State/data/structured/0000-Origin-State.yaml')} already identifies FOUNDATION_REFERENCE, chemical_element=false and atomic_number=NOT-APPLICABLE. It has fifteen reference channels and distinguishes zero, missing, reference origin and author-framework mappings. These definitions do not establish literal nothingness or a universal vacuum. Existing figure geometry and all reference interpretations still require their recorded review.`,
 '## D. Hydrogen 0001',
 `${link(bindings[0].path)} remains Hydrogen, H, atomic number 1. Atomic H, charge states, isotopes, molecular H2 and ortho/para branches are distinguished. Existing ionisation, nuclear, Balmer, water-geometry, source and panel supplements remain canonical. The new poster must not rename the record or replace its numerical data. Hydrogen is the first acceptance example, but its entire target is not complete.`,
 '## E. Existing capabilities and the new bounded reader',
 'The existing claim registry and epistemic graph support deterministic records and explicit edges without automatic truth promotion. Source accession, IDs, links, element coverage, calculated thermochemistry, ionisation and mass/reaction tables have dedicated checks. The new read-only adapter resolves four Hydrogen bindings from the original structured file. It carries the owner\'s evidence classification, returns missing uncertainty as null/UNKNOWN, distinguishes atomic H from equilibrium-H2, and refuses changed sources, units, species or owners. These are candidate readings awaiting the detailed source/state review indicated below.',
 '| Binding | Object | Current value | Unit | Evidence retained | Uncertainty |\n|---|---|---:|---|---|---|\n'+report.reading_examples.map(r=>`| ${r.binding_id} | ${r.object_ref} | ${r.value} | ${r.unit} | ${r.evidence_type} | ${r.uncertainty??'UNKNOWN'} |`).join('\n'),
 '## Neutral atomic Hydrogen — explicit universal bridge',
 'The [universal-core guide](../02-data/12-Universal-Core-Stage-1.md) and [atomic adapter](../../scripts/mat-atomic.mjs) expose the existing neutral child through `/atoms` and `--atoms`. General projections keep empty readings; the five examples above retain their previous payload. The single source-bound reading below is a projection of the same canonical value, not another measurement or numerical owner.',
 `| Object | Metric | Value / eV | Source-displayed uncertainty / eV | Evidence |\n|---|---|---:|---:|---|\n| ${atom.object.object_ref} | ${atom.object.readings[0].metric} | ${atom.object.readings[0].value} | ${atom.object.readings[0].uncertainty} | ${atom.object.readings[0].evidence_type} |`,
 `Owner: ${link(atom.object.owner.path)}, pointer \`${atom.object.owner.pointer}\`; existing binding: ${link('data/research/mat-dashboard-bindings.json')}, pointer \`/bindings/0\`. Source SRC-000005: [NIST ASD original query](<${atom.source.query_url}>), [DOI](https://doi.org/${atom.source.doi}), [official definitions](<${atom.source.help_url}>), ${link(atomicSourcePaths.csv)} physical row 2, ${link(atomicSourcePaths.provenance)} and ${link(atomicSourcePaths.help)}. Version ${atom.source.version}; retrieved ${atom.source.retrieved}. Raw parentheses and bibliography key HDEL remain attached in the structured projection.`,
 'The reading references the existing `/electronic_ground_state` owner locator; the full object state remains UNRESOLVED with no state identity allocated. Isotope, temperature, pressure, source confidence level and coverage factor remain UNKNOWN. Owner label A is a legacy project qualifier. Retained eV uncertainty includes conversion-factor uncertainty. Underlying-work/claim acceptance, source-specific reuse rights and independent physical review remain pending. This bridge gives no whole element, domain or standalone-panel completion credit.',
 'The hyperfine example also computes period = 1/frequency for that named transition. Its uncertainty stays UNKNOWN because the owner does not supply one. Normalised vectors, embeddings, universal element frequencies, body-frequency diagnostics and physical predictions are not implemented by this adapter. The JSON is a generated projection; editing it does not change the owner.',
 'Reproduce with `node scripts/build-mat-update-intake.mjs`. List readings with `node scripts/read-mat-metric.mjs`, or inspect one with `node scripts/read-mat-metric.mjs hydrogen-first-ionisation`. Validate with `node scripts/validate-mat-update.mjs`. Schema: [bounded reading projection](../../data/schema/1.0.0/mat-reading-projection.schema.json).',
 '## F. Missing capability groups',
 '| Group | Sections | Existing candidate owners | Remaining gap |\n|---|---|---|---|\n'+review.groups.map(g=>`| ${g.title} | ${g.section_range.join('–')} | ${g.candidate_owners.map(link).join('; ')} | ${esc(g.gap)} |`).join('\n'),
 'Owner paths identify useful existing material, not proof of complete implementation. In particular, whole composition/process engines, autonomous laboratory loops, general inverse design, validated medical prediction, normalised reading vectors and complete cultural/history datasets remain pending.',
 '## G. Reference-image conflicts',
 '| Issue | Panels | Observed reference content | Required disposition |\n|---|---|---|---|\n'+review.image.issues.map(i=>`| ${i.id} | ${i.panels.join(', ')} | ${esc(i.observation)} | ${esc(i.disposition)} |`).join('\n'),
 `Arithmetic diagnostic only: the printed f = 6.579 × 10^15 Hz and T = 1.519 × 10^-15 s give fT = ${report.image_arithmetic_diagnostic.product}. The reciprocal of the printed frequency is ${report.image_arithmetic_diagnostic.expected_period_s.toPrecision(7)} s. This diagnoses internal inconsistency; it does not validate the image's orbit/vibration interpretation or create a new physical value.`,
 '## H. Migration and interpretation risks',
 'Keep artistic layout, user proposals, historical/cultural assertions, source-reported values and independently reviewed scientific measurements distinct. Preserve all original authored Causali-E expressions in the source; do not reinterpret them as standard arithmetic identities. Keep named traditions and translations source-specific. A recorded Rife/Russell or other claim, a patent, a similar number, a diagram or a source hash is not evidence that a physical or clinical effect is established. The image remains accessible for comparison with these qualifications. No archived/source file was deleted, renamed or overwritten; the two original user files remain outside the repository unchanged.',
 '## I. Staged next work and acceptance examples',
 '| Example | Requirement section | Current acceptance | Next concrete step |\n|---|---:|---|---|\n'+review.acceptance_examples.map(e=>`| ${e.id} | ${e.section} | ${e.status} | ${esc(e.next)} |`).join('\n'),
 'Continue source-bound element enrichment at Copper (0029), while resolving Scandium and Iron review gaps. Extend the bounded reader only after named state, unit, source and uncertainty semantics are checked. Complete Hydrogen\'s acceptance target, then one documented steel state, one Nd-Fe-B magnet state, one historical sample and one biomimetic mechanism. Reuse existing owners and require reproducible tests before any broader class/schema migration. Continue scientific tables and calculated charts now; defer generated illustration completion until the data-first review.',
 '## J. Requirement tracking and first change',
 'Every section below has a durable MAT-UPDATE task in the central TODO ledger, and all remain OPEN. Section-level preservation is complete for this supplied file; line-by-line scientific validation and implementation are not. The first code change is the four-reading adapter and its guards, plus source/section/image integrity validation. It creates no new element, no alternate periodic table, no accepted scientific image value and no automatic claim promotion.',
 '| Section | Source lines | Group | Requirement |\n|---:|---|---|---|\n'+sections.map(s=>`| ${s.number} | ${s.start_line}–${s.end_line} | ${s.group} | ${esc(s.title)} |`).join('\n')
];
fs.writeFileSync(join(root,'docs/09-production/MAT-Master-Update-Review.md'),doc.join('\n\n')+'\n');
console.log(JSON.stringify(report.summary));

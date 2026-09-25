# Advanced MAT enrichment — exact resume checkpoint

Updated: 25 September 2026. Overall request remains **PARTIAL**. This checkpoint supersedes the earlier September checkpoints, which remain recoverable in Git. No element is certified fully advanced.

## Canonical repository and continuity

Canonical master: `C:/Users/jpowe/Desktop/Projects/Materials-Atlas-Table-Codex---MAT`. The earlier direct Desktop path is absent. The existing repository was relocated; do not recreate the old path or initialise another Git repository.

Branch: `main`. Remote: `https://github.com/jayprophit/Materials-Atlas-Table-Codex---MAT.git`. On resuming this batch, HEAD was `d42b67b2ad23328b0a2ffff6dac5d61e74884ebf`, the worktree was clean, and fetched origin/main was `6ef96759074183f6bdfa9d5a7102e79f315fdeb9` (one local commit ahead). Preserve the intervening query-service, claim-registry and recovery work. One Git worktree was listed at the new master path.

The AME data and two new panels were already preserved in commit `742c6fae5586980dac65df60ca2d9059d8339423` and the subsequent restoration history. This continuation verifies their source fidelity, publishes them, updates coverage, and preserves later work. Delivery hashes and push outcome are recorded after the batch commit below.

## Scientific and visual scope now present

- 119 record packages: foundation 0000 and chemical elements 0001–0118. No later canonical element record was found. All 118 elements remain partially advanced.
- NUBASE2020: 5,842 evaluated states, with the existing qualifier-aware decay calculations and explicit ground/isomer identities retained.
- NIST ASD extraction: 6,019 rows for Z=1–110, 5,847 numeric energies and 172 UNKNOWN energies. Z=111–118 have INSUFFICIENT DATA in that extraction. Existing 11,694 SI energy-equivalent calculations are not observed spectral lines.
- AME2020: 3,557 chemical-element ground-state nuclides and six selected evaluated quantities. Counts: mass excess 3,557; binding energy per nucleon 3,557; beta-minus Q 3,262; two-neutron separation energy 3,321; two-proton separation energy 3,203; alpha Q 3,414. Total 20,314 numeric quantities plus 1,028 explicit missing quantities.
- AME source accessions `SRC-000303` and `SRC-000304` identify the methods/evaluation papers. The original mass and reaction tables, raw lines, source locators, hashes, units, source uncertainties and # estimate markers are retained. Published uncertainties are transcribed directly; independent-mass quadrature was not substituted. Signed Q, null, and genuine zero remain distinct. Positive Q is not an observed decay branch.
- Each element has its own AME YAML registry, companion chapter and binding-energy SVG. There are 118 AME charts and 236 corresponding Markdown tables, in addition to the 110 ionisation charts. The AME extraction is a dated 2020 evaluation, not a claim of latest 2026 research.
- Five reviewed standalone Hydrogen illustrations: A01, A02, A03, A04 and B09. A03 is H₂ bonding; A04 contains the three isotope diagrams as one isotope-section image. Exact prompts, source context, file hashes and visual-review notes are in `data/quality/panel-image-reviews.json`. Built-in image generation used the supplied posters as the primary references. Quantitative charts do not count as these illustrations.
- The required total remains 2,596 separate images: 118 × (9 light panels + 13 dark panels). 2,591 images remain open. The next light Hydrogen slot is A05; dark B01–B08 and B10–B13 remain open. Preserve the locked V01–V18 architecture and the additive panel crosswalk.
- The state-flow audit retains 652 existing universal-schema list items across the records. Conventional, evaluated, calculated, model-dependent, historical and author-proposed evidence remain distinct. No speculative framework was promoted into established science.

## Completion, gaps and work list

Use `data/quality/advanced-completion-matrix.json`, `data/quality/state-flow/index.json`, `data/quality/unified-gap-analysis.json`, `data/quality/MAT-TODO.json` and `docs/09-production/Advanced-Completion-TODO.md`.

The work-item inventory now has 6,862 unique entries: 4,248 element-domain reviews, nine foundation reviews, 2,596 individual panel slots and nine programme objectives. Five panel tasks are complete and 6,857 work items are open. These are review/task counts, not a scientific-completion percentage.

AME coverage and chart status are now explicit per element in the unified gap report. Domain acceptance still requires claim-level support and state/condition review. Nuclear data does not fill missing materials, biological or engineering domains. All 56 supplied reference documents remain in the intake review queue; candidate Neon/Aluminium additions require comparison with current canonical values and original bibliography.

## Native conversation export recovered

The previously awaited snapshot is available as `C:/Users/jpowe/Downloads/chat.html`. Its title is ChatGPT Data Export. It was parsed as literal JSON; its HTML and scripts were never executed. Do not submit another export request merely to recover this already available file.

Private catalogue: `.mat-local/chatgpt-export-2026-09-25/`. Read `catalogue.json`, `verification.json` and `REVIEW-NEXT.md`. The source copy and all 352 saved conversation objects were hash-verified. Coverage: 34,981 mapping nodes, 34,629 messages (11,926 user-role and 22,703 assistant-role), 4,161 messages outside the selected current branches, 158 conversations with branching and zero detected structural issues. All 58 earlier catalogued conversation identities occur in this snapshot.

The latest conversation update in the snapshot is 16 September 2026. It is not proof of current-account, deleted-message, tool-trace, project-source or binary-attachment completeness. There are 3,753 detected attachment references; no binaries were retrieved by this native-HTML intake. Earlier private connector attachments and the 140-name Suggested-library catalogue still need identity/hash reconciliation.

`messages.ndjson` is a role-separated text index; original conversation JSON retains non-text parts and metadata. `project-candidates.json` indexes overlapping keyword matches for MAT, Genesis, Poietek, Athena, MMORPG, ebook, Agent-Bridge and Universal-Bridge. A mention is not verified project membership or an accepted requirement. Raw content stays private and must not enter Git or publication output.

Earlier pages and cursors remain under `.mat-local/chatgpt-intake-2026-09-15/`. Synced ChatGPT project sources remain read-only; the local Genesis sources directory was empty when rechecked. Desktop peer identity/status was refreshed read-only in `.mat-local/peer-repositories-2026-09-25.json`; Genesis and Poietek had local changes. No peer repository was edited or merged.

## Archive consolidation

No archive files were imported or deleted in this continuation. Earlier verified consolidation is recorded in `data/quality/archive-removal-receipt.json`: 15,624 recoverable duplicates removed after the recovery materials were committed and pushed as `cad3533`. Fifteen unique files and excluded private material remain in the ignored integration source area. It is not another master repository. Do not rerun the pre-removal audit and interpret expected absences as loss, or delete the private residual material to make the directory disappear.

## Verification on 25 September

- All 15 integrity suites passed, covering sources, schema, identifiers, links, relationships, element coverage, source-bound AME/NIST data, figures, completion/state-flow freshness and publication synchronisation.
- Core tests: 78 passed, including three new private-export parser tests.
- Studio unit tests: five passed. Its missing local dependencies were restored from the existing lockfile.
- Studio end-to-end checks: six passed, including exact-byte AME/NIST source delivery, five reviewed panels and representative scientific charts.
- Reader checks: six passed across Chromium, Firefox and WebKit. The earlier Firefox timeout did not recur. This is automated regression evidence, not complete accessibility certification.
- Production build passed: 753 chapters and 118 selectable elements, with no unresolved source IDs in the publication projection.
- Final benchmark: all 16 checks passed (15 integrity suites plus the core tests); 270 local-search samples had p95 16.18 ms against a 100 ms budget. See `data/quality/benchmark.json`. This measures local search only, not browser/mobile or real-user performance.
- Native intake: 352 original objects and the retained input hash re-read and verified; all saved messages accounted for. Keyword/project and scientific content review remain pending.
- `git diff --check` passed before staging.
- The Studio dependency audit reported two moderate development-dependency findings for Vitest and its mocker (GHSA-82fw-gwwq-j7x9). The major-version fix is tracked as `MAT-PROGRAMME-DEPENDENCIES`; no forced dependency upgrade was made.

Logs are private under `.mat-local/*2026-09-25*` and `.mat-local/benchmark/`. Build/test status does not complete the scientific programme.

## Exact next steps

1. Recheck current HEAD, Git status, remote and this file at the relocated master path. Preserve later work and local changes; never restore an old master over current content.
2. Start with Hydrogen A05: verify the actual Balmer line data, spectral medium, emitting state and source precision, then create its separate light-style illustration. Continue both 9+13 image sets, one individually reviewed panel per placeholder.
3. Continue the remaining Hydrogen domain gaps using the existing 0000/0001 flow and mature records. Reconcile the supplied Neon/Aluminium blocks and bibliography before promotion. Do not duplicate the completed nuclear/ionisation/AME packages.
4. Extend AME only where supported: other reaction columns, state-specific/isomer corrections and branch evidence. Follow with isotope-specific NMR, actual spectroscopy, state-specific lattice/phases/material properties, anisotropy/deformation/defects, surfaces/corrosion, alloys/process history, extreme conditions, quantum behaviour, electrochemistry, geochemistry, biological/toxicological evidence, production/recycling, relationships, lineage and experiments.
5. Review the private native catalogue and attachment queue using `REVIEW-NEXT.md`. Compare owner requests with current owning repositories and keep assistant/conversation claims as reference inputs until independently supported.
6. After scientific record edits, rebuild state-flow, advanced-completion, coverage, panel plan (if assets changed), unified gaps and the publication. Run the relevant validators/tests; keep UNKNOWN, NOT APPLICABLE and INSUFFICIENT DATA distinct.
7. Resolve the development-dependency advisory in a separate tested change, and complete manual accessibility/print/visual-rights and scientific review.
8. Commit coherent batches and push normally. No force-push, second checkout, nested Git repository, fabricated metric or broad completion claim.

## Delivery record

Implementation/publication commit: `5cd78c56905e2f66133be4334676b03cfb97d117` — Publish verified AME2020 coverage and catalogue native project references. It contains 389 changed files and was successfully pushed to origin/main on 25 September. The push also preserved and delivered the pre-existing local `d42b67b` claim-registry commit; no force-push was used.

This checkpoint and the dated batch receipt receive a following metadata commit recording that successful delivery. Resolve current HEAD normally before further work. Raw native-export contents and peer-repository inventories remain private, ignored and uncommitted. `check-book-sync` and clean local/remote alignment were verified after the implementation push.

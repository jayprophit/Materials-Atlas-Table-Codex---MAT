// Full MAT integrity suite. Run: npm run validate
import { spawnSync } from "node:child_process";

const suites = [
  "scripts/validate-elements.mjs",
  "scripts/validate-ionisation.mjs",
  "scripts/validate-ionisation-charts.mjs",
  "scripts/validate-ame2020.mjs",
  "scripts/validate-hydrogen-balmer.mjs",
  "scripts/validate-water-geometry.mjs",
  "scripts/validate-thermochemistry.mjs",
  "scripts/validate-chart-projection.mjs",
  ["scripts/build-material-visuals.mjs", "--check"],
  "scripts/validate-mat-update.mjs",
  "scripts/validate-chat-reconciliation.mjs",
  ["scripts/frequency-comparison.mjs", "--check"],
  "scripts/validate-universal-core.mjs",
  ["scripts/build-glossary.mjs", "--check"],
  ["scripts/build-source-navigation.mjs", "--check"],
  "scripts/validate-proposed-elements.mjs",
  "scripts/validate-advanced-completion.mjs",
  "scripts/validate-unified-gap-analysis.mjs",
  "scripts/validate-state-flow.mjs",
  "scripts/validate-records.mjs",
  "scripts/validate-sources.mjs",
  "scripts/validate-relationships.mjs",
  "scripts/validate-assets.mjs",
  "scripts/validate-panel-images.mjs",
  "scripts/check-links.mjs",
  "scripts/check-identifiers.mjs",
  "scripts/check-book-sync.mjs",
];
let failed = 0;
for (const suite of suites) {
  const [s,...args] = Array.isArray(suite) ? suite : [suite];
  console.log(`\n===== ${s} =====`);
  const r = spawnSync(process.execPath, [s,...args], { stdio: "inherit" });
  if (r.status !== 0) failed++;
}
console.log(failed ? `\nVALIDATE: ${failed} suite(s) failing` : "\nVALIDATE: all suites pass");
process.exitCode = failed ? 1 : 0;

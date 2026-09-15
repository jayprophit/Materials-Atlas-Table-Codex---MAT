// Check the 22-panel inventory against reviewed files without changing outputs.
process.argv.push('--check');
await import('./build-panel-image-plan.mjs');

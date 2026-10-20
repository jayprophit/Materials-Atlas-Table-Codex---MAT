import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// Static reference downloads linked by the production note, never executed by Studio.
// Keep this explicit: publishing an entire tooling directory would include unrelated files.
export const temperatureReferenceCodePaths = Object.freeze([
  'scripts/extract-nist-thermochemistry.py',
  'scripts/thermochemistry-publisher-temperature.mjs',
  'scripts/sync-thermochemistry.mjs',
  'scripts/validate-thermochemistry.mjs',
  'scripts/tests/thermochemistry-temperature-evidence.test.mjs',
  'scripts/tests/thermochemistry-curated.test.mjs',
  'scripts/tests/test_extract_nist_thermochemistry.py',
]);

export function copyTemperatureReferenceCode(repositoryRoot, publicDirectory) {
  const root = fs.realpathSync(repositoryRoot);
  const destination = path.resolve(publicDirectory);
  assert(destination.startsWith(root + path.sep), 'Public reference directory must be inside the repository');
  function checkPath(target, file) {
    assert(target.startsWith(root + path.sep), 'Reference target escapes the repository');
    const parts = path.relative(root, target).split(path.sep);
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      current = path.join(current, parts[i]);
      if (!fs.existsSync(current)) {
        // lstat also detects a dangling symbolic link that existsSync treats as absent.
        try { fs.lstatSync(current); throw new Error('Unavailable reference target: ' + current); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
        continue;
      }
      const info = fs.lstatSync(current);
      assert(!info.isSymbolicLink(), 'Symbolic reference paths are not supported: ' + current);
      assert(i === parts.length - 1 && file ? info.isFile() : info.isDirectory(), 'Unexpected reference path type: ' + current);
    }
  }
  checkPath(destination, false);
  const plan = temperatureReferenceCodePaths.map(relative => {
    const source = path.resolve(root, relative);
    const target = path.resolve(destination, relative);
    assert(target.startsWith(destination + path.sep), 'Reference target escapes public directory');
    checkPath(source, true);
    checkPath(target, true);
    return {relative, target, bytes: fs.readFileSync(source)};
  });
  // Missing or unsupported sources/targets fail before any output is created.
  for (const item of plan) {
    fs.mkdirSync(path.dirname(item.target), {recursive: true});
    fs.writeFileSync(item.target, item.bytes);
  }
  return plan.map(item => item.relative);
}

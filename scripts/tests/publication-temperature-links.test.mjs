import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {temperatureReferenceCodePaths, copyTemperatureReferenceCode} from '../publication-reference-code.mjs';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const notePath = 'docs/09-production/Temperature-Interpretation-2026-10-12.md';
const note = fs.readFileSync(path.join(repositoryRoot, notePath), 'utf8');
// Derive the contract from the actual published note, not a mirrored list of
// implementation filenames. Other documentation, data and external URLs remain
// outside this narrowly reviewed code-copy slice.
const codeLinks = [...note.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].flatMap(match => {
  const destination = new URL(match[1], 'https://mat.invalid/' + notePath);
  if (destination.origin !== 'https://mat.invalid' || !destination.pathname.startsWith('/scripts/')) return [];
  return [decodeURIComponent(destination.pathname.slice(1))];
});

function assertWithin(base, target) {
  const relative = path.relative(path.resolve(base), path.resolve(target));
  assert(relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), 'Temporary fixture target escaped its owned directory');
}

function fixture(t) {
  const temporaryBase = fs.realpathSync(os.tmpdir());
  const base = fs.mkdtempSync(path.join(temporaryBase, 'mat-temperature-links-test-'));
  const root = path.join(base, 'repository');
  const publicDir = path.join(root, 'studio', 'public');
  fs.mkdirSync(root);
  for (const relative of codeLinks) {
    const file = path.join(root, relative);
    assertWithin(base, file);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, fs.readFileSync(path.join(repositoryRoot, relative)));
  }
  t.after(() => {
    // Verify the resolved, explicitly created temporary target before recursive
    // removal. Never follow a fixture junction into another target for cleanup.
    assert.equal(path.dirname(path.resolve(base)), temporaryBase);
    assert(path.basename(base).startsWith('mat-temperature-links-test-'));
    assert.equal(fs.lstatSync(base).isSymbolicLink(), false);
    fs.rmSync(base, {recursive: true, force: true});
  });
  return {base, root, publicDir};
}

function linkedDirectory(t, target, link) {
  try {
    fs.symlinkSync(target, link, 'junction');
    return true;
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      t.skip('This environment cannot create a private directory junction: ' + error.code);
      return false;
    }
    throw error;
  }
}

test('actual temperature-note links copy exact referenced bytes into a standalone public root only', t => {
  assert.equal(codeLinks.length, 7, 'The approved note has seven code/test destinations');
  assert.equal(new Set(codeLinks).size, codeLinks.length);
  assert.deepEqual(new Set(temperatureReferenceCodePaths), new Set(codeLinks));
  const {root, publicDir} = fixture(t);
  const unlinked = path.join(root, 'scripts', 'unlinked-fixture-script.mjs');
  fs.writeFileSync(unlinked, '// Synthetic fixture: not a linked public reference.\n');
  const original = new Map(codeLinks.map(relative => [relative, fs.readFileSync(path.join(root, relative))]));
  const copied = copyTemperatureReferenceCode(root, publicDir);
  assert.deepEqual(new Set(copied), new Set(codeLinks));
  for (const relative of codeLinks) {
    assert.deepEqual(fs.readFileSync(path.join(publicDir, relative)), original.get(relative), relative);
    assert.deepEqual(fs.readFileSync(path.join(root, relative)), original.get(relative), 'Source changed: ' + relative);
  }
  assert.equal(fs.existsSync(path.join(publicDir, 'scripts', path.basename(unlinked))), false);
});

test('a missing referenced source is refused before any partial public copy', t => {
  const {base, root, publicDir} = fixture(t);
  const missing = path.join(root, codeLinks.at(-1));
  assertWithin(base, missing);
  fs.unlinkSync(missing);
  assert.throws(() => copyTemperatureReferenceCode(root, publicDir));
  assert.equal(fs.existsSync(publicDir), false, 'Preflight must complete before output directories or files');
});

test('a directory in place of a referenced source is refused before any copy', t => {
  const {base, root, publicDir} = fixture(t);
  const file = path.join(root, codeLinks.at(-1));
  assertWithin(base, file);
  fs.unlinkSync(file);
  fs.mkdirSync(file);
  assert.throws(() => copyTemperatureReferenceCode(root, publicDir));
  assert.equal(fs.existsSync(publicDir), false);
});

test('public targets outside the repository or equal to the repository cannot receive copies', t => {
  const {base, root} = fixture(t);
  const outside = path.join(base, 'outside-public');
  assertWithin(base, outside);
  assert.throws(() => copyTemperatureReferenceCode(root, outside));
  assert.equal(fs.existsSync(outside), false);
  const before = codeLinks.map(relative => fs.readFileSync(path.join(root, relative)));
  assert.throws(() => copyTemperatureReferenceCode(root, root));
  for (const [i, relative] of codeLinks.entries()) assert.deepEqual(fs.readFileSync(path.join(root, relative)), before[i]);
});

test('a junction in the source parent cannot redirect linked-code reads', t => {
  const {base, root, publicDir} = fixture(t);
  const source = path.join(root, 'scripts');
  const displaced = path.join(base, 'outside-source-scripts');
  assertWithin(base, source);
  assertWithin(base, displaced);
  fs.renameSync(source, displaced);
  if (!linkedDirectory(t, displaced, source)) return;
  assert.throws(() => copyTemperatureReferenceCode(root, publicDir));
  assert.equal(fs.existsSync(publicDir), false);
});

test('a junction in a public destination parent cannot redirect code-copy writes', t => {
  const {base, root, publicDir} = fixture(t);
  const outside = path.join(base, 'outside-destination');
  assertWithin(base, outside);
  fs.mkdirSync(outside);
  fs.mkdirSync(publicDir, {recursive: true});
  if (!linkedDirectory(t, outside, path.join(publicDir, 'scripts'))) return;
  assert.throws(() => copyTemperatureReferenceCode(root, publicDir));
  assert.deepEqual(fs.readdirSync(outside), [], 'Nothing may be written through the destination junction');
});

test('a dangling junction at a linked destination is refused before writing the other references', t => {
  const {base, root, publicDir} = fixture(t);
  const destination = path.join(publicDir, codeLinks.at(-1));
  const missingTarget = path.join(base, 'never-created-destination');
  assertWithin(base, destination);
  assertWithin(base, missingTarget);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  if (!linkedDirectory(t, missingTarget, destination)) return;
  assert.equal(fs.existsSync(destination), false, 'Fixture should be dangling');
  assert.throws(() => copyTemperatureReferenceCode(root, publicDir));
  for (const relative of codeLinks.slice(0, -1)) assert.equal(fs.existsSync(path.join(publicDir, relative)), false, relative);
  assert.equal(fs.existsSync(missingTarget), false);
});

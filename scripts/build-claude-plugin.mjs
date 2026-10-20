#!/usr/bin/env node
// The directory bundle contains the same skills as npm, without its installer.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'plugins/ravensight');
const check = process.argv.includes('--check');
function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    assert.ok(!entry.isSymbolicLink(), 'Plugin files must not be symlinks');
    const path = prefix + entry.name;
    return entry.isDirectory() ? files(join(directory, entry.name), path + '/') : [path];
  });
}
const manifest = JSON.parse(readFileSync(join(root, '.claude-plugin/plugin.json')));
Object.assign(manifest, {
  displayName: 'Ravensight',
  icon: './assets/icon.png',
  keywords: ['game-development', 'analytics', 'godot', 'unity', 'studio'],
  privacyPolicyUrl: 'https://ravensight.io/privacy/',
  supportUrl: 'https://ravensight.io/docs/',
  documentationUrl: 'https://ravensight.io/docs/',
  termsOfServiceUrl: 'https://ravensight.io/terms/'
});
const expected = new Map([
  ['.claude-plugin/plugin.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n')],
  ['.mcp.json', readFileSync(join(root, '.mcp.json'))],
  ['LICENSE', readFileSync(join(root, 'LICENSE'))],
  ['README.md', readFileSync(join(root, 'docs/CLAUDE_DIRECTORY_README.md'))],
  ['assets/icon.png', readFileSync(join(root, 'docs/assets/ravensight-icon.png'))]
]);
for (const path of files(join(root, 'skills'))) {
  assert.match(path, /^ravensight(?:-setup|-connect|-studio|-instrumentation)?\/(SKILL\.md|references\/[^/]+\.md|agents\/openai\.yaml)$/);
  expected.set('skills/' + path, readFileSync(join(root, 'skills', path)));
}
if (check) {
  assert.deepEqual(files(target).sort(), [...expected.keys()].sort(), 'Unexpected or missing directory bundle file');
  for (const [path, data] of expected) assert.deepEqual(readFileSync(join(target, path)), data, `Stale directory file: ${path}`);
} else {
  for (const [path, data] of expected) {
    mkdirSync(dirname(join(target, path)), { recursive: true });
    writeFileSync(join(target, path), data);
  }
}
console.log(`Claude directory bundle ${check ? 'verified' : 'built'}: ${expected.size} public files`);

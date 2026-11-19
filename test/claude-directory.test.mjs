import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('Claude directory bundle matches public sources and excludes installer/runtime files', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/build-claude-plugin.mjs', import.meta.url)), '--check']);
  const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)));
  assert.equal(read('.claude-plugin/marketplace.json').plugins[0].source, './plugins/ravensight');
  const manifest = read('plugins/ravensight/.claude-plugin/plugin.json');
  assert.equal(manifest.version, read('package.json').version);
  for (const key of ['privacyPolicyUrl', 'termsOfServiceUrl', 'documentationUrl', 'supportUrl']) {
    assert.equal(new URL(manifest[key]).origin, 'https://ravensight.io');
  }
  const png = readFileSync(new URL('../plugins/ravensight/assets/icon.png', import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 512);
  assert.ok(png.length < 2 * 1024 * 1024);
});

test('directory README names the docs connector privacy and the optional account API', () => {
  const readme = readFileSync(new URL('../plugins/ravensight/README.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  assert.match(readme, /receives the search text Claude sends/);
  assert.match(readme, /does not store queries/);
  assert.match(readme, /service logs are kept for 14 days/);
  assert.match(readme, /https:\/\/api\.ravensight\.io\/mcp/);
  assert.match(readme, /reading studio records/);
  assert.match(readme, /sending a teammate an invite email/);
  assert.doesNotMatch(readme, /[\u2013\u2014]/, 'no en or em dashes');
});

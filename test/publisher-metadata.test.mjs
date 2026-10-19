import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => JSON.parse(readFileSync(new URL('../' + file, import.meta.url), 'utf8'));

test('publisher metadata satisfies documented length, capabilities and HTTPS contact requirements', () => {
  const ui = read('plugin.json').extensions['com.openai'].interface;
  assert.ok(ui.shortDescription.length > 0 && ui.shortDescription.length <= 30);
  assert.ok(typeof ui.longDescription === 'string' && ui.longDescription.length > 0 && ui.longDescription.length <= 4000);
  assert.ok(ui.displayName.length > 0 && ui.displayName.length <= 30);
  assert.ok(Array.isArray(ui.capabilities) && ui.capabilities.length <= 20);
  assert.ok(ui.capabilities.every(v => typeof v === 'string' && v.length > 0 && v.length <= 120));
  for (const field of ['supportURL', 'websiteURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    const url = new URL(ui[field]);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.username, '');
    assert.equal(url.password, '');
  }
  assert.equal(ui.supportURL, 'https://ravensight.io/docs/');
});

test('publisher metadata changes do not add account auth or Playtesting to the bundled docs MCP', () => {
  const servers = read('mcp.json').mcpServers;
  assert.deepEqual(Object.keys(servers), ['ravensight-docs']);
  assert.equal(servers['ravensight-docs'].extensions['com.openai'].auth.type, 'none');
  assert.equal(servers['ravensight-docs'].url, 'https://docs-mcp.ravensight.io/mcp');
  assert.ok(!JSON.stringify(servers).includes('clientSecret'));
});

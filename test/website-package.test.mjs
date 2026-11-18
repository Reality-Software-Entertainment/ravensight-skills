import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'))).version;
const names = ['ravensight', 'ravensight-setup', 'ravensight-connect', 'ravensight-studio', 'ravensight-instrumentation'];

test('published-format tarball installs the same complete website workflow for Codex and Claude offline', t => {
  const scratch = mkdtempSync(join(tmpdir(), 'rs-website-package-'));
  t.after(() => rmSync(scratch, { recursive: true, force: true }));
  execFileSync('tar', ['-xzf', join(root, 'dist', `ravensight-skills-${version}.tgz`), '-C', scratch]);
  const packed = join(scratch, 'package');
  for (const [agent, folder] of [['codex', '.agents/skills'], ['claude', '.claude/skills']]) {
    const project = join(scratch, agent); mkdirSync(project);
    const result = spawnSync(process.execPath, [join(packed, 'bin/install.mjs'), '--agent', agent, '--project', project, '--skill', 'all'], { encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 0, result.stderr);
    const installed = join(project, folder);
    assert.deepEqual(readdirSync(installed).sort(), names.toSorted());
    for (const name of names) assert.equal(readFileSync(join(installed, name, 'SKILL.md'), 'utf8'), readFileSync(join(root, 'skills', name, 'SKILL.md'), 'utf8'));
    const relative = 'ravensight-instrumentation/references/websites.md';
    assert.equal(readFileSync(join(installed, relative), 'utf8'), readFileSync(join(root, 'skills', relative), 'utf8'));
    // Installing guidance must not create account configuration or credentials.
    assert.equal(existsSync(join(project, '.mcp.json')), false);
    assert.equal(existsSync(join(project, '.env')), false);
  }
});

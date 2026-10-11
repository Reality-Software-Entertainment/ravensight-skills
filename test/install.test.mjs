import { test } from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'skills/ravensight-instrumentation');
const cli = join(root, 'bin/install.mjs');
function workspace(t) {
  const path = mkdtempSync(join(tmpdir(), 'ravensight-skill-test-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}
function run(script, args) { return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' }); }

for (const [agent, folder] of Object.entries({ codex: '.agents/skills', claude: '.claude/skills', copilot: '.github/skills', generic: 'skills' })) {
  test(`installs a complete ${agent} skill and preserves repeated installs`, t => {
    const project = workspace(t);
    const args = ['--agent', agent, '--project', project];
    assert.equal(run(cli, [...args, '--dry-run']).status, 0);
    assert.deepEqual(readdirSync(project), []);
    const result = run(cli, args);
    assert.equal(result.status, 0, result.stderr);
    const installed = join(project, folder, 'ravensight-instrumentation');
    assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), readFileSync(join(source, 'SKILL.md'), 'utf8'));
    // Every relative reference in the entrypoint must travel with the pack.
    const links = [...readFileSync(join(installed, 'SKILL.md'), 'utf8').matchAll(/\]\((references\/[^)]+)\)/g)];
    assert.ok(links.length >= 1);
    for (const [, link] of links) assert.ok(readFileSync(join(installed, link)).length > 0);
    assert.ok(existsSync(join(installed, 'agents/openai.yaml')));
    assert.match(run(cli, args).stdout, /Already installed/);
    writeFileSync(join(installed, 'SKILL.md'), 'customer changes');
    assert.equal(run(cli, args).status, 1);
    assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  });
}

test('invalid arguments do not write to a project', t => {
  const project = workspace(t);
  for (const args of [[], ['--agent', 'all'], ['--agent', 'codex', '--agent', 'claude'], ['--agent', 'constructor'], ['--agent', 'codex', '--unknown'], ['--agent']]) {
    const result = run(cli, [...args, '--project', project]);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.deepEqual(readdirSync(project), []);
  }
});

test('refuses symlink destinations and preserves external content', t => {
  const project = workspace(t);
  const outside = workspace(t);
  writeFileSync(join(outside, 'keep.txt'), 'untouched');
  symlinkSync(outside, join(project, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(run(cli, ['--agent', 'codex', '--project', project]).status, 1);
  assert.deepEqual(readdirSync(outside), ['keep.txt']);
});

test('refuses a symlink inside an existing skill and extra customer files', t => {
  const project = workspace(t);
  const args = ['--agent', 'generic', '--project', project];
  assert.equal(run(cli, args).status, 0);
  const installed = join(project, 'skills/ravensight-instrumentation');
  writeFileSync(join(installed, 'notes.md'), 'keep');
  assert.equal(run(cli, args).status, 1);
  assert.equal(readFileSync(join(installed, 'notes.md'), 'utf8'), 'keep');
  symlinkSync(source, join(installed, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.equal(run(cli, args).status, 1);
});

test('npm tarball runs offline and includes only distributable files', t => {
  const temp = workspace(t);
  const cache = join(temp, 'cache');
  const npmArgs = [process.env.npm_execpath];
  const [pack] = JSON.parse(execFileSync(process.execPath, [...npmArgs, 'pack', '--json', '--ignore-scripts', '--cache', cache, '--pack-destination', temp], { cwd: root, encoding: 'utf8' }));
  // Release downloads must contain exactly the tested source, not an older pack.
  const published = readFileSync(join(root, 'dist', pack.filename));
  assert.ok(published.equals(readFileSync(join(temp, pack.filename))), 'Rebuild the instrumentation download after changing the pack');
  const digest = createHash('sha256').update(published).digest('hex');
  assert.equal(readFileSync(join(root, 'dist', `${pack.filename}.sha256`), 'utf8'), `${digest}  ${pack.filename}\n`);
  const files = pack.files.map(file => file.path);
  assert.ok(files.includes('bin/install.mjs'));
  assert.ok(files.includes('skills/ravensight-instrumentation/SKILL.md'));
  assert.ok(files.every(file => /^(LICENSE|README\.md|package\.json|bin\/install\.mjs|skills\/ravensight-instrumentation\/(SKILL\.md|references\/[^/]+\.md|agents\/openai\.yaml))$/.test(file)), files.join('\n'));
  const project = join(temp, 'game with spaces');
  mkdirSync(project);
  const result = spawnSync(process.execPath, [...npmArgs, 'exec', '--offline', '--yes', '--ignore-scripts', '--cache', cache, '--package', join(temp, pack.filename), '--', 'ravensight-skills', '--agent', 'codex', '--project', project], { cwd: temp, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(existsSync(join(project, '.agents/skills/ravensight-instrumentation/SKILL.md')));
});

test('SKILL.md version matches package.json', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const skill = readFileSync(join(source, 'SKILL.md'), 'utf8');
  const match = skill.match(/^\s*version:\s*"([^"]+)"/m);
  assert.ok(match, 'SKILL.md frontmatter has metadata.version');
  assert.equal(match[1], pkg.version);
});

test('references state the rs_kind contract and drop retired advice', () => {
  for (const name of ['ravensight.md', 'coverage.md']) {
    const text = readFileSync(join(source, 'references', name), 'utf8');
    assert.ok(text.includes('rs_kind'), `${name} mentions rs_kind`);
    assert.ok(!text.includes('context_level'), `${name} no longer advises context_level`);
    assert.ok(!text.includes('Preserve existing location/track integrations'), `${name} drops the old location/track advice`);
    assert.ok(!/[\u2013\u2014]/.test(text), `${name} has no em or en dashes`);
  }
  const skill = readFileSync(join(source, 'SKILL.md'), 'utf8');
  assert.ok(skill.includes('dashboard/how-the-built-in-detections-read-your-events'));
});

test('plain install of a differing copy hints at --force and changes nothing', t => {
  const project = workspace(t);
  const args = ['--agent', 'generic', '--project', project];
  assert.equal(run(cli, args).status, 0);
  const installed = join(project, 'skills/ravensight-instrumentation');
  writeFileSync(join(installed, 'SKILL.md'), 'customer changes');
  const result = run(cli, args);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Rerun with --force/);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
});

test('--force backs up a differing copy then installs the current one', t => {
  const project = workspace(t);
  const args = ['--agent', 'generic', '--project', project];
  assert.equal(run(cli, args).status, 0);
  const installed = join(project, 'skills/ravensight-instrumentation');
  writeFileSync(join(installed, 'SKILL.md'), 'customer changes');
  writeFileSync(join(installed, 'extra.md'), 'mine');
  const dry = run(cli, [...args, '--force', '--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  const result = run(cli, [...args, '--force']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), readFileSync(join(source, 'SKILL.md'), 'utf8'));
  assert.equal(existsSync(join(installed, 'extra.md')), false);
  const backups = readdirSync(join(project, 'skills')).filter(n => n.startsWith('ravensight-instrumentation.bak-'));
  assert.equal(backups.length, 1);
  assert.equal(readFileSync(join(project, 'skills', backups[0], 'SKILL.md'), 'utf8'), 'customer changes');
  assert.equal(readFileSync(join(project, 'skills', backups[0], 'extra.md'), 'utf8'), 'mine');
  // Identical install with --force stays a no-op and makes no backup.
  assert.match(run(cli, [...args, '--force']).stdout, /Already installed/);
  assert.equal(readdirSync(join(project, 'skills')).length, 2);
});

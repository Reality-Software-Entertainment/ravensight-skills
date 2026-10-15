import { test } from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Backups default to the home folder; keep every spawned installer out of the real one.
const fakeHome = mkdtempSync(join(tmpdir(), 'ravensight-skill-home-'));
process.env.HOME = fakeHome;
process.env.USERPROFILE = fakeHome;
process.on('exit', () => rmSync(fakeHome, { recursive: true, force: true }));
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

function backupParent(project) {
  const hash = createHash('sha256').update(realpathSync(project)).digest('hex').slice(0, 8);
  return join(realpathSync(fakeHome), '.ravensight', 'skills-backup', `${basename(realpathSync(project))}-${hash}`);
}
function differing(t, extra = []) {
  const project = workspace(t);
  const args = ['--agent', 'generic', '--project', project];
  assert.equal(run(cli, args).status, 0);
  const installed = join(project, 'skills/ravensight-instrumentation');
  writeFileSync(join(installed, 'SKILL.md'), 'customer changes');
  writeFileSync(join(installed, 'extra.md'), 'mine');
  return { project, args, installed };
}

test('--force backs up outside the repo, then installs the current copy', t => {
  const { project, args, installed } = differing(t);
  const dry = run(cli, [...args, '--force', '--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  const result = run(cli, [...args, '--force']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), readFileSync(join(source, 'SKILL.md'), 'utf8'));
  assert.equal(existsSync(join(installed, 'extra.md')), false);
  // Nothing is left in the repo root but the skills folder.
  assert.deepEqual(readdirSync(project), ['skills']);
  const parent = backupParent(project);
  const backups = readdirSync(parent);
  assert.equal(backups.length, 1);
  assert.match(backups[0], /^ravensight-instrumentation\.bak-/);
  assert.ok(result.stdout.includes(join(parent, backups[0])), result.stdout);
  assert.equal(readFileSync(join(parent, backups[0], 'SKILL.md'), 'utf8'), 'customer changes');
  assert.equal(readFileSync(join(parent, backups[0], 'extra.md'), 'utf8'), 'mine');
  if (process.platform !== 'win32') assert.equal(statSync(parent).mode & 0o077, 0, 'backup folder is private');
  assert.deepEqual(readdirSync(join(project, 'skills')), ['ravensight-instrumentation']);
  // Identical install with --force stays a no-op and makes no backup.
  assert.match(run(cli, [...args, '--force']).stdout, /Already installed/);
  assert.equal(readdirSync(parent).length, 1);
});

test('--backup-dir puts the backup at an explicit location', t => {
  const { project, args, installed } = differing(t);
  const dir = join(workspace(t), 'mine');
  const result = run(cli, [...args, '--force', '--backup-dir', dir]);
  assert.equal(result.status, 0, result.stderr);
  const [name] = readdirSync(dir);
  assert.equal(readFileSync(join(dir, name, 'extra.md'), 'utf8'), 'mine');
  assert.deepEqual(readdirSync(project), ['skills']);
  assert.equal(existsSync(backupParent(project)), false);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), readFileSync(join(source, 'SKILL.md'), 'utf8'));
});

test('--no-backup replaces without a backup and says so', t => {
  const { project, args, installed } = differing(t);
  const result = run(cli, [...args, '--force', '--no-backup']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /without a backup/);
  assert.equal(existsSync(join(installed, 'extra.md')), false);
  assert.equal(existsSync(backupParent(project)), false);
  assert.deepEqual(readdirSync(project), ['skills']);
});

test('backup options need --force and exclude each other', t => {
  const { args, installed } = differing(t);
  assert.equal(run(cli, [...args, '--no-backup']).status, 1);
  assert.equal(run(cli, [...args, '--backup-dir', workspace(t)]).status, 1);
  const both = run(cli, [...args, '--force', '--no-backup', '--backup-dir', workspace(t)]);
  assert.equal(both.status, 1);
  assert.match(both.stderr, /either/);
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('--no-backup still restores the original when the install fails midway', t => {
  const { args, installed } = differing(t);
  const result = spawnSync(process.execPath, [cli, ...args, '--force', '--no-backup'], { encoding: 'utf8', env: { ...process.env, RAVENSIGHT_SKILLS_TEST_FAIL_WRITE: 'SKILL.md' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /previous copy was restored/);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('--force restores the original copy when the install fails midway', t => {
  const { project, args, installed } = differing(t);
  const result = spawnSync(process.execPath, [cli, ...args, '--force'], { encoding: 'utf8', env: { ...process.env, RAVENSIGHT_SKILLS_TEST_FAIL_WRITE: 'SKILL.md' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /previous copy was restored/);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
  assert.deepEqual(readdirSync(join(project, 'skills')), ['ravensight-instrumentation']);
  assert.deepEqual(readdirSync(backupParent(project)), []);
});

test('--force refuses a symlinked backup folder and moves nothing', t => {
  const { project, args, installed } = differing(t);
  const outside = workspace(t);
  // Default location: a symlink where ~/.ravensight/skills-backup should be.
  mkdirSync(join(fakeHome, '.ravensight'), { recursive: true });
  const link = join(fakeHome, '.ravensight', 'skills-backup');
  rmSync(link, { recursive: true, force: true });
  symlinkSync(outside, link);
  t.after(() => rmSync(link, { recursive: true, force: true }));
  const result = run(cli, [...args, '--force']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /symbolic link/);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  assert.deepEqual(readdirSync(outside), []);
  // Explicit location: the folder itself is a symlink.
  const explicit = join(workspace(t), 'link');
  symlinkSync(outside, explicit);
  const second = run(cli, [...args, '--force', '--backup-dir', explicit]);
  assert.equal(second.status, 1);
  assert.match(second.stderr, /symbolic link/);
  assert.deepEqual(readdirSync(outside), []);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  assert.ok(project);
});

test('--backup-dir inside the skill folder is refused', t => {
  const { args, installed } = differing(t);
  const result = run(cli, [...args, '--force', '--backup-dir', join(installed, 'refs')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /inside the skill folder|overlaps/);
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('a failed restore keeps the original error and names the backup', t => {
  const { project, args } = differing(t);
  const result = spawnSync(process.execPath, [cli, ...args, '--force'], { encoding: 'utf8', env: { ...process.env, RAVENSIGHT_SKILLS_TEST_FAIL_WRITE: 'SKILL.md', RAVENSIGHT_SKILLS_TEST_FAIL_RESTORE: '1' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Simulated write failure/);
  assert.match(result.stderr, /restore failed: Simulated restore failure; your previous copy is at .*ravensight-instrumentation\.bak-/);
  const parent = backupParent(project);
  const [kept] = readdirSync(parent);
  assert.equal(readFileSync(join(parent, kept, 'SKILL.md'), 'utf8'), 'customer changes');
});

test('a failing removal of the original is restored from the backup', t => {
  const { project, args, installed } = differing(t);
  const result = spawnSync(process.execPath, [cli, ...args, '--force'], { encoding: 'utf8', env: { ...process.env, RAVENSIGHT_SKILLS_TEST_FAIL_REMOVE: '1' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Simulated removal failure \(your previous copy was restored to /);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
  assert.deepEqual(readdirSync(backupParent(project)), []);
});

test('a failing removal with --no-backup is restored from memory', t => {
  const { args, installed } = differing(t);
  const result = spawnSync(process.execPath, [cli, ...args, '--force', '--no-backup'], { encoding: 'utf8', env: { ...process.env, RAVENSIGHT_SKILLS_TEST_FAIL_REMOVE: '1' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /previous copy was restored/);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('restore keeps empty folders and file modes', t => {
  const { args, installed } = differing(t);
  mkdirSync(join(installed, 'empty'));
  if (process.platform !== 'win32') chmodSync(join(installed, 'extra.md'), 0o600);
  for (const extra of [[], ['--no-backup']]) {
    const result = spawnSync(process.execPath, [cli, ...args, '--force', ...extra], { encoding: 'utf8', env: { ...process.env, RAVENSIGHT_SKILLS_TEST_FAIL_WRITE: 'SKILL.md' } });
    assert.equal(result.status, 1);
    assert.deepEqual(existsSync(join(installed, 'empty')), true);
    if (process.platform !== 'win32') assert.equal(statSync(join(installed, 'extra.md')).mode & 0o777, 0o600);
  }
});

test('--backup-dir equal to the skills folder is refused', t => {
  const { project, args, installed } = differing(t);
  const result = run(cli, [...args, '--force', '--backup-dir', join(project, 'skills')]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /cannot be the skills folder itself/);
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('an unusable home folder points at --backup-dir and --no-backup', t => {
  const { args, installed } = differing(t);
  const result = spawnSync(process.execPath, [cli, ...args, '--force'], { encoding: 'utf8', env: { ...process.env, HOME: join(fakeHome, 'missing'), USERPROFILE: join(fakeHome, 'missing') } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Use --backup-dir PATH or --no-backup/);
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('a ~/.ravensight that cannot be created points at the options', t => {
  const { args, installed } = differing(t);
  const home = workspace(t);
  writeFileSync(join(home, '.ravensight'), 'a file');
  const result = spawnSync(process.execPath, [cli, ...args, '--force'], { encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Use --backup-dir PATH or --no-backup/);
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('a symlinked ~/.ravensight itself is refused', t => {
  const { args, installed } = differing(t);
  const home = workspace(t);
  const outside = workspace(t);
  symlinkSync(outside, join(home, '.ravensight'));
  const result = spawnSync(process.execPath, [cli, ...args, '--force'], { encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /symbolic link/);
  assert.match(result.stderr, /Use --backup-dir PATH or --no-backup/);
  assert.deepEqual(readdirSync(outside), []);
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

test('a backup copy that fails verification is deleted and the original untouched', t => {
  const { project, args, installed } = differing(t);
  const result = spawnSync(process.execPath, [cli, ...args, '--force'], { encoding: 'utf8', env: { ...process.env, RAVENSIGHT_SKILLS_TEST_FAIL_VERIFY: '1' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Simulated copy verification failure/);
  assert.deepEqual(readdirSync(backupParent(project)), []);
  assert.equal(readFileSync(join(installed, 'SKILL.md'), 'utf8'), 'customer changes');
  assert.equal(readFileSync(join(installed, 'extra.md'), 'utf8'), 'mine');
});

const referencesDir = join(source, 'references');
const referenceNames = readdirSync(referencesDir).filter(name => name.endsWith('.md'));
const revisionHeader = /^> Docs catalog revision: `([0-9a-f]{64})`, checked (\d{4}-\d{2}-\d{2}) against https:\/\/www\.ravensight\.io\/docs\/catalog\.json\.$/m;

test('every reference records the docs catalog revision and date it was checked against', () => {
  assert.ok(referenceNames.length >= 4);
  const revisions = new Set();
  for (const name of referenceNames) {
    const text = readFileSync(join(referencesDir, name), 'utf8');
    const match = text.match(revisionHeader);
    assert.ok(match, `${name} has a docs catalog revision header`);
    revisions.add(match[1]);
    assert.ok(!/[\u2013\u2014]/.test(text), `${name} has no em or en dashes`);
  }
  assert.equal(revisions.size, 1, 'all references were checked against one catalog revision');
  assert.ok(!/[\u2013\u2014]/.test(readFileSync(join(source, 'SKILL.md'), 'utf8')), 'SKILL.md has no em or en dashes');
});

test('the rage quit text follows the live detections docs, not the retired name-only rule', () => {
  const text = readFileSync(join(referencesDir, 'ravensight.md'), 'utf8');
  assert.ok(!text.includes('Rage quit still reads names only'));
  assert.ok(text.includes('A death here is an event sent with `rs_kind: "death"`, whatever its name'));
  assert.ok(text.includes('Quoted from `dashboard/how-the-built-in-detections-read-your-events`'));
  for (const name of ['ravensight.md', 'coverage.md']) {
    const ref = readFileSync(join(referencesDir, name), 'utf8');
    assert.match(ref, /never\s+rename\s+an\s+event\s+to\s+dodge\s+a\s+heuristic|instead\s+of\s+renaming\s+an\s+event\s+to\s+dodge\s+a\s+heuristic/);
  }
});

test('the skill requires an acceptance matrix first and three separate verdicts', () => {
  const skill = readFileSync(join(source, 'SKILL.md'), 'utf8');
  assert.ok(skill.indexOf('First deliverable: the acceptance matrix') < skill.indexOf('## 1. Establish the baseline'));
  assert.ok(skill.includes('](references/acceptance.md)'));
  const acceptance = readFileSync(join(referencesDir, 'acceptance.md'), 'utf8');
  for (const column of ['Metric', 'Source of truth', 'Run or attempt join', 'Lifecycle and rollback test', 'Received-data query']) assert.ok(acceptance.includes(`| ${column} |`), column);
  for (const required of ['Time:', 'Exits:', 'Decision consequences:', 'Depth:', 'Progression:', 'Retries:']) assert.ok(acceptance.includes(required), required);
  assert.match(acceptance, /\*\*MAX\*\* per run, never its SUM/);
  const validation = readFileSync(join(referencesDir, 'validation.md'), 'utf8');
  for (const verdict of ['### Delivery:', '### Schema:', '### Coverage:', '## Review checklist']) assert.ok(validation.includes(verdict), verdict);
  assert.ok(validation.includes('static integration check, never a whole-product certificate'));
  const ravensight = readFileSync(join(referencesDir, 'ravensight.md'), 'utf8');
  assert.ok(ravensight.includes('## Native and mobile SDKs'));
  for (const phrase of ['never durable', 'Two privacy controls', 'Preflight a native persona run before any paid job']) assert.ok(ravensight.includes(phrase), phrase);
});

test('check-docs is manual: npm test never runs it, and it judges a catalog offline', async t => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.ok(!pkg.scripts.test.includes('check-docs'));
  assert.ok(!pkg.files.includes('scripts'));
  const { checkReferences, DEFAULT_CATALOG } = await import('../scripts/check-docs.mjs');
  assert.equal(DEFAULT_CATALOG, 'https://www.ravensight.io/docs/catalog.json');
  // Build a catalog from the references themselves: current, then behind, then a changed quote.
  const text = readFileSync(join(referencesDir, 'ravensight.md'), 'utf8');
  const revision = text.match(revisionHeader)[1];
  const quote = text.match(/^Quoted from `([^`]+)` at revision `([0-9a-f]{64})`:\n\n((?:> .*\n)+)/m);
  assert.ok(quote, 'ravensight.md quotes the detections doc');
  const content = quote[3].split('\n').map(line => line.replace(/^> ?/, '')).join('\n \n');
  const catalog = { revision, documents: [{ id: quote[1], revision: quote[2], content }] };
  assert.deepEqual(checkReferences(referencesDir, catalog).problems, []);
  assert.equal(checkReferences(referencesDir, { ...catalog, revision: 'f'.repeat(64) }).problems.length, referenceNames.length);
  const changed = { revision, documents: [{ id: quote[1], revision: 'e'.repeat(64), content: content.replace('10 minutes', '15 minutes') }] };
  const problems = checkReferences(referencesDir, changed).problems;
  assert.ok(problems.some(p => p.includes('changed')), problems.join('\n'));
  assert.ok(problems.some(p => p.includes('no longer matches')), problems.join('\n'));
  // A reference with no header, and a quote whose document left the catalog.
  const refs = workspace(t);
  writeFileSync(join(refs, 'bare.md'), '# No header\n');
  writeFileSync(join(refs, 'gone.md'), `# Gone\n\n> Docs catalog revision: \`${revision}\`, checked 2026-10-14 against https://www.ravensight.io/docs/catalog.json.\n\nQuoted from \`removed/doc\` at revision \`${'a'.repeat(64)}\`:\n\n> Some text.\n`);
  const local = checkReferences(refs, catalog).problems;
  assert.ok(local.some(p => p.startsWith('bare.md: no "Docs catalog revision" header')), local.join('\n'));
  assert.ok(local.some(p => p.includes('removed/doc is not in the catalog')), local.join('\n'));
  // The command line: exit 2 with a message for an unreadable references folder, exit 1 for problems.
  const catalogFile = join(refs, 'catalog.json');
  writeFileSync(catalogFile, JSON.stringify(catalog));
  const script = join(root, 'scripts/check-docs.mjs');
  const missing = run(script, ['--catalog', catalogFile, '--references', join(refs, 'nope')]);
  assert.equal(missing.status, 2, missing.stderr);
  assert.match(missing.stderr, /Could not read the references at/);
  assert.doesNotMatch(missing.stderr, /at checkReferences/);
  assert.equal(run(script, ['--catalog', join(refs, 'absent.json')]).status, 2);
  assert.equal(run(script, ['--catalog', catalogFile, '--references', refs]).status, 1);
  assert.equal(run(script, ['--catalog', catalogFile]).status, 0);
});

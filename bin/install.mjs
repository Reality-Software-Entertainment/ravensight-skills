#!/usr/bin/env node
import { chmodSync, cpSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/ravensight-instrumentation');
const name = 'ravensight-instrumentation';
const destinations = { codex: '.agents/skills', claude: '.claude/skills', copilot: '.github/skills', generic: 'skills' };
const help = `Ravensight instrumentation skill installer
Usage: ravensight-skills --agent codex|claude|copilot|generic --project PATH [--dry-run] [--force [--no-backup | --backup-dir PATH]]

Copies SKILL.md, references, and agent metadata into the chosen project.
No network, credentials, global configuration, or game-code changes.
Identical installs are a no-op. Different existing content is never overwritten unless you pass --force,
which first copies it to ~/.ravensight/skills-backup/<project>-<hash>/${name}.bak-<timestamp>
(outside your repository, so nothing new shows up in git) and then installs.
--backup-dir PATH puts the backup under PATH instead. --no-backup replaces without keeping one.
Use generic for an agent that will read skills/${name}/SKILL.md explicitly.`;

function stat(path) {
  try { return lstatSync(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function tree(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const relative = join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${join(root, relative)}`);
    if (entry.isDirectory()) return tree(root, relative);
    if (!entry.isFile()) throw new Error(`Not a regular file: ${join(root, relative)}`);
    return [relative];
  });
}
function mkdirPrivate(path) { mkdirSync(path, { recursive: true, mode: 0o700 }); }
function dirs(root, prefix = '') {
  return readdirSync(join(root, prefix), { withFileTypes: true }).filter(e => e.isDirectory()).flatMap(e => [join(prefix, e.name), ...dirs(root, join(prefix, e.name))]).sort();
}
const modeOf = path => lstatSync(path).mode & 0o777;
function sameTree(a, b) {
  const left = tree(a).sort();
  return JSON.stringify(left) === JSON.stringify(tree(b).sort())
    && JSON.stringify(dirs(a)) === JSON.stringify(dirs(b))
    && left.every(file => readFileSync(join(a, file)).equals(readFileSync(join(b, file))) && modeOf(join(a, file)) === modeOf(join(b, file)));
}
// Copy, then prove the copy matches (files, bytes, modes, empty folders) before the caller
// removes the original (the destination may be on another filesystem, so no rename).
function copyVerified(from, to) {
  try {
    cpSync(from, to, { recursive: true, errorOnExist: true, force: false });
    if (process.env.RAVENSIGHT_SKILLS_TEST_FAIL_VERIFY === '1') throw new Error('Simulated copy verification failure');
    if (!sameTree(from, to)) throw new Error(`Copy did not match the original: ${to}`);
  } catch (error) {
    rmSync(to, { recursive: true, force: true });
    throw error;
  }
}
// Every refusal of a backup location ends with the same way out, on every platform.
const backupHint = ' Use --backup-dir PATH or --no-backup instead.';
function backupError(message) { return new Error(`${message}${backupHint}`); }
function checkBackupParent(parent, trustedBase) {
  // Every existing component from the trusted base down must be a real directory.
  let current = trustedBase;
  const parts = parent.slice(trustedBase.length).split(sep).filter(Boolean);
  const chain = [current, ...parts.map(part => (current = join(current, part)))];
  for (const path of chain) {
    const entry = stat(path);
    if (entry && (entry.isSymbolicLink() || !entry.isDirectory())) throw backupError(`Refusing non-directory or symbolic link: ${path}.`);
  }
}
function main(args) {
  if (args.length === 0 || args.includes('--help')) { console.log(help); return; }
  let agent, project, backupDir, dryRun = false, force = false, noBackup = false;
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (seen.has(flag)) throw new Error(`Repeated option: ${flag}`);
    seen.add(flag);
    if (flag === '--dry-run') { dryRun = true; continue; }
    if (flag === '--force') { force = true; continue; }
    if (flag === '--no-backup') { noBackup = true; continue; }
    if (flag !== '--agent' && flag !== '--project' && flag !== '--backup-dir') throw new Error(`Unknown option: ${flag}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--agent') agent = value; else if (flag === '--project') project = value; else backupDir = value;
  }
  if (!Object.hasOwn(destinations, agent ?? '') || !project) throw new Error('Specify --agent codex|claude|copilot|generic and --project PATH.');
  if ((noBackup || backupDir) && !force) throw new Error('--no-backup and --backup-dir only apply together with --force.');
  if (noBackup && backupDir) throw new Error('Use either --no-backup or --backup-dir, not both.');
  const root = realpathSync(resolve(project));
  if (!stat(root)?.isDirectory()) throw new Error('Project must be an existing directory.');
  let target = root;
  for (const part of [...destinations[agent].split('/'), name]) {
    target = join(target, part);
    const entry = stat(target);
    if (entry && (entry.isSymbolicLink() || !entry.isDirectory())) throw new Error(`Refusing non-directory or symbolic link: ${target}`);
  }
  const files = ['SKILL.md', ...tree(join(source, 'references')).map(p => join('references', p)), ...tree(join(source, 'agents')).map(p => join('agents', p))].sort();
  const contents = new Map(files.map(file => [file, readFileSync(join(source, file))]));
  let backup, snapshot;
  if (stat(target)) {
    const existing = tree(target).sort();
    if (JSON.stringify(existing) === JSON.stringify(files) && files.every(file => readFileSync(join(target, file)).equals(contents.get(file)))) {
      console.log(`Already installed: ${target}`); return;
    }
    if (!force) throw new Error(`Existing skill differs; preserve your changes before replacing it: ${target}. Rerun with --force to back it up and replace it.`);
    if (noBackup) {
      if (dryRun) { console.log(`Would replace ${target} WITHOUT a backup and install ${files.length} files`); return; }
      snapshot = { dirs: dirs(target), files: new Map(tree(target).map(file => [file, { data: readFileSync(join(target, file)), mode: modeOf(join(target, file)) }])) };
    } else {
      let parent, trustedBase;
      if (backupDir) { parent = resolve(backupDir); trustedBase = parent; }
      else {
        let home;
        try { home = realpathSync(homedir()); } catch (error) { throw backupError(`Cannot find your home folder for the backup (${error.message}).`); }
        trustedBase = join(home, '.ravensight');
        parent = join(trustedBase, 'skills-backup', `${basename(root)}-${createHash('sha256').update(root).digest('hex').slice(0, 8)}`);
      }
      backup = join(parent, `${name}.bak-${new Date().toISOString().replace(/[-:.]/g, '').replace('T', '-').slice(0, 15)}`);
      if (parent === dirname(target)) throw new Error(`Backup folder cannot be the skills folder itself, agents would see a duplicate skill: ${parent}`);
      if (backup === target || backup.startsWith(target + sep)) throw new Error(`Backup location overlaps the skill folder: ${backup}`);
      let exists;
      try { exists = stat(backup); } catch (error) { throw backupError(`Cannot use ${parent} for the backup (${error.message}).`); }
      if (exists) throw new Error(`Backup already exists: ${backup}`);
      if (dryRun) { console.log(`Would back up ${target} to ${backup} and install ${files.length} files`); return; }
      if (backupDir) {
        // Explicit location: the backup folder itself must not be a symlink (its parents are used as typed).
        const entry = stat(parent);
        if (entry && (entry.isSymbolicLink() || !entry.isDirectory())) throw backupError(`Refusing non-directory or symbolic link: ${parent}.`);
        mkdirPrivate(parent);
      } else {
        checkBackupParent(parent, trustedBase);
        try { mkdirPrivate(parent); } catch (error) { throw backupError(`Cannot create ${parent} (${error.message}).`); }
      }
      const realParent = realpathSync(parent);
      if (realParent === dirname(realpathSync(target))) throw new Error(`Backup folder cannot be the skills folder itself, agents would see a duplicate skill: ${parent}`);
      if (realParent === realpathSync(target) || realParent.startsWith(realpathSync(target) + sep)) throw new Error(`Backup folder is inside the skill folder: ${parent}`);
      if (!backupDir && !realParent.startsWith(realpathSync(trustedBase) + sep)) throw new Error(`Backup folder resolves outside ${trustedBase}: ${parent}`);
      copyVerified(target, backup);
    }
  }
  if (dryRun) { console.log(`Would install ${files.length} files to ${target}`); return; }
  // Exclusive creation makes concurrent installs fail rather than overwrite.
  let created = false;
  try {
    if (backup || snapshot) {
      // Removing the original is inside the try: a partial removal is restored, never left half-deleted.
      if (process.env.RAVENSIGHT_SKILLS_TEST_FAIL_REMOVE === '1') { rmSync(join(target, 'SKILL.md')); throw new Error('Simulated removal failure'); }
      rmSync(target, { recursive: true });
    }
    mkdirSync(dirname(target), { recursive: true });
    mkdirSync(target);
    created = true;
    for (const file of files) {
      mkdirSync(dirname(join(target, file)), { recursive: true });
      if (process.env.RAVENSIGHT_SKILLS_TEST_FAIL_WRITE === file) throw new Error(`Simulated write failure for ${file}`);
      writeFileSync(join(target, file), contents.get(file), { flag: 'wx' });
    }
  } catch (error) {
    if (created || backup || snapshot) rmSync(target, { recursive: true, force: true });
    if (snapshot) {
      try {
        mkdirSync(target, { recursive: true });
        for (const d of snapshot.dirs) mkdirSync(join(target, d), { recursive: true });
        for (const [file, { data, mode }] of snapshot.files) { mkdirSync(dirname(join(target, file)), { recursive: true }); writeFileSync(join(target, file), data, { mode }); chmodSync(join(target, file), mode); }
        error.message += ` (your previous copy was restored to ${target})`;
      } catch (restoreError) {
        error.message += ` (restore failed: ${restoreError.message}; no backup was kept)`;
      }
    }
    if (backup) {
      let restored = false;
      try {
        if (process.env.RAVENSIGHT_SKILLS_TEST_FAIL_RESTORE === '1') throw new Error('Simulated restore failure');
        copyVerified(backup, target);
        restored = true;
        error.message += ` (your previous copy was restored to ${target})`;
        rmSync(backup, { recursive: true });
      } catch (restoreError) {
        error.message += restored
          ? ` (the backup at ${backup} could not be removed: ${restoreError.message}; it is a duplicate you can delete)`
          : ` (restore failed: ${restoreError.message}; your previous copy is at ${backup})`;
      }
    }
    throw error;
  }
  console.log(`${backup ? `Backed up previous copy to: ${backup}\n` : ''}${snapshot ? 'Replaced previous copy without a backup (--no-backup).\n' : ''}Installed: ${target}\nAsk your agent to use ravensight-instrumentation to audit or expand tracking. Reload its skills if needed.`);
}
try { main(process.argv.slice(2)); } catch (error) { console.error(`Installation failed: ${error.message}`); process.exitCode = 1; }

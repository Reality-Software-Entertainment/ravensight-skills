#!/usr/bin/env node
import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/ravensight-instrumentation');
const name = 'ravensight-instrumentation';
const destinations = { codex: '.agents/skills', claude: '.claude/skills', copilot: '.github/skills', generic: 'skills' };
const help = `Ravensight instrumentation skill installer
Usage: ravensight-skills --agent codex|claude|copilot|generic --project PATH [--dry-run]

Copies SKILL.md, references, and agent metadata into the chosen project.
No network, credentials, global configuration, or game-code changes.
Identical installs are a no-op. Different existing content is never overwritten.
For updates, back up and remove the existing skill directory, then reinstall.
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
function main(args) {
  if (args.length === 0 || args.includes('--help')) { console.log(help); return; }
  let agent, project, dryRun = false;
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (seen.has(flag)) throw new Error(`Repeated option: ${flag}`);
    seen.add(flag);
    if (flag === '--dry-run') { dryRun = true; continue; }
    if (flag !== '--agent' && flag !== '--project') throw new Error(`Unknown option: ${flag}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--agent') agent = value; else project = value;
  }
  if (!Object.hasOwn(destinations, agent ?? '') || !project) throw new Error('Specify --agent codex|claude|copilot|generic and --project PATH.');
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
  if (stat(target)) {
    const existing = tree(target).sort();
    if (JSON.stringify(existing) === JSON.stringify(files) && files.every(file => readFileSync(join(target, file)).equals(contents.get(file)))) {
      console.log(`Already installed: ${target}`); return;
    }
    throw new Error(`Existing skill differs; preserve your changes before replacing it: ${target}`);
  }
  if (dryRun) { console.log(`Would install ${files.length} files to ${target}`); return; }
  mkdirSync(dirname(target), { recursive: true });
  // Exclusive creation makes concurrent installs fail rather than overwrite.
  mkdirSync(target);
  try {
    for (const file of files) {
      mkdirSync(dirname(join(target, file)), { recursive: true });
      writeFileSync(join(target, file), contents.get(file), { flag: 'wx' });
    }
  } catch (error) {
    rmSync(target, { recursive: true, force: true });
    throw error;
  }
  console.log(`Installed: ${target}\nAsk your agent to use ravensight-instrumentation to audit or expand tracking. Reload its skills if needed.`);
}
try { main(process.argv.slice(2)); } catch (error) { console.error(`Installation failed: ${error.message}`); process.exitCode = 1; }

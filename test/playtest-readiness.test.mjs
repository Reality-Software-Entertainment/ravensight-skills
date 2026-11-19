import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const name = 'ravensight-playtest-readiness';
const skillPath = join(root, 'playtest/skills', name, 'SKILL.md');
const skill = readFileSync(skillPath, 'utf8');
const run = (project, ...args) => spawnSync(process.execPath, [join(root, 'bin/install.mjs'), '--agent', 'generic', '--project', project, ...args], { encoding: 'utf8' });
function temp(t) {
  const project = mkdtempSync(join(tmpdir(), 'rs-readiness-'));
  t.after(() => rmSync(project, { recursive: true, force: true }));
  return project;
}

test('the playtest readiness skill installs only when it is named', t => {
  const project = temp(t);
  const result = run(project, '--skill', name);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(join(project, 'skills')), [name]);
  assert.equal(readFileSync(join(project, 'skills', name, 'SKILL.md'), 'utf8'), skill);
  assert.ok(readdirSync(join(project, 'skills', name, 'agents')).includes('openai.yaml'));
});

test('--skill all never installs it, and it lives outside the main pack folder', t => {
  const project = temp(t);
  assert.equal(run(project, '--skill', 'all').status, 0);
  assert.equal(readdirSync(join(project, 'skills')).includes(name), false);
  assert.equal(readdirSync(join(root, 'skills')).includes(name), false);
});

test('its version matches package.json and its front matter names it', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(skill.match(/^\s*version:\s*"([^"]+)"/m)[1], pkg.version);
  assert.match(skill, new RegExp(`^name: ${name}$`, 'm'));
});

// Every flag the skill tells an agent to pass, against what ravensight-playtest
// 0.12.0 has. Native flags appear only in the Android and iOS section.
const RELEASED = ['--help', '--game', '--from', '--show', '--driver', '--godot-project', '--build-url', '--personas', '--record-video', '--no-record-video', '--upload-video', '--long', '--realtime', '--skip-preflight', '--tier', '--minutes', '--focus', '--avoid', '--start', '--save'];
const NATIVE = ['--native-build', '--device', '--platform', '--package', '--bundle-id', '--landscape', '--driver-config'];

test('it names only flags the CLI has, and native flags only for native builds', () => {
  let section = '';
  for (const line of skill.split('\n')) {
    if (line.startsWith('## ')) section = line;
    assert.doesNotMatch(line, /next release/i, 'every flag is released in 0.12.0');
    for (const flag of line.match(/(?<![\w-])--[a-z][a-z-]+/g) || []) {
      assert.ok(RELEASED.includes(flag) || NATIVE.includes(flag), `unknown flag ${flag}`);
      if (NATIVE.includes(flag) && flag !== '--driver-config') assert.ok(section === '## Android and iOS games' || /--native-build/.test(line), `${flag} outside the native section`);
    }
  }
});

test('the native section keeps the limits a developer has to know', () => {
  const native = skill.slice(skill.indexOf('## Android and iOS games'), skill.indexOf('## 7.'));
  assert.match(native, /Cloud playtests still need a web build/);
  assert.match(native, /physical devices are not supported/);
  assert.match(native, /real time/);
  assert.match(native, /charges nothing/);
  assert.doesNotMatch(skill, /held|unpublished|candidate|preview|under validation/i);
});

test('it never starts a paid run on its own, names no model vendor, and has no em or en dash', () => {
  assert.match(skill, /Never start a paid run, top up a balance or install the CLI without the user asking/);
  assert.match(skill, /Do not pass `-y` unless the user has agreed to that price/);
  assert.match(skill, /Geri and Freki/);
  assert.doesNotMatch(skill, /[–—]/);
  assert.doesNotMatch(skill, /anthropic|claude|openai|gpt|gemini|sonnet|opus|haiku/i);
});

test('it explains every capability note tag', () => {
  const tags = [...skill.matchAll(/^\| `\[([a-z_]+)\]` \|/gm)].map(match => match[1]);
  assert.deepEqual(tags, ['no_label', 'drawn_screen', 'no_state', 'font', 'outline_cut', 'no_way_in', 'input', 'too_fast', 'brief_gap', 'budget']);
});

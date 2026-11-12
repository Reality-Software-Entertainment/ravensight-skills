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

// Every flag the skill tells an agent to pass, against what the CLI has. A flag
// that is not in 0.9.0 has to sit on a line marked "(next release)".
const RELEASED = ['--help', '--game', '--from', '--show', '--driver', '--godot-project', '--build-url', '--personas', '--record-video', '--upload-video', '--long', '--realtime', '--skip-preflight', '--tier', '--minutes', '--focus', '--avoid', '--start'];
const NEXT_ONLY = ['--save'];
/** Flags released for `hosted run` and not yet for a local `run`. */
const NEXT_FOR_LOCAL_RUN = ['--tier', '--minutes', '--focus', '--avoid', '--start'];

test('it names only flags the CLI has, and marks the ones from the next release', () => {
  for (const line of skill.split('\n')) {
    for (const flag of line.match(/(?<![\w-])--[a-z][a-z-]+/g) || []) {
      assert.ok(RELEASED.includes(flag) || NEXT_ONLY.includes(flag), `unknown flag ${flag}`);
      if (NEXT_ONLY.includes(flag)) assert.match(line, /\(next release\)/, `${flag} is not released`);
    }
  }
  const check = skill.split('\n').find(line => line.includes('check --driver godot_driver --godot-project'));
  assert.match(check, /\(next release\)/, 'check has no --godot-project or --record-video in 0.9.0');
  for (const line of skill.split('\n').filter(line => /`run --(tier|start)/.test(line) && !line.includes('hosted run --' + (line.match(/`run --(\w+)/) || [])[1]))) {
    assert.match(line, /\(next release\)/);
  }
  assert.ok(NEXT_FOR_LOCAL_RUN.every(flag => RELEASED.includes(flag)));
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

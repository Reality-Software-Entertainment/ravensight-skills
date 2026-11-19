// The skills never tell the agent to run Ravensight Doctor, the project's own
// tests or builds, or the local playtest check. The developer runs those; the
// agent gives the command, says what it checks and reads the result the
// developer shares. This scans what customers actually receive: every skill
// and reference in the npm tarball and in the Claude directory bundle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'))).version;

// What the agent must not run itself.
const TARGET = /ravensight-doctor|\bdoctor\b|ravensight-playtest\s+check|playtest check|\btests?\b|test (?:runner|suite)|smoke harness|\bbuilds?\b|type[- ]?checks?|engine checks?|npm (?:test|run)/i;
const TOOL = /ravensight-doctor|\bdoctor\b|ravensight-playtest|test (?:runner|suite)|smoke harness/i;
// An imperative verb at the start of a sentence or clause. "run" followed by a
// noun ("run id", "run join") is the playtest run, not a command.
const RUN = /(?:^|[,;:(]\s*|\b(?:then|and|first|also|or|please)\s+)(?:re-?run|run|execute|invoke|exercise)\b(?!\s+(?:or attempt|id|ids|identifier|join|key|keys|ends?|time|length|budget|report)\b)/i;
const USE = /(?:^|[,;:(]\s*|\b(?:then|and|first|also|or)\s+)(?:use|using)\b/i;
// The developer runs it, or the sentence forbids the agent from running it.
const DEVELOPER = /\b(?:developer|user|they)\b[^.]{0,80}\b(?:run|runs|re-?run|execute|exercise|exercises)\b|\b(?:give|hand|send|tell|ask|show)s?\s+(?:the\s+)?(?:developer|user)\b/i;
const NEGATED = /\b(?:do not|don't|never|not)\b[^.]{0,40}\b(?:run|re-?run|execute|invoke|exercise)\b/i;

export function agentRunsCheck(sentence) {
  const s = sentence.replace(/\*\*/g, '').replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim();
  if (!TARGET.test(s)) return false;
  if (!(RUN.test(s) || (USE.test(s) && TOOL.test(s)))) return false;
  return !(DEVELOPER.test(s) || NEGATED.test(s));
}

export function sentences(markdown) {
  const out = [];
  const text = markdown.replace(/```[\s\S]*?```/g, ' ');
  for (const block of text.split(/\n\s*\n|\n(?=\s*(?:[-*]|\d+\.)\s)|\n(?=\s*[#|>])/)) {
    for (const cell of block.split('|')) {
      out.push(...cell.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z`*(])/).filter(Boolean));
    }
  }
  return out;
}

function markdownFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = prefix + entry.name;
    if (entry.isDirectory()) return markdownFiles(join(directory, entry.name), path + '/');
    return path.endsWith('.md') ? [path] : [];
  });
}

const sourceFiles = markdownFiles(join(root, 'skills')).sort();

function builtPackages(t) {
  const scratch = mkdtempSync(join(tmpdir(), 'rs-developer-runs-'));
  t.after(() => rmSync(scratch, { recursive: true, force: true }));
  execFileSync('tar', ['-xzf', join(root, 'dist', `ravensight-skills-${version}.tgz`), '-C', scratch]);
  return [
    ['npm tarball', join(scratch, 'package', 'skills')],
    ['Claude directory bundle', join(root, 'plugins', 'ravensight', 'skills')]
  ];
}

test('the detector tells an agent instruction from a developer hand-off', () => {
  for (const bad of [
    'Run appropriate existing tests and a build/type/engine check for edited code.',
    'Use `npx ravensight-doctor --help` to confirm supported flags before a check.',
    'Run the free `ravensight-playtest check` first, confirm the automation server.',
    'If the project already has ravensight-doctor, use its local documented JSON command for a static check.',
    'Run build/type/engine checks appropriate to the edited files.',
    'Use the project\'s existing engine test runner or smoke harness when practical.',
    'Exercise relevant success, failure and retry paths, then run the tests.'
  ]) assert.ok(agentRunsCheck(bad), bad);
  for (const good of [
    'Give the developer the command `npx --yes ravensight-doctor --json` and explain what it checks.',
    'Do not run the project\'s tests or builds yourself.',
    'Ask the developer to run the free `ravensight-playtest check` and share its output.',
    'A green doctor result is a static integration check, never a whole-product certificate.',
    'Leave the playtest token and run id unset in a build that ships to players.',
    'Use a bounded `gt_pub_` key for a distributed build.',
    'Run each row\'s received-data query; take MAX of cumulative counters per run.',
    'Columns: metric, source of truth, run or attempt join, lifecycle and rollback test, received-data query.'
  ]) assert.ok(!agentRunsCheck(good), good);
});

test('every built skill and reference leaves doctor, tests, builds and the playtest check to the developer', t => {
  assert.ok(sourceFiles.length >= 10, `expected the skills and references, found ${sourceFiles.length}`);
  const offending = [];
  for (const [label, directory] of builtPackages(t)) {
    assert.deepEqual(markdownFiles(directory).sort(), sourceFiles, `${label} must carry every skill and reference`);
    for (const file of sourceFiles) {
      for (const sentence of sentences(readFileSync(join(directory, file), 'utf8'))) {
        if (agentRunsCheck(sentence)) offending.push(`${label}: ${file}: ${sentence.trim()}`);
      }
    }
  }
  assert.deepEqual(offending, [], 'The agent gives the developer these commands instead of running them:\n' + offending.join('\n'));
});

test('setup and instrumentation say how to hand a check to the developer', t => {
  for (const [label, directory] of builtPackages(t)) {
    for (const file of [
      'ravensight-setup/SKILL.md',
      'ravensight-instrumentation/SKILL.md',
      'ravensight-instrumentation/references/validation.md',
      'ravensight-instrumentation/references/ravensight.md'
    ]) {
      const text = readFileSync(join(directory, file), 'utf8').replace(/\s+/g, ' ');
      assert.match(text, /give the developer the (?:exact )?command/i, `${label}: ${file} names the hand-off`);
      assert.match(text, /what (?:it|each|the command) checks/i, `${label}: ${file} explains what the check covers`);
      assert.match(text, /interpret the (?:result|output)s? the developer shares/i, `${label}: ${file} reads the shared result`);
    }
  }
});

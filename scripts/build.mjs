#!/usr/bin/env node
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = root;
const output = join(root, 'dist');
const cache = mkdtempSync(join(tmpdir(), 'ravensight-skill-pack-'));
try {
  mkdirSync(output, { recursive: true });
  const result = JSON.parse(execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['pack', '--json', '--ignore-scripts', '--cache', cache, '--pack-destination', output],
    { cwd: source, encoding: 'utf8' }))[0];
  const digest = createHash('sha256').update(readFileSync(join(output, result.filename))).digest('hex');
  writeFileSync(join(output, `${result.filename}.sha256`), `${digest}  ${result.filename}\n`);
  console.log(`Built dist/${result.filename} (${result.size} bytes)\nSHA-256 ${digest}`);
} finally { rmSync(cache, { recursive: true, force: true }); }

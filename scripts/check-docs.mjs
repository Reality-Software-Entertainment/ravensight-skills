#!/usr/bin/env node
// Checks the skill's references against the live public docs catalog.
// Run by hand before a release: `npm run check-docs`. Never part of `npm test`,
// because tests run without network access.
//
// Each reference file carries a header naming the catalog revision it was checked
// against. Passages introduced by "Quoted from `<doc id>` at revision `<rev>`:" are
// blockquotes that must appear word for word in that live document.
//
// Exit 0: every reference is current. Exit 1: a reference is behind the catalog, a
// quoted document changed, or a quote no longer matches. Exit 2: the catalog could
// not be read.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_CATALOG = 'https://www.ravensight.io/docs/catalog.json';
const HEADER = /^> Docs catalog revision: `([0-9a-f]{64})`, checked (\d{4}-\d{2}-\d{2}) against (\S+?)\.?$/m;
const QUOTE = /^Quoted from `([^`]+)` at revision `([0-9a-f]{64})`:\n\n((?:> .*(?:\n|$))+)/gm;
const normalize = text => text.replace(/\s+/g, ' ').trim();

function parseArgs(argv) {
  const args = { catalog: process.env.RAVENSIGHT_DOCS_CATALOG || DEFAULT_CATALOG, references: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--catalog' && argv[i + 1]) args.catalog = argv[++i];
    else if (argv[i] === '--references' && argv[i + 1]) args.references = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}. Usage: check-docs.mjs [--catalog URL|PATH] [--references DIR]`);
  }
  return args;
}

async function loadCatalog(location) {
  if (/^https?:\/\//.test(location)) {
    const response = await fetch(location, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`${location} answered ${response.status}`);
    return response.json();
  }
  return JSON.parse(readFileSync(location, 'utf8'));
}

export function checkReferences(dir, catalog) {
  const problems = [];
  const notes = [];
  const docs = new Map((catalog.documents || []).map(doc => [doc.id, doc]));
  for (const name of readdirSync(dir).filter(file => file.endsWith('.md')).sort()) {
    const text = readFileSync(join(dir, name), 'utf8');
    const header = text.match(HEADER);
    if (!header) { problems.push(`${name}: no "Docs catalog revision" header`); continue; }
    const [, revision, checked] = header;
    if (revision !== catalog.revision) problems.push(`${name}: checked against ${revision.slice(0, 12)} on ${checked}, live catalog is ${String(catalog.revision).slice(0, 12)}`);
    else notes.push(`${name}: current (${revision.slice(0, 12)}, checked ${checked})`);
    for (const [, id, docRevision, block] of text.matchAll(QUOTE)) {
      const doc = docs.get(id);
      if (!doc) { problems.push(`${name}: quoted document ${id} is not in the catalog`); continue; }
      if (doc.revision !== docRevision) problems.push(`${name}: ${id} changed (${docRevision.slice(0, 12)} recorded, ${String(doc.revision).slice(0, 12)} live)`);
      const live = normalize(doc.content || '');
      const passages = block.split('\n').map(line => line.replace(/^> ?/, '').replace(/^- /, '')).filter(Boolean);
      for (const passage of passages) {
        if (!live.includes(normalize(passage))) problems.push(`${name}: quote from ${id} no longer matches: "${passage.slice(0, 70)}..."`);
      }
    }
  }
  return { problems, notes };
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  let args;
  try { args = parseArgs(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exit(2); }
  const dir = args.references || join(root, 'skills/ravensight-instrumentation/references');
  let catalog;
  try { catalog = await loadCatalog(args.catalog); } catch (error) {
    console.error(`Could not read the docs catalog at ${args.catalog}: ${error.message}`);
    process.exit(2);
  }
  if (!catalog || typeof catalog.revision !== 'string') { console.error(`${args.catalog} has no catalog revision`); process.exit(2); }
  const { problems, notes } = checkReferences(dir, catalog);
  for (const note of notes) console.log(note);
  if (problems.length) {
    for (const problem of problems) console.error(problem);
    console.error(`\n${problems.length} problem(s). Re-read the changed docs, update the references and their headers, then run this again.`);
    process.exit(1);
  }
  console.log(`All references match docs catalog ${catalog.revision.slice(0, 12)}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

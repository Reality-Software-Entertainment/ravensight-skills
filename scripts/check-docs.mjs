#!/usr/bin/env node
// Checks the skill's references against the live public docs catalog.
// Run by hand before a release: `npm run check-docs`. Never part of `npm test`,
// because tests run without network access.
//
// Each reference file carries a header naming the catalog revision it was checked
// against. Passages introduced by "Quoted from `<doc id>` at revision `<rev>`:" are
// blockquotes that must appear word for word in that live document.
//
// Exit 0: every reference is current, or the catalog moved but no quoted document's
// revision or text changed (a notice says so; `--stamp` rewrites the headers to the
// current catalog revision). Exit 1: a quoted document's revision or text changed,
// a quote no longer matches, or a header is missing. Exit 2: the catalog could not
// be read.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_CATALOG = 'https://www.ravensight.io/docs/catalog.json';
const HEADER_G = /^(> Docs catalog revision: `)([0-9a-f]{64})(`, checked )(\d{4}-\d{2}-\d{2})( against \S+?\.?)$/m;
const HEADER = /^> Docs catalog revision: `([0-9a-f]{64})`, checked (\d{4}-\d{2}-\d{2}) against (\S+?)\.?$/m;
const QUOTE = /^Quoted from `([^`]+)` at revision `([0-9a-f]{64})`:\n\n((?:> .*(?:\n|$))+)/gm;
const normalize = text => text.replace(/\s+/g, ' ').trim();

function parseArgs(argv) {
  const args = { catalog: process.env.RAVENSIGHT_DOCS_CATALOG || DEFAULT_CATALOG, references: null, stamp: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--catalog' && argv[i + 1]) args.catalog = argv[++i];
    else if (argv[i] === '--stamp') args.stamp = true;
    else if (argv[i] === '--references' && argv[i + 1]) args.references = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}. Usage: check-docs.mjs [--catalog URL|PATH] [--references DIR] [--stamp]`);
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
  const drift = [];
  const changedIds = new Set();
  const docs = new Map((catalog.documents || []).map(doc => [doc.id, doc]));
  for (const name of readdirSync(dir).filter(file => file.endsWith('.md')).sort()) {
    const text = readFileSync(join(dir, name), 'utf8');
    const header = text.match(HEADER);
    if (!header) { problems.push(`${name}: no "Docs catalog revision" header`); continue; }
    const [, revision, checked] = header;
    if (revision !== catalog.revision) drift.push(`${name}: checked against ${revision.slice(0, 12)} on ${checked}, live catalog is ${String(catalog.revision).slice(0, 12)}`);
    else notes.push(`${name}: current (${revision.slice(0, 12)}, checked ${checked})`);
    for (const [, id, docRevision, block] of text.matchAll(QUOTE)) {
      const doc = docs.get(id);
      if (!doc) { problems.push(`${name}: quoted document ${id} is not in the catalog`); continue; }
      if (doc.revision !== docRevision) changedIds.add(id);
      if (doc.revision !== docRevision) problems.push(`${name}: ${id} changed (${docRevision.slice(0, 12)} recorded, ${String(doc.revision).slice(0, 12)} live)`);
      const live = normalize(doc.content || '');
      const passages = block.split('\n').map(line => line.replace(/^> ?/, '').replace(/^- /, '')).filter(Boolean);
      for (const passage of passages) {
        if (!live.includes(normalize(passage))) changedIds.add(id);
        if (!live.includes(normalize(passage))) problems.push(`${name}: quote from ${id} no longer matches: "${passage.slice(0, 70)}..."`);
      }
    }
  }
  return { problems, notes, drift, changedIds: [...changedIds].sort() };
}

// Rewrites every header to the catalog revision. Only call it when nothing quoted changed.
export function stampReferences(dir, catalog, date = new Date().toISOString().slice(0, 10)) {
  const stamped = [];
  for (const name of readdirSync(dir).filter(file => file.endsWith('.md')).sort()) {
    const path = join(dir, name);
    const text = readFileSync(path, 'utf8');
    if (!HEADER_G.test(text)) continue;
    const next = text.replace(HEADER_G, (_, a, rev, b, day, c) => `${a}${catalog.revision}${b}${date}${c}`);
    if (next !== text) { writeFileSync(path, next); stamped.push(name); }
  }
  return stamped;
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
  let result;
  try { result = checkReferences(dir, catalog); } catch (error) {
    console.error(`Could not read the references at ${dir}: ${error.message}`);
    process.exit(2);
  }
  const { problems, notes, drift, changedIds } = result;
  for (const note of notes) console.log(note);
  if (problems.length) {
    for (const problem of problems) console.error(problem);
    console.error(`Changed documents: ${changedIds.length ? changedIds.join(', ') : '(none; a header is missing or a quoted document left the catalog)'}`);
    console.error(`\n${problems.length} problem(s). Re-read the changed docs, update the references and their headers, then run this again.`);
    process.exit(1);
  }
  if (drift.length) {
    for (const line of drift) console.log(line);
    console.log(`Changed quoted documents: none (every quoted document's revision and text match)`);
    if (args.stamp) {
      const stamped = stampReferences(dir, catalog);
      console.log(`Stamped ${stamped.length} reference(s) to catalog ${catalog.revision.slice(0, 12)}: ${stamped.join(', ')}`);
    } else {
      console.log(`Notice: catalog moved to ${catalog.revision.slice(0, 12)}; no quoted document changed; re-stamp when convenient (npm run check-docs -- --stamp).`);
    }
    process.exit(0);
  }
  if (args.stamp) console.log('Nothing to stamp.');
  console.log(`All references match docs catalog ${catalog.revision.slice(0, 12)}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

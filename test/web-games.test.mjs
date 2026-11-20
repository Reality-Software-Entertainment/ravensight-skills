import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace(/\s+/g, ' ');
const DOCS = 'https://ravensight.io/docs/web-games/';

// A web game that starts the game SDK on every page counts every website
// visitor as a player. The skills that set up and audit a web game say where
// the game SDK belongs, how identify is used, and how the data quality check
// reports the mistake. Checked in both the npm skills and the Claude bundle.
for (const root of ['skills', 'plugins/ravensight/skills']) {
  test(`${root}: setup keeps the game SDK inside the game and links the web games guide`, () => {
    const text = read(`${root}/ravensight-setup/SKILL.md`);
    assert.match(text, /only inside the game/);
    assert.match(text, /website tracker/);
    assert.match(text, /`identify`/);
    assert.ok(text.includes(DOCS));
  });

  test(`${root}: the instrumentation baseline finds where a web game creates its client`, () => {
    const text = read(`${root}/ravensight-instrumentation/SKILL.md`);
    assert.match(text, /where the gameplay client is created/);
    assert.match(text, /every website visitor/);
  });

  test(`${root}: the integration reference states the whole web games rule`, () => {
    const text = read(`${root}/ravensight-instrumentation/references/ravensight.md`);
    assert.match(text, /## Web games: website visitors are not players/);
    assert.match(text, /`game_started` as soon as the client is created/);
    assert.match(text, /`destroy\(\)`/);
    assert.match(text, /`gt_pub_`/);
    assert.match(text, /`identify\(\)`[^.]*0\.12\.0/);
    assert.match(text, /`resetIdentity\(\)`/);
    assert.match(text, /random, high-entropy id/);
    assert.match(text, /never a sequential database key/);
    assert.match(text, /privacy notice/);
    assert.match(text, /`visitorSessions`/);
    assert.match(text, /3 events/);
    assert.ok(text.includes(DOCS));
  });

  test(`${root}: the website reference keeps the game client off public routes`, () => {
    const text = read(`${root}/ravensight-instrumentation/references/websites.md`);
    assert.match(text, /never create the gameplay client on a public route/);
  });
}

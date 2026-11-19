import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace(/\s+/g, ' ');

// The account server lists a studio's websites with list_sites (mcp:read,
// site:read): every website for a studio token, only its own titles for a
// project token. The skills reach it before get_site, never in place of it.
for (const root of ['skills', 'plugins/ravensight/skills']) {
  test(`${root}: website setup and reports find existing websites with list_sites first`, () => {
    for (const path of ['ravensight-setup/SKILL.md', 'ravensight-studio/SKILL.md', 'ravensight-instrumentation/references/websites.md']) {
      assert.match(read(`${root}/${path}`), /`list_sites`/, path);
    }
    assert.match(read(`${root}/ravensight-instrumentation/references/websites.md`), /`list_sites`[^.]*`site:read`/);
  });

  test(`${root}: website reports keep bot traffic apart from people`, () => {
    const text = read(`${root}/ravensight-studio/SKILL.md`);
    assert.match(text, /bot traffic/);
    assert.match(text, /not billed/);
  });

  test(`${root}: an empty game digest may mean the digest is switched off`, () => {
    assert.match(read(`${root}/ravensight-studio/SKILL.md`), /weekly digest can be switched off/);
  });
}

# Claude directory bundle

Submit this repository with plugin path `plugins/ravensight`. The directory
validates only that folder. It contains the five main skills and anonymous docs
MCP, with no npm installer, executable hooks, private app code or Playtesting.
The repository marketplace points to the same folder.

Canonical skill files remain in `skills/`; regenerate their directory copies with
`node scripts/build-claude-plugin.mjs`. The normal test suite checks exact file
parity and rejects unexpected bundle files. Listing text comes from
`docs/CLAUDE_DIRECTORY_README.md`; the icon is the existing public 512px site logo.
The directory manifest derives from `.claude-plugin/plugin.json` with public
listing links added by the generator.

This packaging change does not alter the published 0.2.2 npm tarball, its CLI,
the root OpenAI package or skill behavior. Directory validation is separate
from publisher attestation, submission, approval and publishing.

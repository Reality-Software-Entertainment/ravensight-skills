# Ravensight Skills

Public, portable agent skills for customers using [Ravensight](https://ravensight.io).
Use your own coding agent to understand and improve analytics in your game.
This repository contains customer workflows, not the Ravensight platform or its
internal development instructions.

## Available skills

| Skill | Purpose |
| --- | --- |
| [ravensight-instrumentation](skills/ravensight-instrumentation/SKILL.md) | Audit existing tracking, expand missing journey coverage, or initialize a new integration. |

The instrumentation skill covers decisions, outcomes, failures, retries, exits,
and useful context across applicable game systems. It audits existing event
choices and preserves useful tracking. Your agent performs implementation when
requested and produces an event catalog, a coverage report, and verification evidence.

## Install

With Node 20 or later, run from your game directory:

```sh
npm exec --package github:Reality-Software-Entertainment/ravensight-skills -- ravensight-skills --agent codex --project .
```

Choose one project target:

| Agent | Flag | Skill destination |
| --- | --- | --- |
| Codex | --agent codex | .agents/skills/ravensight-instrumentation/ |
| Claude Code | --agent claude | .claude/skills/ravensight-instrumentation/ |
| GitHub Copilot | --agent copilot | .github/skills/ravensight-instrumentation/ |
| Manual loading / other agents | --agent generic | skills/ravensight-instrumentation/ |

The command downloads and runs this repository's installer. For reproducible
installation, append `#<commit-sha>` to the GitHub package specifier. No npm registry
publication is required. The current installer installs the instrumentation skill.

To inspect the code first or work without a package runner:

```sh
git clone https://github.com/Reality-Software-Entertainment/ravensight-skills.git
cd ravensight-skills
node bin/install.mjs --agent codex --project /path/to/your/game --dry-run
node bin/install.mjs --agent codex --project /path/to/your/game
```

Without Node, copy the entire `skills/ravensight-instrumentation/` folder into the
chosen agent's skill directory. Keep its references and metadata alongside SKILL.md.
Reload skills or restart the agent if needed. Do not install multiple copies for
the same agent. No edits to existing project instructions are required.

The installer only writes skill files. It does not change game code, configure an
account, or contact Ravensight. Identical installs are a no-op. Different existing
content and symlink destinations are refused. To update, preserve local edits,
remove the old skill folder yourself, and reinstall. To uninstall, remove that folder.

## Use it

Audit only:

> Use ravensight-instrumentation to audit our existing tracking across the whole
> player journey. Report missing, duplicate, or misleading events with source
> locations. Do not edit application code.

Expand an existing game:

> Use ravensight-instrumentation to audit and expand our tracking. Be comprehensive
> across meaningful journeys, decisions, failures, retries, and exits. Preserve
> useful events, implement gaps, validate changes, and update the event catalog.

Initialize:

> Use ravensight-instrumentation to integrate Ravensight and instrument this game.
> Inspect the engine and SDK before choosing calls.

Limit work to a selection or subsystem:

> Use ravensight-instrumentation to audit and improve tracking in inventory and
> crafting. Follow callers and outcomes as needed, but keep edits in this scope.

Codex supports `$ravensight-instrumentation`; Claude Code supports
`/ravensight-instrumentation`. For Copilot, ask it to use the skill by name.
Paths follow official documentation checked October 6, 2026:
[Codex](https://learn.chatgpt.com/docs/build-skills),
[Claude Code](https://code.claude.com/docs/en/skills), and
[Copilot](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills).
Packaging tests do not establish end-to-end behavior in every agent client.

## ChatGPT and other agents

If your client does not discover local skills, supply SKILL.md and its references
and explicitly ask it to follow the workflow. Provide the relevant source or a
supported repository connection. Analysis can work on supplied files; implementation
requires editing tools. This repository does not install a ChatGPT connector or
grant repository access. Verify the client's current skill-loading support.

## Requirements and costs

Local source is enough to audit and implement. The skill routes to the relevant
Ravensight SDK documentation and can use an existing authorized MCP connection
for live evidence. MCP is optional and metered; your agent provider may charge for
its own work. Added tracking can increase event usage. The skill does not require
source uploads, paid scans, production traffic, or deployments.

## Develop and package

```sh
npm test
npm run build
```

No dependency installation is required. Tests exercise each install target,
repeated installs, preservation of customer edits, unsafe destinations, and a clean
offline install from the generated npm tarball. The build writes
`dist/ravensight-skills-0.1.0.tgz` and a SHA-256 sidecar. A release can distribute those
files; npm registry publication is separate. Do not replace a published version
with different bytes. Bump the version for a release that changes the package.

Add future customer-facing workflows under `skills/<skill-name>/`. Keep the
installer's supported choices and tests aligned with the published catalog.
Do not add private platform files, credentials, or internal operational guidance.

Licensed under [MIT](LICENSE).

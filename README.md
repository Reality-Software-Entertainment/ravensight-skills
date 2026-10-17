# Ravensight Skills

Public, portable agent skills for customers using [Ravensight](https://ravensight.io).
Use your own coding agent to understand and improve analytics in your game.
This repository contains customer workflows, not the Ravensight platform or its
internal development instructions.

## Main Ravensight pack (release preparation)

This checkout prepares `0.2.0-next.0`. It has not been published. The existing
0.1.12 typed-event work is preserved; reconcile its product branches before release.
See [the release and marketplace guide](docs/RELEASE.md).

Install all five skills locally from this checkout:

```sh
node bin/install.mjs --agent codex --project /path/to/game --skill all
```

Use `--agent claude`, `copilot` or `generic` for another client. Use `--skill
ravensight-connect` (or another full name) for one skill. Without `--skill`, the
installer still installs instrumentation only, preserving the existing command.
`--skill all --dry-run` previews every destination. Multi-skill installs preflight
all destinations before writing; each replacement has its own rollback. If an
IO error interrupts a later skill, completed skills remain installed; fix the
reported issue and rerun to finish. Identical skills are skipped.

| Skill | When the agent loads it |
| --- | --- |
| `ravensight` | Broad requests, choosing the next workflow and carrying context forward |
| `ravensight-setup` | Account, project/environment, SDK and first-event setup |
| `ravensight-connect` | Public docs MCP or authenticated studio MCP setup and troubleshooting |
| `ravensight-studio` | Analytics, design, brainstorms, memory, marketing, Pulse, sales and publishers |
| `ravensight-instrumentation` | Detailed event implementation and coverage audits |

Skills route by need. They do not run an autonomous pipeline, require subagents,
or load every reference up front. A focused skill can be used by itself; missing
siblings fall back to public documentation. No Playtest skills, runners, browsers
or Playtest authentication are installed by this pack.

## Claude plugin

For local validation and use, from the repository root:

```sh
claude plugin validate .claude-plugin/plugin.json --strict
claude --plugin-dir .
```

After the release hold is cleared and this branch is published, customers can use:

```text
/plugin install ravensight --marketplace Reality-Software-Entertainment/ravensight-skills
```

On older clients, add that repository with `/plugin marketplace add` and install
`ravensight@ravensight`. Invoke the main skill as `/ravensight:ravensight`, or use
the exact qualified name shown by the client. Do not install standalone copies
and the plugin in the same client unless you remove the duplicates.

## OpenAI plugin

The root `plugin.json` is the portable manifest, with OpenAI presentation and
onboarding metadata. `mcp.json` includes the free, unauthenticated docs endpoint.
The repository marketplace at `.agents/plugins/marketplace.json` supports local
preparation; follow the current client workflow described in the release guide.
The standalone installer above is also usable without a plugin host.

The Claude `.mcp.json` uses that client's HTTP transport spelling. Both packages
connect documentation only. The account MCP requires a separately configured
personal token and metered-access authorization. This package neither grants
account access nor implements OAuth. Official directory review and client end-to-end
verification are separate from local manifest validation.

## Existing instrumentation skill

| Skill | Purpose |
| --- | --- |
| [ravensight-instrumentation](skills/ravensight-instrumentation/SKILL.md) | Audit existing tracking, expand missing journey coverage, or initialize a new integration. |

The instrumentation skill covers decisions, outcomes, failures, retries, exits,
and useful context across applicable game systems. It audits existing event
choices and preserves useful tracking. It starts by writing an acceptance matrix
of the player questions the data must answer (how long, how deep, which choice and
what it caused, what was unlocked or earned, why players leave, retries, and your
own), then judges the work against it. Your agent performs implementation when
requested and produces an event catalog, a coverage report, and a completion
report with three separate verdicts: delivery, schema and coverage.

## Install

With Node 20 or later, run from your game directory:

```sh
npx ravensight-skills --agent codex --project .
```

Choose one project target:

| Agent | Flag | Skill destination |
| --- | --- | --- |
| Codex | --agent codex | .agents/skills/ravensight-instrumentation/ |
| Claude Code | --agent claude | .claude/skills/ravensight-instrumentation/ |
| GitHub Copilot | --agent copilot | .github/skills/ravensight-instrumentation/ |
| Manual loading / other agents | --agent generic | skills/ravensight-instrumentation/ |

The command downloads and runs the published npm installer. For reproducible
installation, use `npx ravensight-skills@<published-version>`. The main pack is
prepared locally and must be published before customers use its new selectors.
Without --skill the installer installs the instrumentation skill.

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
content and symlink destinations are refused. To update, rerun the same command
with `--force`: the old folder is copied to
`~/.ravensight/skills-backup/<project>-<hash>/ravensight-instrumentation.bak-<timestamp>/`,
outside your repository, so nothing new appears in git and no agent sees a duplicate skill. The copy is
verified before the original is removed, and the new copy is installed, so local edits stay in the
backup. The installer prints the backup path. If the install fails partway, your previous copy is restored.
Use `--backup-dir PATH` to keep backups somewhere else, or `--no-backup` to replace without keeping one
(the installer says so when it does). Neither option is accepted without `--force`. A backup folder that is itself a symbolic link, or that is
the skills folder or inside the skill, is refused. Backups made by 0.1.7 and earlier stay in
`<project>/.ravensight-skills-backup/`; delete that folder when you no longer need it. To uninstall, remove the installed skill folder from your agent's skills directory.

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

## Optional documentation connection

Connect the free public documentation MCP at `https://docs-mcp.ravensight.io/mcp`
using remote HTTP and no authentication. [Client setup](https://ravensight.io/docs/#docs-mcp).
The skill can then use `search_docs` and `get_doc` for current guidance, source links,
and revisions. This is separate from the paid analytics MCP; it has no studio or
player data access. The installer does not configure MCP, and ordinary docs links
remain the fallback when no connection is available.

## Requirements and costs

Local source is enough to audit and implement. The skill routes to the relevant
Ravensight SDK documentation and can use an existing authorized MCP connection
for live evidence. Analytics MCP is optional and metered; your agent provider may charge for
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
`dist/ravensight-skills-<version>.tgz` and a SHA-256 sidecar. A release can distribute those
files; npm registry publication is separate. Do not replace a published version
with different bytes. Bump the version for a release that changes the package.

A `vX.Y.Z` tag that equals the package version runs `.github/workflows/publish.yml`,
which publishes through npm trusted publishing (OIDC), with no token. That job is
skipped until the owner, on npmjs.com, opens package `ravensight-skills`, Settings,
Trusted publishing, adds GitHub Actions for
`Reality-Software-Entertainment/ravensight-skills` with workflow file `publish.yml`,
and then sets the repository variable `NPM_TRUSTED_PUBLISHING` to `true`.

Each reference records the public docs catalog revision and the date it was
checked against. As of 0.1.11 the SDK needs only the ingest key at initialization (game ids are a
release audit, checked free with doctor `--live`), and the native section says an
app's own `systemUptime` use needs the app's own privacy manifest declaration. Since
0.1.10 it separates iOS 0.3 and later (`deviceId` is always durable,
`playtestDeviceId` holds `pt-<run>`) from the older SDKs, where `deviceId` reads
`pt-<run>` during a playtest. Before a release, check them against the live docs:

```sh
npm run check-docs
```

It fetches `https://www.ravensight.io/docs/catalog.json` and sorts drift into two
classes. If the catalog moved but every quoted document's revision and text still
match, it exits 0 with the notice "catalog moved to <rev>; no quoted document
changed; re-stamp when convenient". If a quoted document's revision or text
changed, or a quote no longer matches word for word, it exits 1 and lists the
changed document ids (exit 2 if the catalog cannot be read). `--stamp` rewrites
every reference header to the current catalog revision and today's date, and only
when nothing quoted changed; it never touches the quoted-document revisions.
`--catalog PATH` checks a saved copy. It needs network access, so it is a manual
step and never part of `npm test`. On exit 1, re-read the changed docs, update the
references, then update every header to the new revision and date.

Add future customer-facing workflows under `skills/<skill-name>/`. Keep the
installer's supported choices and tests aligned with the published catalog.
Do not add private platform files, credentials, or internal operational guidance.

Licensed under [MIT](LICENSE).

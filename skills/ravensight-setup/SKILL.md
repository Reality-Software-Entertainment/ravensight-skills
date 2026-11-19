---
name: ravensight-setup
description: Guide Ravensight account, game project/environment or company/Game Website setup, choose the appropriate SDK, and verify an initial integration. Use for first-time setup or missing integration prerequisites; detailed coverage audits belong to ravensight-instrumentation.
metadata:
  version: "0.2.6"
---

# Set up Ravensight

First distinguish gameplay from public website tracking. For gameplay, establish the engine/runtime and existing SDK first. Reuse working setup. Ask only for missing choices that affect the task, especially the studio, project and environment. A project represents a title; environments have separate game identifiers, keys and event streams. Prefer development for verification.

## Website setup

A company may have one Company Website and each game title one Game Website, shared across that title's environments. Reuse the existing title; never create a fake game for the company or treat the selected gameplay environment as a website scope. A separate `gt_site_` public website key does not replace a game ingest key or authenticate account MCP.

Read [Website analytics](https://ravensight.io/docs/#websites). Discover the account server's current tools before using them. Where available, `list_sites` lists the websites the token can see, and `get_site` reads the chosen scope; `create_site` creates missing configuration disabled by default; `get_site_installation` returns its public key/snippet; `update_site` enables the authorized setup; `verify_site` checks real accepted traffic without manufacturing an event. Use the exact returned schemas. `project_id` is a title slug; omit it for company scope only with a studio-wide token. Project-restricted tokens must name an allowed title. Setup/installation require website write permission and an owner-enabled write token; ordinary reports require website read permission. Public docs remain free and need no token.

Install in the requested repository through its existing release process. Configure the exact origins that serve the site, including apex and www when applicable. Preserve consent, DNT/GPC, private-route exclusions and existing gameplay telemetry. Enable heatmaps only within the authorized public scope. No screenshot upload is needed to collect clicks/scroll or read the normalized density view. SDK methods and advertised server capabilities are authoritative; absent tools do not mean permission to create another account, bypass scope or claim delivery.

For implementation or replacing another analytics provider, use `ravensight-instrumentation` and its website reference if installed; otherwise continue from the public website and JavaScript SDK docs. Check event/property/outcome parity before removing the old integration. A website request does not require the game onboarding steps below.

## Gameplay setup

For documentation lookup, discover the actual tools and their schemas. Search once for the engine, then fetch a returned document ID. Do not invent section filters, IDs, server names or limits. If the hosted catalog has no dedicated engine guide, read its platform-support entry and follow the SDK repository link it actually returns. State that the detailed guide came from the repository. Do not repeatedly read the full catalog looking for a missing section. Public documentation does not require an account or paid access.

1. Direct the user to https://app.ravensight.io/ to sign in or create their account. Let them complete password, MFA and consent steps in the supported UI. Do not collect a password in chat or borrow Playtest's CLI token.
2. In Settings > Projects, choose or create the intended project and environment within the user's request. Confirm the environment before selecting keys. Consult https://ravensight.io/docs/#projects and #quickstart.
3. Choose the SDK from https://ravensight.io/docs/#platform-support. Godot, JavaScript, Unity, Unreal, C++, Odin, LÖVE, iOS and Android have SDKs; plain HTTP is also available. Check current support and installation instructions rather than claiming identical maturity. For JavaScript the SDK package is `ravensight`, not this skills package. Read package scripts before running installation in an unfamiliar project.
4. Read https://ravensight.io/docs/#public-builds before choosing a client key. Public clients and open-source distributions need the appropriate restricted public ingest policy. Origin/version allowlists are limits, not proof that a client is trustworthy. Never embed MCP, CLI, account or store credentials in a game. Guide the user to enter key material through the appropriate local configuration or supported UI without printing it in chat, logs or commits. An ingest credential is not an MCP credential.
5. Use the installed SDK's API and current docs. Preserve collection controls and player opt-out. Configure only the intended environment; avoid duplicate init, duplicate tracking and invented method names. Inspect existing conventions before editing. For event design or broader code changes, continue with `ravensight-instrumentation` if installed.
6. Read https://ravensight.io/docs/#doctor. Ravensight Doctor is the developer's to run; do not run it yourself. Give the developer the command, for example `npx --yes ravensight-doctor --json` from the project root (`npx ravensight-doctor --help` lists the flags their version supports), and say what it checks: it downloads and runs the doctor on their machine, reads the source tree for the SDK, key placement and track calls, and reports findings with a status. `--live` sends one test event with their development key and reads it back; `--report` uploads the result to their dashboard and needs their authorization. Then interpret the result the developer shares: explain each finding, its fix and what the check did not prove. A static check is not proof of event delivery. An authorized development live check and read-back can verify delivery; do not generate production player traffic merely to test setup. Record environment, check performed and actual result without exposing keys.

If the user only wants an account or MCP connection, stop at that outcome; do not insist on instrumenting a game. Account MCP is optional for local setup. For that connection use `ravensight-connect` if installed. No Playtest installation, source scan, paid run or deployment is implied by setup.

Report delivery, schema and coverage separately when relevant. A first event proves a connection, not full analytics coverage. Link the dashboard and relevant docs for any manual step still needed.

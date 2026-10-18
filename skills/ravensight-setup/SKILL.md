---
name: ravensight-setup
description: Guide Ravensight account, project and environment setup, choose and configure the engine SDK, and verify an initial integration. Use for first-time setup or missing integration prerequisites; detailed coverage audits belong to ravensight-instrumentation.
metadata:
  version: "0.2.0"
---

# Set up Ravensight

Establish the engine/runtime and existing SDK first. Reuse working setup. Ask only for missing choices that affect the task, especially the studio, project and environment. A project represents a title; environments have separate game identifiers, keys and event streams. Prefer development for verification.

For documentation lookup, discover the actual tools and their schemas. Search once for the engine, then fetch a returned document ID. Do not invent section filters, IDs, server names or limits. If the hosted catalog has no dedicated engine guide, read its platform-support entry and follow the SDK repository link it actually returns. State that the detailed guide came from the repository. Do not repeatedly read the full catalog looking for a missing section. Public documentation does not require an account or paid access.

1. Direct the user to https://app.ravensight.io/ to sign in or create their account. Let them complete password, MFA and consent steps in the supported UI. Do not collect a password in chat or borrow Playtest's CLI token.
2. In Settings > Projects, choose or create the intended project and environment within the user's request. Confirm the environment before selecting keys. Consult https://ravensight.io/docs/#projects and #quickstart.
3. Choose the SDK from https://ravensight.io/docs/#platform-support. Godot, JavaScript, Unity, Unreal, C++, Odin, LÖVE, iOS and Android have SDKs; plain HTTP is also available. Check current support and installation instructions rather than claiming identical maturity. For JavaScript the SDK package is `ravensight`, not this skills package. Read package scripts before running installation in an unfamiliar project.
4. Read https://ravensight.io/docs/#public-builds before choosing a client key. Public clients and open-source distributions need the appropriate restricted public ingest policy. Origin/version allowlists are limits, not proof that a client is trustworthy. Never embed MCP, CLI, account or store credentials in a game. Guide the user to enter key material through the appropriate local configuration or supported UI without printing it in chat, logs or commits. An ingest credential is not an MCP credential.
5. Use the installed SDK's API and current docs. Preserve collection controls and player opt-out. Configure only the intended environment; avoid duplicate init, duplicate tracking and invented method names. Inspect existing conventions before editing. For event design or broader code changes, continue with `ravensight-instrumentation` if installed.
6. Read https://ravensight.io/docs/#doctor. Use `npx ravensight-doctor --help` to confirm supported flags before a check. A static check is not proof of event delivery. An authorized development live check and read-back can verify delivery; do not generate production player traffic merely to test setup. Record environment, check performed and actual result without exposing keys.

If the user only wants an account or MCP connection, stop at that outcome; do not insist on instrumenting a game. Account MCP is optional for local setup. For that connection use `ravensight-connect` if installed. No Playtest installation, source scan, paid run or deployment is implied by setup.

Report delivery, schema and coverage separately when relevant. A first event proves a connection, not full analytics coverage. Link the dashboard and relevant docs for any manual step still needed.

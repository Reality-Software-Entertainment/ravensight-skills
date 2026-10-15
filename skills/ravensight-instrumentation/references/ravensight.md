# Ravensight integration reference

> Docs catalog revision: `21b5d2f1e4fd4ed504191b8e8ec1a8e435ea8e46e3d5c3a632e95d5b56d2f499`, checked 2026-10-15 against https://www.ravensight.io/docs/catalog.json.

Verify against the installed SDK and current [integration docs](https://ravensight.io/docs/).
This pack is a workflow, not an SDK implementation. Keep integrations compatible
with the customer's actual version; do not invent methods for engines you cannot inspect.

## Optional public documentation MCP

Endpoint: https://docs-mcp.ravensight.io/mcp (remote HTTP, no authentication).
Setup: https://ravensight.io/docs/#docs-mcp. If connected, search only documentation
questions with `search_docs`, then use returned IDs in `get_doc`. Follow
`next_offset` with the returned document revision for long records. Check `stale`
and cite the source URL. If unavailable, use the ordinary integration docs links.
Do not send private source, credentials, or player data as search queries.

This documentation service is free and reads only published documentation. It is
separate from the authenticated, metered analytics MCP described below. A docs
answer is not evidence that a customer's event was actually received.

## Engine routing

Official SDK repositories live under https://github.com/Reality-Software-Entertainment/.
Read only the relevant SDK's README and implementation:

| Runtime | Repository | First places to inspect in the customer's project |
| --- | --- | --- |
| Godot | ravensight-godot | project.godot autoloads, addons, Ravensight.gd, signal wiring |
| Browser / Node | ravensight-js | package manifest and lockfile, client initialization, wrappers, server handlers |
| Unity | ravensight-unity | packages, persistent service object, scenes, event subscriptions |
| Unreal | ravensight-unreal | plugins, subsystem/module lifetime, Blueprint and C++ hooks |
| C++ | ravensight-cpp | build dependency, client lifetime, authoritative gameplay transitions |
| Odin | ravensight-odin | imports, client setup, loop lifecycle and shutdown |
| iOS | ravensight-ios | dependency/version, app/scene lifecycle, background handling |
| Android | ravensight-android | Gradle dependency, application/activity lifecycle, background handling |

When no compatible SDK exists, consult the documented HTTP protocol. Do not
hand-roll a transport before checking SDK availability and the project's wrapper.

The Godot SDK included with the platform exposes:

```gdscript
Ravensight.track_event("level_completed", {
    "level": "level_03",
    "attempt_id": attempt_id,
    "elapsed_ms": elapsed_ms,
    "deaths": deaths_this_attempt
})
```

Use it where completion is committed, with real locally available values.
The SDK handles session creation and queues events before readiness. It already
queues game_started during startup after its settings check, then sends it once
the session is ready. It emits game_exited during orderly shutdown;
check the installed version before adding lifecycle calls. flush() requests an
attempt; it does not guarantee delivery after the process has exited.

## Native and mobile SDKs

These semantics were checked against the iOS and Android SDKs. Read the installed
SDK's README for exact names and confirm the same behavior before relying on it in
another native SDK; these semantics decide where code goes.

- **A playtest identity is never durable.** In a Ravensight Playtest run the SDK
  takes its token and run id from the launch environment (iOS), intent extras
  (Android) or environment variables (desktop). On iOS the device id is then
  `pt-<runId>`, held in memory only: the saved id is never read or written. Do
  not copy the SDK's device id, or any id derived from it, into the game's save
  file, preferences, keychain or cloud save, because in a persona run that would
  mirror a synthetic id into storage a real player later inherits. Mint the game's
  own `run_id` or `attempt_id` separately. Leave the playtest token and run id
  unset in a build for real players.
- **Two privacy controls, not one.** The player opt-out (iOS
  `Ravensight.setTrackingEnabled(false)`, Android
  `Ravensight.setTrackingEnabled(context, false)`) is the player's choice: it is
  saved, survives a restart, drops the queue and makes no request of any kind, not
  even the startup check. The runtime stop-all switch (on iOS 0.2
  this is `RavensightConfiguration.enabled` or `Ravensight.shared?.setEnabled(_:)`;
  0.3 adds `stopAllTelemetry()`) stops everything for this run and is never saved; use it for a debug build or a region
  where the game sends nothing. Wire a settings toggle to the opt-out, not to the
  runtime switch, and never let the runtime switch's `true` override a saved
  opt-out. The reset (`resetDeviceId()`) is a third, separate call that starts a
  fresh identity. In a playtest run the saved opt-out is ignored and the opt-out
  and reset calls only log a line.
- **Lifecycle is part of the matrix.** Backgrounding, a swipe away and a cold
  relaunch are the exits a mobile player actually takes; test each against the
  acceptance matrix's run join. Exit events are not guaranteed on a kill.
- **Preflight a native persona run before any paid job.** Native playtest adapters
  are experimental until tested against the build and device. Run the free
  `ravensight-playtest check` first, confirm the automation server, simulator or
  device and the build launch, and confirm one local launch reports a playtest
  session, before suggesting `ravensight-playtest run`, which charges. Do not
  start a paid job without the user's authorization.

## Payload and analytics contract

- The HTTP event envelope uses event, data, and optionally timestamp. Inspect
  current docs for timestamp units and the installed SDK's public signature.
- Use the publishable ingest key for the chosen game/environment. Account/MCP
  tokens and provider credentials never belong in shipped game code.
- Event names have a 200-character ceiling; event data has an 8 KB ceiling and
  batches have at most 50 events in the documented protocol. Verify current
  limits before sizing changes. Keep payloads well below ceilings.
- Property breakdowns use top-level payload keys. Prefer bounded flat properties
  for dimensions that customers will group or filter on.
- Built-in detections read an event's `rs_kind` first, before its name. Read it
  first when you classify an event. Its values are `level_start`, `level_complete`,
  `death` and `none`; an unknown value falls through to the name match. `none` opts
  an event out of the built-in detections, so set `rs_kind` instead of renaming an
  event to dodge a heuristic: a rename breaks funnels and history, `rs_kind` does
  not. Keys starting with `rs_` are reserved.
- `level`, `location` and `track` in event data fold into one place column, taking
  the first non-empty value in that order. Only progression events should carry a
  place; put other context under a different key. Review unrelated events for
  accidental classification before broadening tracking.
- The death, rage quit and stuck rules, word for word from the public docs (see
  the header for the revision). Re-check them with `get_doc`, or with
  `scripts/check-docs.mjs` from the ravensight-skills repository, before relying
  on a threshold. When either reports drift, re-fetch the changed doc with
  `get_doc` or the docs links, re-quote it here, re-stamp every reference header
  with the new catalog revision and date, and re-run `check-docs`.

Quoted from `dashboard/how-the-built-in-detections-read-your-events` at revision `537ff17f016de8f32d97b978259bdbf34d38425aaaa2bd60be360aa3d9c8c27c`:

> - **Deaths** are events whose name contains `died`, `destroyed`, or `killed` (lowercase substring match, so `player_died` and `ship_destroyed` both count).
> - **An explicit `rs_kind` comes first.** Set `rs_kind` in the event data to `level_start`, `level_complete`, `death`, or `none` and the level funnel, per-level deaths, journeys and the death count read it before the name. `none` opts an event out, so `checkout_started` with `rs_kind: "none"` is not a level start. An unknown value falls through to the name match. Keys that start with `rs_` are reserved for Ravensight. The rage quit rules below read it too.
> - **Rage quit likely** flags a session with 3 or more deaths in its last 5 events, 3 or more deaths at the same level, or a final death followed by more than 10 minutes of silence inside the queried window. A death here is an event sent with `rs_kind: "death"`, whatever its name, so a `run_ended` event with `rs_kind: "death"` counts. Without a known `rs_kind`, the first two read `died`/`destroyed` names and the last reads a name containing `died`; `rs_kind: "none"` is never a death.
> - **Potentially stuck** flags a session that repeats one event 10 or more times at the same level while the whole session has fewer than 20 events. The same event at a new level each time is movement, not stuck. Events with no place are grouped together, so ten repeats of a placeless event in a short session count; send a place or accept it.

- Retain existing event contracts and funnels. Custom names can serve custom
  funnels; adding aliases solely to match built-in rules can double-count.
- Use SDK-supported playtest context where relevant. Do not spoof synthetic tags
  or assume a payload flag alone creates an authenticated synthetic session.
- Honor the existing collection controls and disabled-tracking behavior. SDK
  buffering is bounded; neither offline delivery nor final exit is guaranteed.

## Optional live evidence

Local source work requires neither MCP nor a paid scan. Use an existing authorized
connection if the user has asked to consult Ravensight data. First inspect the
available tool schemas; tool exposure and permissions can vary.

1. get_usage_rate exposes current MCP metering and limits. Use existing user
   authorization and budgets; do not silently start a paid source scan.
2. list_games resolves the exact game/environment. Do not guess production versus
   development from a title. If ambiguous, continue local work while clarifying.
3. get_code_brief provides stored scan findings, if any. Treat them as possibly
   stale clues and verify against current source.
4. Use get_overview, get_funnel, get_property_breakdown, or a bounded read-only
   run_sql query only as needed to check named events in a stated time window.
   An overview's top events are not an exhaustive event inventory.
5. Record environment, time window, build where known, and evidence source.
   No observed event can mean no traffic, an old build, disabled tracking, sampling,
   wrong environment, or an unexercised path. A matching name alone does not prove
   the correct trigger or payload. Do not call either case verified coverage.

Avoid repeated unbounded queries. Analytics MCP is metered separately from the customer's
agent/model usage. Source scans propose findings; the local coding agent performs
code edits. Neither MCP access nor this skill grants deployment permission.

## Doctor

If the project already has ravensight-doctor, use its local documented JSON command
for a static check. If installing it is in scope, the public docs specify:

```sh
npx --yes ravensight-doctor --json
```

This command downloads and executes code. Prefer the project's pinned version when
available. Run without --report for a local check; --report uploads results and
requires authorization and configured credentials. Doctor complements source and
runtime review; it does not establish complete journey coverage. A green (`pass`)
doctor result is a static integration check of the source tree, never a
certificate for the whole product: it says nothing about whether the acceptance
matrix's questions are answerable. `--live` proves that one test event can be
delivered and stored with the key, not that the game's own events are.

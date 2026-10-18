# Ravensight integration reference

> Docs catalog revision: `3f8194933b66bde4bb228bee65f0db321482a40c8ffa6fec5f568e685be84b6b`, checked 2026-10-18 against https://www.ravensight.io/docs/catalog.json.

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
  (Android) or environment variables (desktop). The synthetic id is `pt-<runId>`,
  held in memory only, and the rules differ by SDK generation:
  - **iOS 0.3 and later:** `Ravensight.deviceId` is always the durable id (empty on
    an install that has never run a normal session) and is safe to mirror.
    `Ravensight.playtestDeviceId` holds `pt-<runId>`, and `Ravensight.isSynthetic`
    says whether this run is a playtest. `deviceId` never returns a synthetic id.
  - **iOS 0.2 and every other SDK (Android, desktop, the engine SDKs):** `deviceId`
    reads `pt-<runId>` during a playtest, and `resetDeviceId()` is a no-op that
    logs a line. Never mirror `deviceId` into durable storage while `isSynthetic`
    is true, and treat any id derived from it the same way.
  - **Every SDK:** do not copy the SDK's device id, or any id derived from it, into
    the game's save file, preferences, keychain or cloud save on an SDK that can
    return a synthetic id, because in a persona run that would mirror a synthetic
    id into storage a real player later inherits. Mint the game's own `run_id` or
    `attempt_id` separately. Leave the playtest token and run id unset in a build
    for real players.
- **Two privacy controls, not one.** The player opt-out (iOS
  `Ravensight.setTrackingEnabled(false)`, Android
  `Ravensight.setTrackingEnabled(context, false)`) is the player's choice: it is
  saved, survives a restart, drops the queue and makes no request of any kind, not
  even the startup check. The runtime stop-all switch (on iOS 0.2
  this is `RavensightConfiguration.enabled` or `Ravensight.shared?.setEnabled(_:)`;
  0.3 adds `stopAllTelemetry()` and `resumeTelemetry()`) stops everything for this
  run and is never saved; use it for a debug build or a region where the game
  sends nothing. Wire a settings toggle to the opt-out, not to the runtime switch,
  and never let the runtime switch's `true` override a saved opt-out. The reset
  (`resetDeviceId()`) is a third, separate call that starts a fresh identity. In a
  playtest run it differs by SDK:
  - **iOS 0.3 and later:** the saved opt-out is ignored (one console line) and the
    run carries on, but `stopAllTelemetry()` does stop a synthetic run, so call it
    when a playtest build must go quiet. `resetDeviceId()` during a playtest mints
    and saves a new durable id for the next normal launch, deletes the old
    identity's persisted queue file and returns the new id; the run keeps sending
    as `pt-<runId>`.
  - **Other SDKs and iOS 0.2:** the saved opt-out is ignored and the opt-out and
    reset calls only log a line. Do not rely on either to quiet or re-identify a
    playtest run.
- **The persisted queue is opt-in, and never synthetic.** On iOS 0.3 and later
  `persistQueue` defaults to false; when on, it keeps at most 500 events in a file
  under Application Support so they survive a force quit, and writes are coalesced
  over a quarter of a second, so the last events before a kill can be lost. A
  synthetic run never reads or writes it, and `stopAllTelemetry()`, an opt-out and
  `resetDeviceId()` delete the file. Do not assume other SDKs persist anything;
  read their README. iOS 0.3.1 also fixes a flaky coalescing test in the SDK's own
  suite; no library behaviour changed, so nothing in the game needs to change.
- **Required-reason APIs in the app need the app's own privacy manifest.** An app
  that reads `systemUptime` (or another required-reason API) for its own timing must
  declare that reason in its own privacy manifest. The SDK's manifest covers the
  SDK's use only, never the app's. Transmit elapsed in-app intervals (durations the
  game computed), never raw uptime values.
- **Lifecycle is part of the matrix.** Backgrounding, a swipe away and a cold
  relaunch are the exits a mobile player actually takes; test each against the
  acceptance matrix's run join. Exit events are not guaranteed on a kill.
- **Preflight a native persona run before any paid job.** Native playtest adapters
  are experimental until tested against the build and device. Run the free
  `ravensight-playtest check` first, confirm the automation server, simulator or
  device and the build launch, and confirm one local launch reports a playtest
  session, before suggesting `ravensight-playtest run`, which charges. Do not
  start a paid job without the user's authorization.

## Typed event helpers

Before using this section, verify both the installed SDK and the deployed server's
current documentation support typed events. SDK availability alone is insufficient.
If accept-and-flag ingest or the typed analytics pages are absent from the deployed
contract, do not claim they are available or migrate tracking to depend on them.
Keep the existing supported event contract and report the release dependency.


Typed helpers are a thin layer over each SDK's generic track call: they build the
property set and queue the event through the same queue, batching, retries,
opt-out and playtest path. Use them for real-money purchases, resource flows,
progression steps and errors instead of hand-writing `rs_*` keys. They need an SDK
build that actually ships them. Public-build and typed-event development branches
used overlapping version numbers, so a version number alone proves nothing.
Inspect the installed method and its README, then verify deployed ingest support.
Do not emit the reserved keys below through a generic call as a workaround when
that server support is absent. Each helper takes an optional extra properties map
(the reserved keys win over it) and an optional event name override; keep the
default names unless the game already has a contract.

One example per helper, per engine (read the installed README for exact parameter
order and optional arguments):

| Runtime | Purchase, resource, progression, error |
| --- | --- |
| Godot | `Ravensight.track_purchase("iap", "gem_pack_small", 499, "usd")`, `Ravensight.track_resource("sink", "gold", 10)`, `Ravensight.track_progression("complete", "world1", {"p2": "level3"})`, `Ravensight.track_error("error", "save failed")` |
| Browser / Node | `rs.trackPurchase({ amount: 499, currency: 'usd', itemType: 'bundle', itemId: 'starter' })`, `rs.trackResource({ flow: 'source', resource: 'gold', amount: 50 })`, `rs.trackProgression({ status: 'complete', p1: 'world1', p2: 'level3' })`, `rs.trackError({ severity: 'error', message: err.message, stack: err.stack })` |
| LÖVE | `ravensight.purchase(499, "usd", "bundle", "starter_pack")`, `ravensight.resource("sink", "gold", 40)`, `ravensight.progression("complete", "world1", { p2 = "level3" })`, `ravensight.error("critical", "save file would not load", { stack = debug.traceback() })` |
| Unity | `Ravensight.TrackPurchase(499, "usd", "gem_pack", "gems_100")`, `Ravensight.TrackResource(RavensightTyped.Source, "gold", 250)`, `Ravensight.TrackProgression(RavensightTyped.Complete, "world1", "level2")`, `Ravensight.TrackError(RavensightTyped.Error, ex.Message, ex.StackTrace)` |
| Unreal | `Ravensight->TrackPurchase(499, TEXT("usd"), TEXT("gem_pack"), TEXT("gems_500"), ...)`, `Ravensight->TrackResource(TEXT("source"), TEXT("gold"), 120.0, ...)`, `Ravensight->TrackProgression(TEXT("complete"), TEXT("world1"), TEXT("level2"), ...)`, `Ravensight->TrackError(TEXT("warning"), TEXT("pool over budget"), ...)` |
| C++ | `client.track_purchase(499, "usd", "pack", "gems_500")`, `client.track_resource("sink", "gold", 120.0)`, `client.track_progression("complete", "world1", "level3")`, `client.track_error("error", "save file unreadable", "at load_save()")` |
| Odin | `rs.track_purchase(client, 499, "usd", "bundle", "starter")`, `rs.track_resource(client, rs.FLOW_SINK, "gold", 10)`, `rs.track_progression(client, rs.STATUS_COMPLETE, "world1", "level3")`, `rs.track_error(client, rs.SEVERITY_ERROR, "save failed")` |
| iOS | `Ravensight.trackPurchase(amount: 499, currency: "usd", itemType: "gems", itemId: "pack_small")`, `Ravensight.trackResource(flow: "sink", resource: "gold", amount: 250)`, `Ravensight.trackProgression(status: "complete", p1: "world1", p2: "level3")`, `Ravensight.trackError(severity: "error", message: "save failed")` |
| Android | `Ravensight.trackPurchase(499, "usd", "bundle", "starter_pack")`, `Ravensight.trackResource("source", "gold", 25)`, `Ravensight.trackProgression("complete", "world1", "cave")`, `Ravensight.trackError("error", "save failed")` |

Unreal also has `TrackPurchaseText` for an amount held as a string of digits. The
doctor (0.4.3 and later) recognises every spelling above, and Godot's
`Ravensight.track_event(` and Unreal's `->TrackEvent(`, as track calls and reads
each helper's default event name, so these calls count in its inventory.

Reserved keys the helpers set. Keys starting with `rs_` are reserved: never reuse
one for the game's own data, and do not pass `rs_kind` in the extra properties.

- Purchase: `rs_kind="purchase"`, `rs_amount`, `rs_currency` (three letters, upper
  cased by the helper), `rs_item_type`, `rs_item_id`, optional `rs_cart` and
  `rs_transaction_id`. Default event name `purchase`.
- Resource: `rs_kind="resource"`, `rs_flow` (`source` or `sink`), `rs_resource`,
  `rs_amount`, optional `rs_item_type` and `rs_item_id`. Default event name
  `resource_source` or `resource_sink`.
- Progression: `rs_kind="progression"`, `rs_status` (`start`, `complete`, `fail`),
  `rs_p1`, optional `rs_p2`, `rs_p3` and `rs_score`. Default event name
  `progression_start`, `progression_complete` or `progression_fail`.
- Error: `rs_kind="error"`, `rs_severity` (`debug`, `info`, `warning`, `error`,
  `critical`), `rs_message` (cut to 200 characters), optional `rs_stack` (cut to
  2000). Default event name `error`.
- Health: `rs_kind="health"`, `rs_fps_median`, `rs_fps_p10`, optional
  `rs_memory_mb` and `rs_boot_ms`. Sent by the SDK itself, never by game code.

Rules to hold to:

- **Money is integer minor units.** An amount of 499 with currency `usd` is 4.99
  USD. Send an integer or a string of digits, never a float and never a formatted
  price, and do not convert currencies. A resource amount is the opposite: a plain
  number, not money. Spending in-game gold is a `sink` resource, not a purchase;
  only a real-money purchase uses the purchase helper.
- **Accept and flag.** Ingest never refuses a typed event for breaking the
  contract. It stores the event as sent with an `rs_invalid` reason, leaves it out
  of the typed reads, and shows the flagged events on the dashboard's
  Implementation health card. Helpers never throw on bad input, so a wrong amount,
  currency or status becomes a flagged event, not a crash. After wiring a helper,
  send one event and confirm it is not flagged on that card. Never set
  `rs_invalid` yourself; the server drops any value a game sends.
- **Performance sampling is opt-in.** The config flag `performance` (default off)
  samples the frame rate about once a second into a bounded reservoir and sends
  exactly one `health` event per session: on background entry (mobile), page hide
  (web) or quit (desktop). It is never per second and never sent from the frame
  hook, and nothing is sent when no sample was taken. Turn it on only when the
  game wants frame rate, memory and boot time on the dashboard's health page, and
  call the per frame hook where the SDK needs one (LÖVE `ravensight.update(dt)`,
  C++ `client.sample_frame(dt)`, Odin `tick(client, dt)`). Do not add per frame or
  per second events of your own to imitate it.
- Which metrics exist and when the health event is sent differ by platform; read
  the installed SDK's README before promising a metric.

## Public builds and session authentication

Use a bounded `gt_pub_` key for a distributed build. Confirm the installed SDK's
keyless, consent, retry and event-id behavior from its source and current docs.
Include its automatic lifecycle names in the allowlist. Suggested policies are
proposals: show the changes before saving, and never silently raise a ceiling.
A game with authenticated accounts may instead mint per-player sessions on its
server and pass only the session token to its client. This is an HTTP pattern;
do not invent an SDK method to adopt a token.
Steam ticket requirements need the studio's Steamworks connection and a real
client ticket transport. Do not enable the requirement just because the UI shows
it: the SDK does not automatically obtain a Steam ticket. Read the current
public-build docs, including failures and retry behavior, before changing it.

## Payload and analytics contract

- The HTTP event envelope uses event, data, and optionally timestamp. Inspect
  current docs for timestamp units and the installed SDK's public signature.
- Use the publishable ingest key for the chosen game/environment. Account/MCP
  tokens and provider credentials never belong in shipped game code.
- **The SDK needs only the ingest key at initialization.** Do not ask a developer
  who has supplied their keys to also confirm game or project ids before writing
  code. Project and game ids are a release audit check: before shipping, confirm
  the key belongs to the intended game and environment. The free way to do that is
  `ravensight-doctor --live` (0.4.2 and later prints "key belongs to <name>
  (<slug>, <environment>)") or `GET /api/v1/settings` called with the key. Neither
  spends a metered call or sends an event.
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

Quoted from `dashboard/how-the-built-in-detections-read-your-events` at revision `8bc81e5e5ac7b72b42de8c10ee6cc02451608cdddd81f2b35543dd20e6347a44`:

> - **Deaths** are events whose name contains `died`, `destroyed`, or `killed` (lowercase substring match, so `player_died` and `ship_destroyed` both count).
> - **An explicit `rs_kind` comes first.** Set `rs_kind` in the event data to `level_start`, `level_complete`, `death`, or `none` and the level funnel, per-level deaths, journeys and the death count read it before the name. `none` opts an event out, so `checkout_started` with `rs_kind: "none"` is not a level start. An unknown value falls through to the name match. The five [typed kinds](https://www.ravensight.io/docs/#typed-events) are known values too, so a `purchase` is never read as a level by its name, and a `progression` event is read by its `rs_status`. Keys that start with `rs_` are reserved for Ravensight. The rage quit rules below read it too.
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

## Remote config and experiment exposure (held candidate)

The October 17, 2026 SDK candidates add remote config; confirm the installed
version and deployed server before using it. Inspect the engine's actual
`fetch_config`/`fetchConfig`/`FetchConfig` and typed getter APIs, rather than
inventing one shared signature. Use publishable ingest credentials and safe
fallbacks. Config is public game data, never a secret store. Fetch and cache are
consent-gated and scoped by endpoint, key, player, platform and build. Verify
that stale responses cannot restore another identity's values after reset or
opt-out, and that the game behaves correctly offline or before readiness.

A config fetch is not an event call or evidence of journey coverage. Fresh
responses consume one ordinary event; conditional 304 responses are free.
Active experiment labels `rs_exp_<key>` are attached by the SDK at enqueue time.
Never supply these fields yourself or relabel old queue entries. Values and
assignments must come from the same snapshot, including offline fallback.
Test the gameplay effect and emitted assignment together in a development
fixture, without generating production exposures. Read results through the
studio workflow; implementation does not authorize a winner promotion.

Doctor flags inspectable hand-written exposure labels but cannot verify runtime
assignment or statistical validity. `constructor` and `prototype` are forbidden
config property names, including nested JSON; they can be experiment key or
variant string values. Preserve that distinction when validating a custom adapter.

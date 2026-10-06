# Ravensight integration reference

Verify against the installed SDK and current [integration docs](https://ravensight.io/docs/).
This pack is a workflow, not an SDK implementation. Keep integrations compatible
with the customer's actual version; do not invent methods for engines you cannot inspect.

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
emits game_started after session creation and game_exited during orderly shutdown;
check the installed version before adding lifecycle calls. flush() requests an
attempt; it does not guarantee delivery after the process has exited.

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
- Built-in deaths match died, destroyed, or killed. Level starts match start,
  begin, or enter; completions match complet, finish, win, or clear. Level-based
  analytics require a non-empty level property. Names are interpreted heuristically:
  review unrelated events for accidental classification before broadening tracking.
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

Avoid repeated unbounded queries. MCP is metered separately from the customer's
agent/model usage. Source scans propose findings; the local coding agent performs
code edits. Neither MCP access nor this skill grants deployment permission.

## Doctor

If the project already has ravensight-doctor, use its local documented JSON command
for a static check. If installing it is in scope, the public docs specify:

```sh
npx github:Reality-Software-Entertainment/ravensight-doctor --json
```

This command downloads and executes code. Prefer the project's pinned version when
available. Run without --report for a local check; --report uploads results and
requires authorization and configured credentials. Doctor complements source and
runtime review; it does not establish complete journey coverage.

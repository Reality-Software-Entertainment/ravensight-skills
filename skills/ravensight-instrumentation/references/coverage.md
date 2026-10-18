# Journey coverage

> Docs catalog revision: `6f18ea4fbaa202482f8a05f88230b7b9562a373adafe54123d92e58df409505b`, checked 2026-10-18 against https://www.ravensight.io/docs/catalog.json.

Start from the [acceptance matrix](acceptance.md): every system below exists to
answer one of its rows. Use this as a discovery checklist, not a requirement to invent systems the
product does not contain. Choose event names from existing conventions and the
installed backend contract. Examples below are candidate concepts, not SDK APIs, except where a row names a
typed helper: those are SDK helpers documented in ravensight.md under "Typed event helpers" and need an SDK
build that ships them and matching deployed server support. Version numbers alone
do not establish availability; see the release guard in that reference.

| System | Look for the complete sequence | Useful bounded context |
| --- | --- | --- |
| Launch and session | boot, ready, resume, pause, explicit exit, startup failure | build, platform, entry source; reuse SDK lifecycle events |
| Onboarding | offered, step entered, action attempted, succeeded, blocked, skipped, revisited | tutorial/step, reason, attempt, elapsed_ms |
| Navigation and discovery | screen shown, option selected, destination reached, back/cancel, unavailable action | screen, source, destination, option_id |
| Core loop | run/round/level entered, objective attempted, milestone, outcome, retry, return | level, mode, difficulty, attempt_id, elapsed_ms |
| Combat and challenge | encounter, ability choice, damage summary, death, revive, boss phase, result | encounter_id, cause, equipment, resource bands |
| Progression | checkpoint, unlock, upgrade offered/chosen/applied/failed, quest accepted/advanced/resolved | checkpoint_id, progression stage, choice, requirement; the progression helper (`start`, `complete`, `fail` with `p1` to `p3` and `score`) for world, level and quest nodes |
| Economy and inventory | source earned, sink attempted, accepted/rejected, item gained/equipped/used/lost | currency, amount, reason, item_id, balance when useful; the resource helper (`source` or `sink`, resource name, plain number amount) for earned and spent in-game currency and materials |
| Purchases and rewards | offer viewed, intent, confirmed/failed/cancelled, entitlement granted, reward delivered | product_id, currency, amount with units, reason code; the purchase helper for a confirmed real-money purchase (integer minor units, 3 letter currency, item type and id) |
| Save and load | requested, completed/failed, resume accepted, migration/conflict/recovery | operation, slot category, schema version, duration, reason |
| Multiplayer | queue, match found/failed/cancelled, connect, join, disconnect/reconnect, match result | mode, queue duration, role, reason; authoritative emitter |
| Settings and accessibility | feature discovered, setting changed/applied/failed, input mode changed | setting_id, bounded value, source; no sensitive inference |
| Content and creation | content selected/started/finished/abandoned, editor action committed, publish outcome | content_id/type, action category; no raw user content |
| Feedback and support | report opened/submitted/cancelled/failed, help requested, recovery outcome | category, surface, reason; reuse report integration |
| Reliability | load stall/recovery, network loss/recovery, recoverable error, resource failure | subsystem, stable error code, duration; aggregate repeats; the error helper (severity, bounded message, optional stack) for errors the game catches, and opt-in `performance` sampling for frame rate, memory and boot time |

## Event design decisions

Ask what a later analyst could distinguish: never discovered versus declined;
attempted versus succeeded; lost versus quit; blocked versus chose another path;
retried versus started fresh; empty inventory versus failed to load inventory.
Attach context where it is reliably known, rather than trying to infer it later.

A level journey could contain level_started, checkpoint_reached, player_died,
retry_selected, level_completed, and level_abandoned. Before adding them, inspect
whether the game already records equivalent transitions through a wrapper. A retry
normally leads to a new level_started for a new attempt; it must not fire a second
start for the same attempt from both the button and scene initialization.

Use an explicit exit/cancel event only where that action is observable. A process
kill or crash cannot reliably emit an exit. Treat missing completion as an inferred
incomplete attempt with an observation window, not proof of intentional abandonment.

Ravensight reads `rs_kind` (`level_start`, `level_complete`, `death`, `none`) first,
before it falls back to substrings in event names; an unknown value falls through
to the name match. Read an existing event's `rs_kind` before classifying it. `none`
opts an event out, so set it on an event that should not count, and never rename
an event to dodge a heuristic. The death count and the rage quit rules both read
`rs_kind`; see ravensight.md for the quoted rules. Keys starting with `rs_` are
reserved.

`level`, `location` and `track` in event data fold into one place column, first
non-empty in that order. Only progression events should carry a place, so an
inventory_action_completed event is not mistaken for a level completion. Keep
other context under a different key, and document it.
See ravensight.md before choosing names or location fields.

## Volume discipline

A broad catalog can still have modest volume. Model events per session as fixed
boundaries plus actions per minute times session length, plus retries and bursts.
For example, 25 boundaries plus 4 meaningful actions/minute over 20 minutes is
about 105 events, before failures and retries. State these as assumptions until
measured. Estimate peak concurrent-player traffic against the configured limits.

Record sampling or aggregation windows and how they affect interpretation. Do not
sample half of a funnel arbitrarily. Never add idle heartbeats or per-frame events
just to increase apparent coverage; event volume also affects heuristic flags.

Typed helpers follow the same rule. A resource helper call per coin picked up is
per-second style volume; send the aggregate instead (a source of the amount earned
at the end of a fight or a level, a sink per shop purchase). A progression helper
belongs at a node boundary and an error helper at a caught failure; count repeats of
the same error in one event, never once per frame. Where the installed SDK and deployed server support it, `performance` sampling
sends one `health` event per session, so never recreate it with your own frame rate
events.

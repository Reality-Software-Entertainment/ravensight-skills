# Journey coverage

Use this as a discovery checklist, not a requirement to invent systems the
product does not contain. Choose event names from existing conventions and the
installed backend contract. Examples below are candidate concepts, not SDK APIs.

| System | Look for the complete sequence | Useful bounded context |
| --- | --- | --- |
| Launch and session | boot, ready, resume, pause, explicit exit, startup failure | build, platform, entry source; reuse SDK lifecycle events |
| Onboarding | offered, step entered, action attempted, succeeded, blocked, skipped, revisited | tutorial/step, reason, attempt, elapsed_ms |
| Navigation and discovery | screen shown, option selected, destination reached, back/cancel, unavailable action | screen, source, destination, option_id |
| Core loop | run/round/level entered, objective attempted, milestone, outcome, retry, return | level, mode, difficulty, attempt_id, elapsed_ms |
| Combat and challenge | encounter, ability choice, damage summary, death, revive, boss phase, result | encounter_id, cause, equipment, resource bands |
| Progression | checkpoint, unlock, upgrade offered/chosen/applied/failed, quest accepted/advanced/resolved | checkpoint_id, progression stage, choice, requirement |
| Economy and inventory | source earned, sink attempted, accepted/rejected, item gained/equipped/used/lost | currency, amount, reason, item_id, balance when useful |
| Purchases and rewards | offer viewed, intent, confirmed/failed/cancelled, entitlement granted, reward delivered | product_id, currency, amount with units, reason code |
| Save and load | requested, completed/failed, resume accepted, migration/conflict/recovery | operation, slot category, schema version, duration, reason |
| Multiplayer | queue, match found/failed/cancelled, connect, join, disconnect/reconnect, match result | mode, queue duration, role, reason; authoritative emitter |
| Settings and accessibility | feature discovered, setting changed/applied/failed, input mode changed | setting_id, bounded value, source; no sensitive inference |
| Content and creation | content selected/started/finished/abandoned, editor action committed, publish outcome | content_id/type, action category; no raw user content |
| Feedback and support | report opened/submitted/cancelled/failed, help requested, recovery outcome | category, surface, reason; reuse report integration |
| Reliability | load stall/recovery, network loss/recovery, recoverable error, resource failure | subsystem, stable error code, duration; aggregate repeats |

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

Ravensight built-in level detections match substrings in event names. Avoid putting
`level` on every event indiscriminately: an inventory_action_completed event with a
level property can be mistaken for level completion. Keep contextual location on
unrelated events under a different property such as context_level, and document it.
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

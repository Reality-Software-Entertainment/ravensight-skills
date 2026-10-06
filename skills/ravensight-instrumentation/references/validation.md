# Validation and deliverables

## Verification matrix

Choose tests from changed behavior. A mock wrapper can capture event names,
properties, order, and counts without network access. Use the project's existing
engine test runner or smoke harness when practical.

| Path | Evidence to check |
| --- | --- |
| Success | one start and one confirmed outcome per attempt, consistent context |
| Failure | failure code from the real failed branch, no success event |
| Retry | distinct attempt context, no accidental second emitter |
| Cancel/back | explicit cancel where observable, no invented completion |
| Re-entry/reload | subscriptions do not accumulate, no duplicate event from UI and state logic |
| Disabled tracking | gameplay still succeeds and no custom bypass transmits |
| Offline/reconnect | bounded SDK queue, gameplay remains responsive, no new retry loop |
| Client/server | one designated owner for each logical event, no replication duplicates |
| Schema | numeric durations and amounts with units, bounded dimensions, actual serialized size |
| Existing consumers | saved event meanings preserved; migration documented if needed |

Run build/type/engine checks appropriate to the edited files. Do not construct a
new test framework just to assert that a source string exists. Runtime observation
can use SDK debug hooks or an existing transport stub. Use configured development
credentials only when live delivery is authorized. Inspect the actual received
payload in the correct environment before claiming delivery verified.

## Event catalog

Reuse an existing format if present. Otherwise create docs/analytics/events.md:

| Event | Trigger and source location | Properties/types/units | Identity and ownership | Frequency | Status |
| --- | --- | --- | --- | --- | --- |

For each event include the question it answers, SDK automatic versus manual
emission, schema version if applicable, privacy exclusions, and known consumers.
Record exact names used in code, not desired names. Explain any migration and
whether a property can be absent. Do not put live credentials or player data here.

## Coverage report

Reuse an existing format or create docs/analytics/coverage.md. Include:

- Mode, scope, engine/SDK version, source revision or working-tree basis, inspected
  modules, unavailable areas, and live environment/window if consulted.
- Journey matrix with covered/partial/missing/intentionally excluded/not applicable/
  unverified status, evidence locations, and the missing part of each partial story.
- Existing events retained; defects fixed; new events/properties; deliberately
  deferred items and reasons. Distinguish implemented changes from recommendations.
- Ordinary and busy-session volume estimates, input assumptions, and any sampling.
- Checks performed and actual results. Label code-inspected, locally exercised,
  and delivery-observed evidence separately.
- Exact follow-up runtime steps, if unavailable, and release/migration implications.

For an audit-only request, recommendations remain recommendations; do not mark them
implemented. For an implementation request, finish reasonable local validation and
state the remaining runtime gaps. Avoid promising that every possible player story
is captured; report what the inspected and exercised scope actually supports.

## Repeat runs and selection audits

Compare against the current code and previous catalog, not just the previous report.
Inspect shared emitters before adding missing-looking events. A selection audit may
need caller/callee context, but edits stay within the requested scope. If coverage
is already sound, a no-change result with evidence is successful. Retire stale gap
claims only when new evidence addresses the relevant trigger and payload.

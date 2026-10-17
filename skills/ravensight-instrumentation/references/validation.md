# Validation and deliverables

> Docs catalog revision: `1916bde83e30b71d7320fa851716460667880044fb05eba3eeae31d99e0b2e17`, checked 2026-10-17 against https://www.ravensight.io/docs/catalog.json.

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

Reuse an existing format or create docs/analytics/coverage.md. Include the three
verdicts and the completion report below, plus:

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

## Three verdicts

Report three separate verdicts, each with its own evidence. One never stands in
for another: events can arrive with a sound schema and still leave the developer's
questions unanswerable.

| Verdict | Question | Pass needs | Evidence |
| --- | --- | --- | --- |
| Delivery | Do the events arrive and get stored? | Events from the changed build observed in the stored data of a development environment | received-data query results, environment, time window, build |
| Schema | Are names, kinds, reserved keys and volume right? | Stable names, a deliberate `rs_kind` on every event a built-in detection would misread, no invented `rs_` keys, a place only on progression events, bounded properties, a volume estimate | catalog review, payload samples, doctor findings |
| Coverage | Which requested question is still unanswerable? | Every acceptance matrix row answerable or explicitly not tracked | the matrix, row by row, with the received-data query for each |

Each verdict is pass, partial or fail, or unverified when the evidence could not be
gathered (say why). A green doctor result supports the schema verdict only: it is a
static integration check, never a whole-product certificate. Do not report one
overall pass.

## Completion report

End implementation work with this report, inline and in the coverage report:

```markdown
## Ravensight tracking: completion report

Mode and scope: <audit, expand or initialize; systems and files in scope>
Build and SDK: <engine, SDK version, source revision>
Acceptance matrix: <path>

### Delivery: <pass | partial | fail | unverified>
<environment, time window, build; events observed; what was not observed and why>

### Schema: <pass | partial | fail | unverified>
<names and kinds reviewed; rs_kind choices; reserved keys; place fields;
volume estimate; doctor result, stated as a static check>

### Coverage: <pass | partial | fail | unverified>
| Question | Answer | Evidence |
| --- | --- | --- |
<one row per acceptance matrix row; list every question that remains unanswerable>

### Changes
<events retained, defects repaired, events and properties added, deferred items>

### Follow-up
<exact runtime steps still to run, migrations, release implications>
```

## Review checklist

Use this when reviewing another agent's tracking change or your own. A review
that finds no bugs has not finished until coverage is checked.

- **Matrix:** an acceptance matrix exists and was written before the code; time,
  depth, progression, decision consequences, exits and retries each have an
  explicit answer; any "not tracked" row states why.
- **Delivery:** the received-data queries ran against stored rows from the
  changed build, not against a mock alone.
- **Schema:** names are stable; `rs_kind` is set deliberately and read first,
  `none` used instead of a rename; no new `rs_` keys; place keys only on
  progression events; cumulative counters are queried with MAX per run, never SUM.
- **Coverage:** for each matrix row, could a person answer the question from the
  stored data today? List the ones that cannot be answered.
- **Bugs:** duplicate emitters, wrong triggers, a synthetic or SDK device id
  mirrored into durable storage, tracking that blocks gameplay.

## Repeat runs and selection audits

Compare against the current code and previous catalog, not just the previous report.
Inspect shared emitters before adding missing-looking events. A selection audit may
need caller/callee context, but edits stay within the requested scope. If coverage
is already sound, a no-change result with evidence is successful. Retire stale gap
claims only when new evidence addresses the relevant trigger and payload.

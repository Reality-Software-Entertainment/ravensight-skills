# Acceptance matrix

> Docs catalog revision: `9a52b74ca50388e3d87f1dbd8ae20122cbdc22e783c9c4d24e1aa8264e9cc9b5`, checked 2026-10-14 against https://www.ravensight.io/docs/catalog.json.

Write this matrix into the project before changing any tracking code. It turns
"track everything" into questions a person can ask of the received data, and it is
the test the finished work is judged against. A list of SDK events is not a matrix.

Use the project's existing analytics folder if it has one; otherwise write
`docs/analytics/acceptance.md`. In an audit-only request, return the matrix inline
or in the report unless a file was requested. Keep it small: one row per question.

## Required rows

Every matrix answers these, in the game's own words. "Not tracked" is an allowed
answer only when it is written in the row with a reason (out of scope, the game has
no such system, deferred by the developer). A blank cell is not an answer.

| Question | Must state explicitly |
| --- | --- |
| How long do they play? | Time: session length and active time per run or level, with units. |
| Where do they stop, and where do they decide? | Exits: the last place and state before a session ends; the decision points reached. |
| Which choice did they make, and what did it cause? | Decision consequences: the option chosen and the outcome it led to, joined by the same id. |
| How deep do they get? | Depth: the furthest level, floor, chapter, wave or stage per run. |
| How much did they unlock? | Progression: unlocks, upgrades and checkpoints, as a count or set per run and per player. |
| What did they earn, and what was removed? | Sources and sinks: currency, items or resources gained, spent, lost or confiscated, with the reason. |
| What makes them leave, and what brings them back? | Exits and returns: the context of the last session, and the gap and entry point of the next one. |
| How often do they retry, and after what? | Retries: attempts per level or run, and what failed before each retry. |
| The game's own questions | Whatever the developer asked for or the design is built around: a boss, a shop, a crafting tree, a social loop. |

## Columns

| Column | What it holds |
| --- | --- |
| Metric | The number or set that answers the question, with units and aggregation, for example "furthest floor per run, MAX". |
| Source of truth | The authoritative state change that emits it, with a source location: the save committed, the purchase confirmed, the floor entered. Never a UI animation, a button press alone, or an observer that can fire twice. |
| Run or attempt join | The id that links rows that belong together across events and sessions: `run_id`, `attempt_id`, a save slot generation. Say where it is minted, where it is persisted and how it survives a resume. The SDK session id alone does not join a run that spans sessions. |
| Lifecycle and rollback test | The path that proves the metric survives real play: background and foreground, quit mid-run, crash and resume, load an earlier save, undo, a refund, a server rejection. Say what the data must show when state is rolled back. |
| Received-data query | The query, against stored rows, that produces the metric. Write it before implementing; run it in a development environment after. |
| Answer | Answerable, partial (say what is missing), or not tracked (say why). |

A matrix row is complete only when all seven cells are filled (the question plus
the six columns above). Implementation then
follows the rows, and the coverage report cites them.

## Example rows

| Question | Metric | Source of truth | Run or attempt join | Lifecycle and rollback test | Received-data query | Answer |
| --- | --- | --- | --- | --- | --- | --- |
| How deep do they get? | Furthest floor per run, MAX of `floor` | `floor_entered` after the floor scene finishes loading, `Dungeon.gd:212` | `run_id` minted at run start, saved with the run, reused on resume | Quit on floor 4, relaunch, resume: floor 5 continues the same `run_id`; loading the floor 2 save does not lower the run's maximum | see below | Answerable |
| Which upgrade did they pick, and did it help? | Pick rate per upgrade; clear rate of the next floor after each pick | `upgrade_chosen` when the choice is committed to the run state, `Shop.gd:88`; `floor_cleared` | `run_id` plus `floor` | Cancel the shop: no `upgrade_chosen`; reload before confirming: one pick only | count of `upgrade_chosen` by `upgrade_id`, joined to `floor_cleared` on `run_id` and the next `floor` | Answerable |
| What brings them back? | Days between sessions; entry point of the returning session | SDK `game_started`; the first menu or mode chosen | device id across sessions | Two sessions a day apart in development show one gap | see the second query below | Partial: no notification or store entry source |

## Query guidance

Values in `props` are text, so cast before comparing or aggregating. A counter that
grows during a run (gold banked, kills, floors, unlocks so far) is cumulative: take
its **MAX** per run, never its SUM, because every event repeats the running total.
SUM only per-occurrence amounts (the gold from one pickup). Group by the join id,
not by session, when a run can span sessions.

```sql
select props['run_id'] as run,
       max(toUInt32OrZero(props['floor'])) as deepest_floor
from events
where event_name = 'floor_entered'
group by run
order by deepest_floor desc
```

Days between consecutive `game_started` events per device, bounded to a 30-day
window and a capped result:

```sql
select intDiv(gap, 86400) as gap_days, count() as returns
from (
  select arrayJoin(gaps) as gap
  from (
    select device_id,
           arrayPopFront(arrayDifference(arraySort(groupArray(toUnixTimestamp(ts))))) as gaps
    from events
    where event_name = 'game_started' and ts >= now() - interval 30 day
    group by device_id
  )
)
group by gap_days
order by gap_days
limit 60
```

Persona runs are tagged synthetic and excluded by default; a development
environment is a separate game with its own key. Check the query against both the
time window and the build that contains the change before calling a row verified.

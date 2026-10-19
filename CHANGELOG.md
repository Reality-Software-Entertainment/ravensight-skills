# Changelog

## 0.2.1 (release candidate)

- Remove obsolete held-candidate labels from config/data automation guidance while retaining installed-SDK and selected-server capability checks.
- Verify current onboarding through an isolated real Codex session; Claude discovery works but behavioral evaluation remains blocked by the account usage limit.

## 0.2.0

- Add focused studio reference for remote config, experiment interpretation, warehouse SQL, organization management and Parquet exports.
- Distinguish ingest/config credentials, canManage versus canWrite, weighted costs and safe operation-ID retries.
- Preserve separate general and Playtest packaging; extend pending behavioral onboarding scenarios without claiming they have run.

- Add main, setup, connection and studio skills; keep instrumentation and Playtest independent.
- Add selectable installation, Claude/OpenAI plugin manifests and public documentation MCP wiring.
- Add release and marketplace steps; preserve the held 0.1.12 work with a deployed-capability check.


## 0.1.12

Teaches the skill the typed event helpers that the SDKs now ship (Godot, LÖVE,
Unity, Unreal, C++, Odin, iOS and Android 0.3.0, JavaScript 0.5.0).

- The integration reference gains a "Typed event helpers" section: one purchase,
  resource, progression and error example per engine, the reserved `rs_*` keys and
  default event names, money as integer minor units with resource amounts as plain
  numbers, the accept and flag rule (an invalid typed event is stored with
  `rs_invalid` and shown on the Implementation health card), and the opt-in
  `performance` flag that sends one `health` event per session.
- The coverage reference maps the Purchases, Progression, Economy and Reliability
  rows to the helpers and extends the volume rule to them: aggregate, never per
  second, and never recreate the health event with frame rate events of your own.
- The doctor (0.4.3) recognises the helper names as track calls.
- No docs catalog change in the references, so no re-stamp.

## 0.1.11

From a native iOS customer.

- `scripts/check-docs.mjs` no longer fails on a catalog change that touches no
  quoted document. It exits 0 with "catalog moved to <rev>; no quoted document
  changed; re-stamp when convenient" when every quoted document's revision and text
  match, and exits 1 (listing the changed document ids) only when a quoted
  document's revision or text changed. New `--stamp` rewrites the headers to the
  current catalog revision when nothing quoted changed. Offline tests cover both
  classes and the stamp.
- The integration reference no longer implies owner-confirmed game ids before
  coding: the SDK needs only the ingest key at initialization; project and game ids
  are a release audit check, done free with doctor `--live` (0.4.2 prints "key
  belongs to <name> (<slug>, <environment>)") or `GET /api/v1/settings` with the key.
- Native section: an app that reads `systemUptime` or another required-reason API
  for its own timing needs its own privacy manifest declaration; the SDK's manifest
  covers the SDK only. Transmit elapsed in-app intervals, never raw uptime.
- No docs catalog change in the references, so no re-stamp.

## 0.1.10

From an iOS customer on SDK 0.3.1, whose game still followed reference text written
for the pre-0.3 synthetic identity.

- The native and mobile reference now states the identity, reset and stop rules per
  SDK. iOS 0.3 and later: `deviceId` is always the durable id, `playtestDeviceId`
  holds `pt-<run>`, `resetDeviceId()` during a playtest mints and saves a new
  durable id and deletes the old identity's queue file, `stopAllTelemetry()` stops
  a synthetic run while the saved opt-out does not. iOS 0.2 and the other SDKs:
  `deviceId` reads `pt-<run>` during a playtest and reset is a no-op, so never
  mirror `deviceId` into durable storage while `isSynthetic` is true.
- New paragraph on the persisted queue: opt-in, never persists synthetic events.
  The iOS coalescing test flake is fixed in 0.3.1.
- No docs catalog change (revision unchanged), so no re-stamp.

## 0.1.9

From a customer's post-mortem on an iOS game, where "all tracking" became a list
of SDK events and the review checked bugs but not whether the player questions
could be answered.

- The first deliverable is now an acceptance matrix written into the project
  (`docs/analytics/acceptance.md` or the project's equivalent): one row per player
  question, with metric, source of truth, run or attempt join, lifecycle and
  rollback test, and received-data query. Time, depth, progression, decision
  consequences, exits and retries need an explicit answer; "not tracked" counts
  only when the row says so. New reference: `references/acceptance.md`.
- The completion report and a new review checklist give three separate verdicts:
  delivery (events arrive and are stored), schema (names, kinds, reserved keys,
  bounded volume) and coverage (which requested question is still unanswerable).
  A green doctor result is stated to be a static integration check, never a
  whole-product certificate. Query guidance takes MAX of cumulative counters per
  run, never SUM.
- Every reference now records the docs catalog revision and date it was checked
  against. The death, rage quit and stuck rules are quoted word for word from the
  live detections docs; the old line saying rage quit ignores `rs_kind` was wrong
  and is gone. `rs_kind` guidance: read it first, `none` opts out, never rename to
  dodge a heuristic.
- New `scripts/check-docs.mjs` (`npm run check-docs`) fetches the live catalog and
  fails when a reference's recorded revision is behind or a quote no longer
  matches. Run it by hand before a release; `npm test` never touches the network.
- New native and mobile section: a playtest id is never mirrored into durable
  storage, the player opt-out and the game's stop-all switch are different
  controls, and a native persona run needs a free runner preflight before any
  paid job.

## 0.1.8

- `--force` now keeps its backup outside your repository, at
  `~/.ravensight/skills-backup/<project>-<hash>/ravensight-instrumentation.bak-<timestamp>/`
  (private folder, mode 0700). Nothing is left in the project root, so a tracked old copy no longer
  leaves clutter behind. The success message prints the backup path.
- The backup is a verified copy followed by removal of the original, so it works across filesystems.
  If the install fails, the previous copy is copied back.
- New `--backup-dir PATH` chooses the backup location. New `--no-backup` replaces without a backup and
  says so. Both require `--force`. Symbolic links and locations inside the skill folder are refused.
- Backups made by 0.1.7 and earlier in `<project>/.ravensight-skills-backup/` are not touched; delete
  that folder when you no longer need it.

## 0.1.7

- Refuse a symlinked backup folder and keep the original error if restore fails.

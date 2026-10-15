# Changelog

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

# Changelog

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

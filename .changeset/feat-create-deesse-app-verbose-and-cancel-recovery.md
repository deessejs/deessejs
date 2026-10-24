---
"create-deesse-app": minor
---

Add `--verbose` flag for human-readable pipeline progress on stderr (one line per step boundary, no JSON or exit-code change). Add a dedicated `aborted` error code on the cancel path with a launcher-agnostic re-run recovery. Forward `SIGINT` to the install child so cancel-during-install is reported as `aborted` (with `projectCreated: true` and the install recovery) rather than `install_failed`. Prereq-failure after publish now reports `projectCreated: true` with the no-install recovery, so the JSON truthfully describes the on-disk state.

---
"@deessejs/cli": patch
---

Fixes `deessejs init <slug>` downloading zero files for V2 glob descriptors — templates that declare `includes[]` / `excludes[]` / `fileTypes{}` without an explicit `files[]` (for example `deessejs/package-template`). The `init` command now consumes `client.resolveTemplate(slug)` and applies the resolved file list (glob pipeline + recursive tree) to the download and `--dry-run` paths.

No public surface change. Same flags, same exit codes, same `--json` payload shape (with an added `files` array on success).
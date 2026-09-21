---
"@deessejs/cli": patch
---

Fixes `deessejs init <slug>` failing on Windows when the user's package manager is installed as a `.cmd` shim. The CLI's spawn wrapper used `node:child_process#spawn` with `shell: false`, which does not honour `PATHEXT` and aborts with `ENOENT` before `error` handlers can recover (the same root cause tracked as CVE-2024-27980).

Replaces the inner call with `cross-spawn@^7.0.6`, a drop-in replacement that resolves Windows shims automatically. The wrapper's public signature — `spawn(command, args, options): Promise<number>` — is unchanged, so all existing call sites and unit tests keep working without edits.

No public surface change. Behaviour on POSIX is identical.
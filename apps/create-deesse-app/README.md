# create-deesse-app

Initialize a new DeesseJS project from the current `main` of [`deessejs/saas-template`](https://github.com/deessejs/saas-template).

**Requires Node `>=22.13`.** Generated project requires Node `>=22`.

## Usage

```bash
pnpm dlx create-deesse-app@latest my-project
pnpm dlx create-deesse-app@latest my-project --no-install
npx create-deesse-app@latest my-project
npx create-deesse-app@latest my-project --no-install
npx create-deesse-app@latest my-project --dry-run
npx create-deesse-app@latest my-project --dry-run --no-install
pnpm dlx create-deesse-app@latest my-project --verbose
pnpm dlx create-deesse-app@latest my-project --dry-run --verbose
```

`npx` and `pnpm dlx` are both supported. The initializer resolves the current commit of `deessejs/saas-template` on every invocation, downloads the tarball by SHA, extracts it safely, renames the root `package.json`, and runs `pnpm install`.

The CLI requires Node `>=22.13` because that is the floor pnpm 11 enforces. Earlier Node versions (including 22.0–22.12) are rejected at startup with a clear `unsupported_node` error pointing at the pnpm compatibility page.

If `pnpm` is not on the user's `PATH` (the common case on Node 25+, where corepack is unbundled), the CLI runs the install via `npm exec --yes -- pnpm@<version> install` instead. The version comes from the generated project's `packageManager` field, so it is version-pinned even on stripped installs.

## Output

The CLI emits one JSON object on stdout and exits. On success:

```json
{
  "ok": true,
  "mode": "create",
  "projectCreated": true,
  "installed": true,
  "source": { "repo": "deessejs/saas-template", "ref": "main", "sha": "..." },
  "destination": "./my-project",
  "packageName": { "previous": "...", "current": "my-project" },
  "packageManager": "pnpm",
  "recovery": null
}
```

On install failure the project is kept on disk and the result is:

```json
{
  "ok": false,
  "mode": "create",
  "projectCreated": true,
  "installed": false,
  "destination": "./my-project",
  "recovery": "cd ./my-project && npm exec --yes -- pnpm@11.0.0 install",
  "error": { "code": "install_failed", "message": "...", "hint": "..." }
}
```

The `recovery` field is a copy-pasteable command that retries the install with the same bootstrap the CLI chose. The shape depends on the host shell: `cd '<path>' && ...` on POSIX hosts (Linux, macOS, git bash on Windows), `cd /d "<path>" && ...` on Windows `cmd` (the default PowerShell host and the legacy cmd.exe). WSL is not directly supported because the recovery carries the Windows path as-is (e.g. `C:\Users\...`), which WSL cannot resolve — run the recovery in `cmd` or in git bash on Windows instead, or convert the path to the WSL form (`/mnt/c/...`) by hand. The CLI never interpolates a user-controlled string into the recovery without going through a quoting helper, so the command is safe to paste even if a future template revision includes shell metacharacters in the version.

The process exit code is `0` only when `ok: true`.

## Dry-run

`--dry-run` plans the create without writing files, running install, or executing template code. The CLI performs the same argument validation, source resolution (downloading and validating the archive), and (unless `--no-install` is also passed) the same install prereq probe as a real create. The destination directory is never created and the staging tempdir is cleaned before the result is returned. Combine with `--no-install` to also skip the prereq probe:

```bash
npx create-deesse-app@latest my-project --dry-run
npx create-deesse-app@latest my-project --dry-run --no-install
```

```json
{
  "ok": true,
  "mode": "dry-run",
  "projectCreated": false,
  "installed": false,
  "source": { "repo": "deessejs/saas-template", "ref": "main", "sha": "..." },
  "destination": "./my-project",
  "packageName": { "previous": "next-monorepo", "current": "my-project" },
  "packageManager": "pnpm",
  "install": {
    "skipped": false,
    "strategy": "corepack",
    "command": { "bin": "corepack", "args": ["pnpm", "install"] },
    "prereqs": { "corepack": true, "npm": true, "pnpm": false }
  },
  "plannedFiles": [
    { "path": "LICENSE", "size": 42, "mode": 420 },
    { "path": "package.json", "size": 512, "mode": 420 }
  ],
  "documentation": "https://docs.deessejs.com/getting-started",
  "recovery": null
}
```

`recovery` is always `null` in dry-run mode: the dry-run did not attempt anything that could fail, so there is nothing to retry. The `source.sha` is the SHA that a real create would have used at the moment the dry-run ran — a later invocation may fetch a different SHA, by design.

## Verbose output

`--verbose` is an opt-in flag that streams human-readable progress to stderr. The JSON on stdout is unchanged, the exit code is unchanged, and the flag never opens a prompt or changes interactive behavior. Default mode is silent.

```bash
pnpm dlx create-deesse-app@latest my-project --verbose
pnpm dlx create-deesse-app@latest my-project --dry-run --verbose
```

Sample stderr with `--verbose`:

```
create-deesse-app: starting create project=my-project dir=./my-project install=true
create-deesse-app: resolving source SHA
create-deesse-app: resolved source SHA sha=6d0cf3f...
create-deesse-app: downloaded archive
create-deesse-app: validating archive entries
create-deesse-app: validated entries count=550
create-deesse-app: staged template path=my-project
create-deesse-app: published project destination=./my-project
create-deesse-app: probing install prereqs
create-deesse-app: install strategy chosen strategy=corepack
create-deesse-app: running install cwd=./my-project
create-deesse-app: install completed
```

The `--verbose` and `--dry-run` flags compose: a `--verbose --dry-run` invocation prints the planning narration up to and including `dry-run plan ready`, then the JSON. It never prints `running install` (the dry-run does not run install) and never prints `published project` (the dry-run does not publish).

`-v` and `--version` take priority over `--verbose` (the pre-parse in `src/index.ts` short-circuits on the version flag before Commander sees argv). If you want the version, ask for it explicitly; if you want narration, pass `--verbose`.

The cancel path (`error.code: "aborted"`) is the same in `--verbose` and the default mode: SIGINT aborts in-flight IO, the staging tempdir is removed, the destination is left untouched, and the result includes a `recovery` field with the platform-shaped `cd <dir> && pnpm dlx create-deesse-app@latest <name>` re-run command.

## Getting started

See <https://docs.deessejs.com/getting-started> for the full guide.

## License

MIT

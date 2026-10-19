# create-deesse-app

Initialize a new DeesseJS project from the current `main` of [`deessejs/saas-template`](https://github.com/deessejs/saas-template).

**Requires Node `>=22.13`.** Generated project requires Node `>=22`.

## Usage

```bash
pnpm dlx create-deesse-app@latest my-project
pnpm dlx create-deesse-app@latest my-project --no-install
npx create-deesse-app@latest my-project
npx create-deesse-app@latest my-project --no-install
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

## Getting started

See <https://docs.deessejs.com/getting-started> for the full guide.

## License

MIT

# create-deesse-app

Initialize a new DeesseJS project from the current `main` of [`deessejs/saas-template`](https://github.com/deessejs/saas-template).

**Requires Node `>=20`.** Generated project requires Node `>=22`.

## Usage

```bash
pnpm dlx create-deesse-app@latest my-project
pnpm dlx create-deesse-app@latest my-project --no-install
```

The initializer resolves the current commit of `deessejs/saas-template` on every invocation, downloads the tarball by SHA, extracts it safely, renames the root `package.json`, and runs `pnpm install`.

> **Note**: `npm` / `npx` are not supported in this increment. Use `pnpm dlx`.

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
  "recovery": "cd ./my-project && pnpm install",
  "error": { "code": "install_failed", "message": "...", "hint": "..." }
}
```

The process exit code is `0` only when `ok: true`.

## Getting started

See <https://docs.deessejs.com/getting-started> for the full guide.

## License

MIT
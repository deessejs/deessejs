# apps/cli

You own the command line that reaches the registry: the `deessejs` binary, published to npm as `@deessejs/cli`. Whatever a user can do from a terminal goes through this workspace.

Read [the root guide](../../AGENTS.md) first. It holds the invariants that apply everywhere.

## Commands

| Command | What it does |
|---|---|
| `deessejs list` | Lists the registry templates. Accepts `--category`, `--json`. |
| `deessejs info <slug>` | The detail of one template. |
| `deessejs init <slug>` | Clones the template repository and installs its dependencies. |
| `deessejs auth login` | Runs the device-authorization flow against the server. |
| `deessejs auth status` | Prints the identity stored on this machine. |
| `deessejs auth logout` | Signs out and clears the stored token. |

`init` options: `--pm`, `--dir`, `--ref`, `--no-install`, `--force`, `--json`.

## Key files

| Path | Owns |
|---|---|
| `src/index.ts` | The Commander program. Every command is registered here. |
| `src/commands/` | One file per command. |
| `src/api/` | The typed oRPC client and the response cache. |
| `src/lib/auth/` | The device flow, the token store and the bearer fetch. |
| `src/cache/` | The on-disk cache under `~/.deessejs/`. |
| `src/errors/` | The typed errors and their exit codes. |
| `src/output/` | The human output and the JSON output. |
| `src/utils/` | Package manager detection, git, spawn, sleep. |

## Conventions

- **The public error codes are a closed list.** `CliErrorCode` in `src/errors/index.ts` is the surface downstream tooling pattern-matches against. Adding a code there is a breaking change. The internal codes (`git_not_installed`, `target_exists`, `install_failed`, `internal`) are free to grow.
- **Every command catches `CliError` and exits with the matching code.** The handler at the bottom of `src/index.ts` is the last resort for an uncaught bug, not the normal path.
- **The version comes from the bundle, not from the file system.** `readPackageVersion` reads a literal injected by tsup at build time from `package.json`. Do not resolve the version at runtime.
- **The cache holds the body and the ETag.** The server decides freshness: a cache entry is valid when the server answers 304, or in offline mode when any previous response beats nothing. A malformed cache file is a cache miss, never an overwrite.
- **The registry responses are validated against `@workspace/contracts`.** The CLI fails with `parse_error` rather than consuming a shape it does not know.
- **Relative imports carry the `.js` extension,** and the package is ESM.

## Gotchas

- `pnpm build` and `pnpm dev` build `@workspace/contracts` first. `prebuild` and `predev` do it for you.
- `pnpm test` builds the whole CLI and the workspace before running Vitest. That is what makes the bundle-level tests meaningful.
- The API and the contracts are devDependencies on purpose: tsup inlines them, so the published CLI carries the registry client with it and installs no runtime dependency.

## Commands for this workspace

```bash
pnpm build
pnpm dev            # tsup --watch
pnpm test           # vitest run
pnpm test:watch
pnpm typecheck
pnpm lint
pnpm format
```

The tests live in `test/`: `unit/`, `integration/` and `contract/`.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/api](../../packages/api/AGENTS.md)
- [packages/contracts](../../packages/contracts/AGENTS.md)
- [apps/docs](../docs/AGENTS.md)

# apps/cli

You own the command line that reaches the registry: the `deessejs` binary, published to npm as `@deessejs/cli`. Whatever a user can do from a terminal goes through this workspace.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Commands

| Command                | What it does                                                     |
| ---------------------- | ---------------------------------------------------------------- |
| `deessejs list`        | Lists the registry templates. Accepts `--category`, `--json`.    |
| `deessejs info <slug>` | The detail of one template.                                      |
| `deessejs init <slug-or-github-url>` | Creates a project from a catalog template or a GitHub repository. |
| `deessejs auth login`  | Runs the device-authorization flow against the server.           |
| `deessejs auth status` | Prints the identity stored on this machine.                      |
| `deessejs auth logout` | Signs out and clears the stored token.                           |

`init` accepts a catalog slug or an HTTPS URL to a GitHub repository root. Both forms require a valid root `deesse-template.json` and use it to select files. There is no Git clone fallback. `--force` permits an existing empty target directory and never deletes existing files.

`init` options: `--pm`, `--dir`, `--ref`, `--no-install`, `--force`, `--json`.

## Key files

| Path            | Owns                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| `src/index.ts`  | The Commander program. Every command is registered here.                     |
| `src/commands/` | One file per command.                                                        |
| `src/api/`      | The typed oRPC client and the response cache.                                |
| `src/lib/auth/` | The device flow, the token store and the bearer fetch.                       |
| `src/cache/`    | The on-disk cache under `~/.deessejs/`.                                      |
| `src/errors/`   | The typed errors and their exit codes.                                       |
| `src/output/`   | The human output and the JSON output.                                        |
| `src/utils/`    | Package manager detection, spawn, safe template materialization, sleep. |

## Conventions

- **The public error codes are a closed list.** `CliErrorCode` in `src/errors/index.ts` is the surface downstream tooling pattern-matches against. Adding a code there is a breaking change. Internal codes such as `target_exists`, `target_not_empty`, `invalid_target`, `template_invalid`, `materialize_failed`, `install_failed` and `internal` are free to grow.
- **Every command catches `CliError` and exits with the matching code.** The handler at the bottom of `src/index.ts` is the last resort for an uncaught bug, not the normal path.
- **The version comes from the bundle, not from the file system.** `readPackageVersion` reads a literal injected by tsup at build time from `package.json`. Do not resolve the version at runtime.
- **The cache holds the body and the ETag.** The server decides freshness: a cache entry is valid when the server answers 304, or in offline mode when any previous response beats nothing. A malformed cache file is a cache miss, never an overwrite.
- **The registry response is typed with `@workspace/contracts`.** The CLI imports the contract and types what it reads with it, so a change to the shape is a compile error here. The CLI reserves a `parse_error` code for a response that does not match the contract. `@workspace/registry` is also bundled into the published CLI and must be built before the CLI.
- **Relative imports carry the `.js` extension,** and the package is ESM.

## Gotchas

- `pnpm build` and `pnpm dev` build `@workspace/contracts` and `@workspace/registry` first. `prebuild` and `predev` do it for you.
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

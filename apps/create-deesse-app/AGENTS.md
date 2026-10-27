# apps/create-deesse-app

You own the standalone scaffolder, published to npm as `create-deesse-app`. It creates a new project from `deessejs/saas-template`. It does not go through the registry: it resolves the `main` branch at run time and downloads the tarball of the commit it resolves, so a given download is immutable even though `main` keeps moving.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## The flow

`src/pipeline.ts` runs the steps in order:

1. **Cheap checks first.** Node version, project name, destination directory. Fail before anything is downloaded.
2. **Resolve the source.** `src/source/resolve-sha.ts` resolves `main` to a commit SHA with `git ls-remote`, and `src/source/download-tarball.ts` downloads the tarball of that SHA. The resolution happens at run time, so two runs can land on different commits; the download is immutable, because it is the tarball of the commit that was resolved.
3. **Validate and extract** into a staging directory, with the `package.json` renamed inside the staging area so the project keeps its own name.
4. **Publish atomically.** `src/extract/publish-or-rollback.ts` moves the staging directory into place and rolls back if anything fails.
5. **Install.** The package manager is probed, then the install runs. `src/install/recovery.ts` owns the recovery when the install is interrupted.

`--dry-run` branches before the first write and returns the plan. It executes no template code and writes nothing.

## Options

| Option         | Effect                          |
| -------------- | ------------------------------- |
| `--dir <path>` | Where to create the project.    |
| `--no-install` | Stop after the extraction.      |
| `--dry-run`    | Print the plan, change nothing. |
| `--verbose`    | Narrate every step on stderr.   |

## Key files

| Path              | Owns                                                  |
| ----------------- | ----------------------------------------------------- |
| `src/index.ts`    | The Commander program.                                |
| `src/pipeline.ts` | The ordered steps and where each one fails.           |
| `src/source/`     | Resolving the SHA and downloading the tarball.        |
| `src/extract/`    | Validation, extraction and the atomic publish.        |
| `src/install/`    | The install strategy, the bootstrap and the recovery. |
| `src/pm/`         | Package manager detection and the install strategy.   |
| `src/dry-run/`    | The dry-run plan.                                     |
| `src/output/`     | The logger and the install log.                       |
| `src/result.ts`   | The shape of the result the command returns.          |

## Conventions

- **Human messages go to stderr, structured output goes to stdout.** A user piping the output must not receive progress messages in the stream.
- **The exit code is 0 or 1,** set through `process.exitCode`, never through a hard exit inside a step.
- **The lower-case `-v` is parsed before Commander.** Commander reserves `-V` for the version, so the lower-case flag is handled in `src/index.ts` before the program parses its arguments.
- **A cancelled install kills the whole process tree,** not only the direct child. The escalation to `SIGKILL` exists because a package manager spawns its own children.
- **The template code is never executed during the dry run,** and never before it has been validated.

## Commands

```bash
pnpm build
pnpm dev               # tsup --watch
pnpm test              # vitest run
pnpm test:e2e          # the end-to-end suite
pnpm typecheck
pnpm typecheck:unit    # tsc --noEmit -p tsconfig.unit.json
pnpm typecheck:e2e     # tsc --noEmit -p tsconfig.e2e.json
pnpm lint
pnpm format
```

The unit tests live in `test/unit/`, the end-to-end tests in `test/e2e/`, including the native smoke test and the npm round trip through a local registry.

## Gotchas

- The unit and the e2e suites have separate typecheck projects. A change that touches only the e2e code still has to keep `pnpm typecheck:e2e` green.
- The ref is resolved at run time, so two runs on the same day can produce two different projects as `main` moves. What is immutable is the download: the tarball of the resolved SHA.

## Related guides

- [Root guide](../../AGENTS.md)
- [apps/cli](../cli/AGENTS.md)

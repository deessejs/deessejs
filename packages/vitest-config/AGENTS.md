# packages/vitest-config

You own the shared Vitest setup: the defaults every test suite inherits, so that the same behaviour is reproduced everywhere a test runs.

The [root guide](../../AGENTS.md) holds the rules that cut across every workspace: the API path, the auth base path, the wire contracts, the research protocol and the git workflow. Read it when your change touches one of them, not before every edit.

## Key files

| Path | Owns |
|---|---|
| `src/index.ts` | `defineConfig` with the defaults, and the override type. |

A workspace calls it with its own overrides:

```ts
import { defineConfig } from "@workspace/vitest-config"

export default defineConfig({
  include: ["tests/**/*.test.ts"],
  setupFiles: ["@workspace/env/server"],
})
```

## The defaults

| Option | Default | Why |
|---|---|---|
| `include` | `tests/**/*.test.ts` | The suites live in `tests/`. |
| `testTimeout` | 5 seconds | |
| `hookTimeout` | 10 seconds | |
| `pool` | `threads` | |
| `setupFiles` | `@workspace/env/server` | Every suite gets the validated environment. |
| `clearMocks` | on | |
| `restoreMocks` | on | |
| `coverage` | off | Turned on by the coverage task. |

## The environment rule

**Turbo filters shell variables before it starts Vitest.** If the Vitest config reads a variable that is not in the `test` task `env` allowlist in `turbo.json`, it sees `undefined`. Add shell-provided variables to that allowlist, then read them in the test runtime. Vitest's `test.env` option can set explicit values for test processes; it cannot recover a shell value that Turbo removed before config loading.

## Conventions

- **A workspace overrides the defaults, it does not redefine them.** If a suite needs a different pool or a different timeout, pass it through `defineConfig` rather than copying the configuration.
- **The setup file validates the environment before the first test runs,** so a missing variable fails the suite immediately instead of in the middle of a test.
- **The suite files live in `tests/`** and are named `*.test.ts`. The `include` default assumes that layout.

## Gotchas

- The package builds with `tsc`, so `dist/` has to exist before a workspace can import it. Turbo orders the tasks, but running a single workspace in isolation may need `pnpm --filter @workspace/vitest-config build` first.

## Related guides

- [Root guide](../../AGENTS.md)
- [packages/database](../database/AGENTS.md)

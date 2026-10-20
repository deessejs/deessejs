# `@workspace/vitest-config`

The shared Vitest setup: the defaults every test suite inherits, so that the same behaviour is reproduced everywhere a test runs.

## What's included

- **`defineConfig`**: a Vitest config factory with the workspace defaults, and a typed set of overrides

## Usage

```ts
// vitest.config.ts
import { defineConfig } from "@workspace/vitest-config"

export default defineConfig({
  include: ["tests/**/*.test.ts"],
  setupFiles: ["@workspace/env/server"],
})
```

## The defaults

| Option | Default | Why |
|---|---|---|
| `include` | `tests/**/*.test.ts` | The suites live in `tests/` |
| `testTimeout` | 5 seconds | |
| `hookTimeout` | 10 seconds | |
| `pool` | `threads` | |
| `setupFiles` | `@workspace/env/server` | Every suite gets the validated environment |
| `clearMocks` | on | |
| `restoreMocks` | on | |
| `coverage` | off | Turned on by the coverage task |

## Commands

```bash
pnpm build
```

## Notes

- **Turbo filters shell variables before it starts Vitest.** If the Vitest config reads a variable that is not in the `test` task `env` allowlist in `turbo.json`, it sees `undefined`. Add shell-provided variables to that allowlist, then read them in the test runtime. Vitest's `test.env` option can set explicit values for test processes; it cannot recover a shell value that Turbo removed before config loading.
- A workspace overrides the defaults, it does not redefine them. If a suite needs another pool or another timeout, pass it through `defineConfig`.
- The suite files live in `tests/` and are named `*.test.ts`. The `include` default assumes that layout.
- The package builds with `tsc`, so `dist/` has to exist before a workspace can import it. Running a single workspace in isolation may need `pnpm --filter @workspace/vitest-config build` first.

## Related

- **Used by**: [`@workspace/api`](../api/README.md), [`@workspace/auth`](../auth/README.md), [`@workspace/contracts`](../contracts/README.md), [`@workspace/database`](../database/README.md), [`@workspace/email`](../email/README.md), [`@workspace/env`](../env/README.md), [`@workspace/utils`](../utils/README.md), [`apps/app`](../../apps/app/README.md), [`apps/web`](../../apps/web/README.md)

The conventions of this package are in [AGENTS.md](AGENTS.md).

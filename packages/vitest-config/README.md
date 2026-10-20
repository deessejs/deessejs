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

- **Do not read `process.env` in the Vitest configuration.** The config is loaded after Turbo has already stripped the variables that are not in the `test` task allowlist of `turbo.json`, so a value read at that point is already `undefined`. A `test.env` entry has the same problem: it runs at config-load time, which is too late. The fix is to add the variable to the allowlist of the `test` task in `turbo.json`, and to read it at run time.
- A workspace overrides the defaults, it does not redefine them. If a suite needs another pool or another timeout, pass it through `defineConfig`.
- The suite files live in `tests/` and are named `*.test.ts`. The `include` default assumes that layout.
- The package builds with `tsc`, so `dist/` has to exist before a workspace can import it. Running a single workspace in isolation may need `pnpm --filter @workspace/vitest-config build` first.

The conventions of this package are in [AGENTS.md](AGENTS.md).

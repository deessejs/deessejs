---
"@deessejs/cli": patch
---

Fixes `deesse auth login` (and the other auth commands, by extension) silently hitting the production API when `DEESSEJS_API_URL` was set in the same process. The `createCliAuthClient` factory captured `resolveBaseURL()` at module-load time, so any code path that imported the client before mutating the env var (the integration tests do this in `beforeEach`, after importing `loginCommand`) ended up with a client pinned to `https://app.deessejs.com` and the device-flow polling loop waited indefinitely for responses from a server the test was not actually starting.

Root cause: the `cliAuthClientOptions` const in `apps/cli/src/lib/auth/store/better-auth-client.ts` was declared with `baseURL: resolveBaseURL()` at module scope. `resolveBaseURL()` reads `process.env.DEESSEJS_API_URL` synchronously at evaluation time, so the value seen by the first import wins for the lifetime of the process. The factory function then reused that frozen const on every call.

Fix: move `baseURL: resolveBaseURL()` into the `createCliAuthClient` function body so each call reads the env var at call time. The factory was already documented as "the public surface (not a singleton)" and the rationale ("tests need to override `DEESSEJS_API_URL` before the client is built") was already in the surrounding comment — the code simply contradicted the documentation.

The `as ReturnType<typeof createAuthClient<typeof cliAuthClientOptions>>` cast on the return is removed. The cast existed to work around a tsup `.d.ts` worker TS2883; tsup's dts emit has since been disabled for this package, and the workspace typecheck (`pnpm --filter @deessejs/cli exec tsc --noEmit`) still passes without it.

Verified locally:

- `pnpm --filter @deessejs/cli exec tsc --noEmit` → `EXIT=0`
- `pnpm --filter @deessejs/cli exec vitest run test/integration/auth/login.test.ts` → 4 passed, 1 skipped, 20.1s (the four device-flow tests previously timed out at 30s each)

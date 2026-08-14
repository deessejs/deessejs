/**
 * Locks the contract that `getServerEnv()` resolves aliases at the
 * consumer boundary in `packages/env/src/server.ts:75`.
 *
 * Why this test exists (ADR-011, rank 3):
 *
 *   The schema's `.superRefine` accepts either name (rank 2 test).
 *   The materialised ServerEnv contract that callers see, however,
 *   is the result of the resolution at server.ts:75:
 *
 *     BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ?? env.AUTH_SECRET,
 *     TEST_DATABASE_URL:  env.TEST_DATABASE_URL ?? env.DATABASE_URL,
 *
 *   Schema-level acceptance and consumer-level resolution are
 *   different contracts. A regression that breaks the resolution
 *   without breaking the gate would pass rank 2 and fail rank 3.
 *   Three cases cover the pair:
 *
 *   1. `BETTER_AUTH_SECRET` set in the snapshot; the resolved
 *      `serverEnv.BETTER_AUTH_SECRET` carries the canonical value.
 *   2. `AUTH_SECRET` set in the snapshot; the resolved
 *      `serverEnv.BETTER_AUTH_SECRET` carries the alias value.
 *   3. `TEST_DATABASE_URL` unset; the resolved
 *      `serverEnv.TEST_DATABASE_URL` falls back to `DATABASE_URL`.
 *
 *   Test isolation: `getServerEnv()` caches its result in a
 *   module-level `_cached`. Between cases we reset the module
 *   state so the cache and the spies do not leak.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

const VALID_SECRET =
  "ci-test-secret-which-is-long-enough-to-pass-the-32-char-validation"

// Reset the module cache between cases. The `_cached` ServerEnv is
// stored at the module's top level; without a reset, the second
// case's snapshot would be served from the first case's cache.
beforeEach(() => {
  vi.resetModules()
})

describe("serverEnv — alias resolution at the consumer boundary", () => {
  it("resolves BETTER_AUTH_SECRET from the canonical name", async () => {
    vi.doMock("../../src/loader.js", () => ({
      loadDotenvSnapshot: () => ({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://x",
        BETTER_AUTH_URL: "http://localhost:3000",
        BETTER_AUTH_SECRET: VALID_SECRET,
      }),
      loadRepoEnv: () => {},
      EnvSnapshot: class {},
    }))

    const { serverEnv } = await import("../../src/server.js")
    expect(serverEnv.BETTER_AUTH_SECRET).toBe(VALID_SECRET)
  })

  it("resolves BETTER_AUTH_SECRET from the alias AUTH_SECRET", async () => {
    vi.doMock("../../src/loader.js", () => ({
      loadDotenvSnapshot: () => ({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://x",
        BETTER_AUTH_URL: "http://localhost:3000",
        // canonical absent; alias set.
        AUTH_SECRET: VALID_SECRET,
      }),
      loadRepoEnv: () => {},
      EnvSnapshot: class {},
    }))

    const { serverEnv } = await import("../../src/server.js")
    expect(serverEnv.BETTER_AUTH_SECRET).toBe(VALID_SECRET)
  })

  it("falls back TEST_DATABASE_URL to DATABASE_URL when unset", async () => {
    vi.doMock("../../src/loader.js", () => ({
      loadDotenvSnapshot: () => ({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://primary",
        BETTER_AUTH_URL: "http://localhost:3000",
        // TEST_DATABASE_URL deliberately omitted.
      }),
      loadRepoEnv: () => {},
      EnvSnapshot: class {},
    }))

    const { serverEnv } = await import("../../src/server.js")
    expect(serverEnv.TEST_DATABASE_URL).toBe("postgresql://primary")
    expect(serverEnv.DATABASE_URL).toBe("postgresql://primary")
  })
})

import { ORPCError } from "@orpc/client"
import { describe, it, expect } from "vitest"

import { networkError } from "../../src/errors/index.js"
import { normaliseError } from "../../src/api/index.js"

/**
 * Contract test for the ORPCError -> Error normalisation.
 *
 * The normaliser is the only piece of logic in `api/index.ts` that does
 * not delegate to a tested helper (RPCLink, the official oRPC plugins,
 * Zod contract). Mocking the global `fetch` is the wrong layer for
 * RPCLink tests — see Phase 3 of
 * docs/engineering/plans/orpc-client-migration.md. So we test the
 * normaliser directly here.
 *
 * The normaliser uses `toORPCError` from `@orpc/client` and the
 * `instanceof ORPCError` check it exposes (via Symbol.hasInstance for
 * the Next.js multi-context case). No shape matching in this file.
 */
describe("normaliseError", () => {
  it("wraps a TypeError (fetch failure) as a network_error CliError", () => {
    const e = new TypeError("fetch failed")
    const result = normaliseError(e)
    expect(result).toBeInstanceOf(Error)
    expect(result.name).toBe("CliError")
    expect((result as { code: string }).code).toBe("network_error")
    expect((result as { hint?: string }).hint).toBe("fetch failed")
  })

  it("propagates an ORPCError unchanged", () => {
    const e = new ORPCError("NOT_FOUND", {
      message: "template not found",
      data: {},
    })
    const result = normaliseError(e)
    expect(result).toBe(e)
    expect(result).toBeInstanceOf(ORPCError)
  })

  it("propagates an ORPCError with RATE_LIMITED unchanged", () => {
    const e = new ORPCError("RATE_LIMITED", {
      message: "Too many requests",
      data: { retryAfter: 60 },
    })
    const result = normaliseError(e)
    expect(result).toBe(e)
    expect((result as { code: string }).code).toBe("RATE_LIMITED")
  })

  it("normalises a generic Error to an INTERNAL_SERVER_ERROR ORPCError", () => {
    // Anything that is not a TypeError or a recognised ORPCError is
    // normalised by oRPC into a fallback ORPCError. The CLI propagates
    // it as-is: a generic Error means the server (or the lib) crashed
    // in an unexpected way, not a network failure.
    const e = new Error("Cannot parse response body")
    const result = normaliseError(e)
    expect(result).toBeInstanceOf(ORPCError)
    expect((result as { code: string }).code).toBe("INTERNAL_SERVER_ERROR")
  })

  it("normalises a non-Error thrown value to an INTERNAL_SERVER_ERROR ORPCError", () => {
    const result = normaliseError("a string was thrown")
    expect(result).toBeInstanceOf(ORPCError)
    expect((result as { code: string }).code).toBe("INTERNAL_SERVER_ERROR")
  })

  it("imports networkError (sanity check the test fixture)", () => {
    // The networkError factory is the canonical way to build a network
    // error CliError. The normaliser uses it. This assertion makes the
    // dependency explicit so a refactor that drops networkError would
    // surface here.
    const e = networkError("x")
    expect(e.code).toBe("network_error")
  })
})

import { describe, it, expect } from "vitest"

import { orpcToCliError } from "../../src/api/index.js"

/**
 * Unit tests for the ORPCError → CliError mapper.
 *
 * The mapper is the only piece of logic in `api.ts` that does not
 * delegate to a tested helper (RPCLink, the official oRPC plugins,
 * Zod contract).
 * Mocking the global `fetch` is the wrong layer for RPCLink tests —
 * see Phase 3 of docs/engineering/plans/orpc-client-migration.md.
 * So we test the mapper directly here.
 *
 * The mapper matches on the wire shape `{ code: string, status: number,
 * message?: string, data?: unknown }` rather than `instanceof ORPCError`
 * because the client may live-load a different version of `@orpc/client`
 * than the one we import here for the type, breaking `instanceof`. Shape
 * matching is robust to that.
 */

describe("orpcToCliError", () => {
  it("maps an ORPCError-shape object to parse_error with the server code", () => {
    const e = {
      name: "ORPCError",
      code: "RATE_LIMITED",
      status: 429,
      message: "Too many requests. Try again in 60s.",
      data: { retryAfter: 60 },
    }
    const cliErr = orpcToCliError(e)
    expect(cliErr.code).toBe("parse_error")
    expect(cliErr.message).toContain("RATE_LIMITED")
    expect(cliErr.message).toContain("429")
    // Hint preserves the underlying details for debugging
    expect((cliErr as { hint?: string }).hint).toContain("RATE_LIMITED")
  })

  it("maps NOT_FOUND to parse_error with the server code in the message", () => {
    const e = {
      name: "ORPCError",
      code: "NOT_FOUND",
      status: 404,
      message: "Route not found",
      data: {},
    }
    const cliErr = orpcToCliError(e)
    expect(cliErr.code).toBe("parse_error")
    expect(cliErr.message).toContain("NOT_FOUND")
  })

  it("maps INTERNAL_SERVER_ERROR to parse_error", () => {
    const e = {
      name: "ORPCError",
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
      message: "Boom",
      data: {},
    }
    const cliErr = orpcToCliError(e)
    expect(cliErr.code).toBe("parse_error")
    expect(cliErr.message).toContain("INTERNAL_SERVER_ERROR")
  })

  it("falls back to data over message when data is present", () => {
    const e = {
      name: "ORPCError",
      code: "TEMPLATES_FETCH_FAILED",
      status: 503,
      message: "fallback message",
      data: { hint: "GitHub rate limit exceeded" },
    }
    const cliErr = orpcToCliError(e)
    expect(cliErr.message).toContain("TEMPLATES_FETCH_FAILED")
    expect(cliErr.message).toContain("GitHub rate limit exceeded")
  })

  it("maps a TypeError (fetch failure) to network_error", () => {
    const e = new TypeError("fetch failed")
    const cliErr = orpcToCliError(e)
    expect(cliErr.code).toBe("network_error")
    // The original message lands in `hint`; the user-facing message is
    // the stable "could not reach the templates endpoint" line.
    expect(cliErr.message).toBe("could not reach the templates endpoint")
    expect(cliErr.hint).toBe("fetch failed")
  })

  it("maps any other Error to network_error with its message", () => {
    const e = new Error("Cannot parse response body, please check...")
    const cliErr = orpcToCliError(e)
    expect(cliErr.code).toBe("network_error")
    expect(cliErr.message).toBe("could not reach the templates endpoint")
    expect(cliErr.hint).toBe(
      "Cannot parse response body, please check...",
    )
  })

  it("maps a non-Error thrown value to network_error with a stringified message", () => {
    const cliErr = orpcToCliError("a string was thrown")
    expect(cliErr.code).toBe("network_error")
    expect(cliErr.message).toBe("could not reach the templates endpoint")
    expect(cliErr.hint).toBe("a string was thrown")
  })

  it("returns network_error for an ORPCError shape with non-numeric status", () => {
    // Defensive: a malformed ORPCError (status is a string, not a number)
    // should not match the shape and falls through to network_error.
    const e = {
      name: "ORPCError",
      code: "BOGUS",
      status: "500",
      message: "malformed",
      data: {},
    }
    const cliErr = orpcToCliError(e)
    expect(cliErr.code).toBe("network_error")
  })
})

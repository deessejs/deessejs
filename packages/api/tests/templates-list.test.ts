/**
 * TODO: rewrite this test against the oRPC procedure at
 * /docs/decisions/ADR-001-orpc-is-load-bearing and the
 * pattern at /docs/knowledge-base/orpc/testing-mocking
 *
 * The previous /api/v1/templates direct HTTP route was
 * removed when /templates migrated to oRPC. The tests
 * that asserted on ETag, Cache-Control, and X-RateLimit-*
 * headers are stale and now fail.
 *
 * The replacement should use the `call()` server-side
 * client (Pattern A) and exercise the procedure in
 * isolation. ETag and Cache-Control at the HTTP layer
 * are not part of the oRPC contract; they live in the
 * apps/web ISR cache, not in the procedure.
 */
import { describe, it } from "vitest"

describe("templates list (TODO)", () => {
  it("placeholder — see file header for migration plan", () => {
    // intentionally empty
  })
})

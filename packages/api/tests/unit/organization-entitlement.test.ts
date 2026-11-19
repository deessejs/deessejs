import { describe, expect, it } from "vitest"
import { isProSubscriptionEntitled } from "../../src/core/organization/entitlement.js"

describe("organization Pro subscription policy", () => {
  const now = new Date("2026-01-01T00:00:00Z")
  it.each(["active", "trialing"])("grants Pro for %s", (status) => {
    expect(isProSubscriptionEntitled(status, false, null, now)).toBe(true)
  })
  it.each(["past_due", "canceled", "incomplete", "unpaid"])("does not grant Pro for %s", (status) => {
    expect(isProSubscriptionEntitled(status, false, null, now)).toBe(false)
  })
  it("keeps a period-end cancellation entitled before period end", () => {
    expect(isProSubscriptionEntitled("active", true, new Date("2026-01-02T00:00:00Z"), now)).toBe(true)
  })
  it("ends period-end cancellation at period end", () => {
    expect(isProSubscriptionEntitled("active", true, now, now)).toBe(false)
  })
  it("does not grant access for a scheduled cancellation without an end date", () => {
    expect(isProSubscriptionEntitled("active", true, null, now)).toBe(false)
  })
})

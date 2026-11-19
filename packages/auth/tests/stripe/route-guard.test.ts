import { describe, expect, it } from "vitest"

import { isPersonalSubscriptionRequest } from "../../src/stripe/route-guard.js"

describe("Stripe subscription customer type guard", () => {
  it("blocks personal and unspecified customer types on every subscription action", () => {
    for (const path of [
      "/subscription/upgrade",
      "/subscription/list",
      "/subscription/cancel",
      "/subscription/restore",
      "/subscription/billing-portal",
    ]) {
      expect(isPersonalSubscriptionRequest(path, "user")).toBe(true)
      expect(isPersonalSubscriptionRequest(path, undefined)).toBe(true)
    }
  })

  it("permits organization customer requests and leaves unrelated routes alone", () => {
    expect(
      isPersonalSubscriptionRequest("/subscription/upgrade", "organization")
    ).toBe(false)
    expect(isPersonalSubscriptionRequest("/stripe/webhook", undefined)).toBe(
      false
    )
  })
})

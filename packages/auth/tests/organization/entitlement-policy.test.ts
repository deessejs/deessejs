import { describe, expect, it } from "vitest"
import { subscriptionGrantsPro } from "../../src/organization/entitlement.js"

const now = new Date("2026-11-20T12:00:00.000Z")
const active = {
  plan: "pro",
  status: "active",
  billingInterval: "month",
  endedAt: null,
  cancelAtPeriodEnd: false,
  periodEnd: new Date("2026-12-20T12:00:00.000Z"),
  seats: 1,
}

describe("organization Pro entitlement policy", () => {
  it.each(["active", "trialing"])(
    "grants recognized Pro status %s",
    (status) => {
      expect(subscriptionGrantsPro({ ...active, status }, now)).toBe(true)
    }
  )

  it.each([
    "past_due",
    "unpaid",
    "canceled",
    "incomplete",
    "paused",
    "unknown",
  ])("denies status %s without a grace period", (status) => {
    expect(subscriptionGrantsPro({ ...active, status }, now)).toBe(false)
  })

  it("keeps scheduled cancellation access through the paid period", () => {
    expect(
      subscriptionGrantsPro({ ...active, cancelAtPeriodEnd: true }, now)
    ).toBe(true)
  })

  it("denies scheduled cancellation at or beyond its paid-through date", () => {
    const ending = {
      ...active,
      cancelAtPeriodEnd: true,
      periodEnd: new Date("2026-11-20T12:00:00.000Z"),
    }
    expect(subscriptionGrantsPro(ending, now)).toBe(false)
    expect(subscriptionGrantsPro({ ...ending, periodEnd: null }, now)).toBe(
      false
    )
  })

  it("fails closed for unknown plans and ended records", () => {
    expect(subscriptionGrantsPro({ ...active, plan: "enterprise" }, now)).toBe(
      false
    )
    expect(subscriptionGrantsPro({ ...active, endedAt: now }, now)).toBe(false)
  })

  it("fails closed when purchased capacity is absent or zero", () => {
    expect(subscriptionGrantsPro({ ...active, seats: null }, now)).toBe(false)
    expect(subscriptionGrantsPro({ ...active, seats: 0 }, now)).toBe(false)
  })

  it("does not grant V1 Pro for annual or unknown billing intervals", () => {
    expect(
      subscriptionGrantsPro({ ...active, billingInterval: "year" }, now)
    ).toBe(false)
    expect(
      subscriptionGrantsPro({ ...active, billingInterval: null }, now)
    ).toBe(false)
  })
})

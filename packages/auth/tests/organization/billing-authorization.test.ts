import { describe, expect, it } from "vitest"
import { canAccessOrganizationBilling } from "../../src/organization/billing-authorization.js"

const mutations = [
  "upgrade-subscription",
  "cancel-subscription",
  "restore-subscription",
  "billing-portal",
] as const

describe("organization billing authorization", () => {
  it("allows every active organization member to read subscription details", () => {
    expect(canAccessOrganizationBilling("member", "list-subscription")).toBe(true)
    expect(canAccessOrganizationBilling("viewer", "list-subscription")).toBe(true)
    expect(canAccessOrganizationBilling("admin,member", "list-subscription")).toBe(true)
  })

  it("denies subscription reads without a current organization membership", () => {
    expect(canAccessOrganizationBilling(undefined, "list-subscription")).toBe(false)
    expect(canAccessOrganizationBilling(null, "list-subscription")).toBe(false)
  })

  it.each(mutations)("restricts %s to owners and admins", (action) => {
    expect(canAccessOrganizationBilling("owner", action)).toBe(true)
    expect(canAccessOrganizationBilling("admin", action)).toBe(true)
    expect(canAccessOrganizationBilling("member", action)).toBe(false)
    expect(canAccessOrganizationBilling("viewer", action)).toBe(false)
    expect(canAccessOrganizationBilling(undefined, action)).toBe(false)
  })
})

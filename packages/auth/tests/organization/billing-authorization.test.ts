import { describe, expect, it } from "vitest"

import { canAccessOrganizationBilling } from "../../src/organization/billing-authorization.js"

describe("organization billing authorization", () => {
  it("allows every member role to read subscription status", () => {
    for (const role of ["owner", "admin", "member", "custom-role"]) {
      expect(canAccessOrganizationBilling(role, "list-subscription")).toBe(true)
    }
  })

  it("allows only owners and admins to mutate billing", () => {
    for (const action of [
      "upgrade-subscription",
      "cancel-subscription",
      "restore-subscription",
      "billing-portal",
    ]) {
      expect(canAccessOrganizationBilling("owner", action)).toBe(true)
      expect(canAccessOrganizationBilling("admin", action)).toBe(true)
      expect(canAccessOrganizationBilling("member", action)).toBe(false)
      expect(canAccessOrganizationBilling("custom-role", action)).toBe(false)
    }
  })

  it("rejects unknown actions", () => {
    expect(canAccessOrganizationBilling("owner", "delete-everything")).toBe(
      false
    )
  })
})

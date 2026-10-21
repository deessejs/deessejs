import { describe, expect, it } from "vitest"

import {
  MANAGING_ROLES,
  hasManagingRole,
  hasRole,
  memberRoles,
} from "../../src/organization/roles.js"

/**
 * The role convention, in isolation.
 *
 * Better Auth stores the roles a member holds as a comma-separated
 * string, and every role check in the organization plugin splits on
 * commas and trims before comparing. These cases pin the same
 * convention, so a comparison that drifted from the plugin's would
 * fail here rather than in production.
 */
describe("memberRoles", () => {
  it("splits a comma-separated role string", () => {
    expect(memberRoles("admin,owner")).toEqual(["admin", "owner"])
    expect(memberRoles("member")).toEqual(["member"])
  })

  it("trims each role and drops the empty ones", () => {
    expect(memberRoles(" admin , owner ")).toEqual(["admin", "owner"])
    expect(memberRoles("admin,,owner")).toEqual(["admin", "owner"])
    expect(memberRoles("")).toEqual([])
  })
})

describe("hasRole", () => {
  it("grants a role the member holds", () => {
    expect(hasRole("owner", "owner")).toBe(true)
    expect(hasRole("admin,owner", "owner")).toBe(true)
    expect(hasRole("admin,owner", "admin")).toBe(true)
  })

  it("refuses a role the member does not hold", () => {
    expect(hasRole("member", "owner")).toBe(false)
    expect(hasRole("member,admin", "owner")).toBe(false)
  })

  it("does not match a role that is a substring of another one", () => {
    expect(hasRole("owner", "owne")).toBe(false)
    expect(hasRole("owner", "owners")).toBe(false)
  })
})

describe("hasManagingRole", () => {
  it("grants a managing role to an owner and to an admin", () => {
    expect(hasManagingRole("owner")).toBe(true)
    expect(hasManagingRole("admin")).toBe(true)
  })

  it("grants a managing role to a member who holds one among several", () => {
    expect(hasManagingRole("admin,owner")).toBe(true)
    expect(hasManagingRole("member,admin")).toBe(true)
  })

  it("refuses a plain member", () => {
    expect(hasManagingRole("member")).toBe(false)
    expect(hasManagingRole("member,viewer")).toBe(false)
  })

  it("fails closed on a role the application does not recognise", () => {
    expect(hasManagingRole("administrator")).toBe(false)
    expect(hasManagingRole("admin,superuser")).toBe(true)
    expect(hasManagingRole("superuser,admin")).toBe(true)
    expect(hasManagingRole("")).toBe(false)
  })
})

describe("MANAGING_ROLES", () => {
  it("holds exactly the roles that may administer an organization", () => {
    expect([...MANAGING_ROLES].sort()).toEqual(["admin", "owner"])
  })
})

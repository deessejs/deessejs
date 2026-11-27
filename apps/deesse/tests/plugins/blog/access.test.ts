import { describe, expect, it } from "vitest"
import { resolveBlogManagementAccess } from "../../../src/plugins/blog/access.js"

describe("Blog management access", () => {
  it("requires a session", () => {
    expect(resolveBlogManagementAccess(null)).toBe("unauthenticated")
  })

  it("allows exact administrator role tokens, including multi-role sessions", () => {
    expect(resolveBlogManagementAccess({ role: "admin" })).toBe("allowed")
    expect(resolveBlogManagementAccess({ role: "user,admin" })).toBe("allowed")
  })

  it("denies signed-in users without an exact administrator role token", () => {
    expect(resolveBlogManagementAccess({ role: "user" })).toBe("forbidden")
    expect(resolveBlogManagementAccess({ role: "administrator" })).toBe("forbidden")
    expect(resolveBlogManagementAccess({ role: "user, admin" })).toBe("forbidden")
    expect(resolveBlogManagementAccess({ role: ["user", "admin"] })).toBe("forbidden")
  })
})

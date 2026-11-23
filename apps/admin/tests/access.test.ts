import { describe, expect, it } from "vitest"
import { resolveAdminAccess } from "../src/access.js"

describe("admin dashboard access", () => {
  it("requires a session", () => {
    expect(resolveAdminAccess(null)).toBe("unauthenticated")
  })

  it("allows the Better Auth admin role, including multi-role sessions", () => {
    expect(resolveAdminAccess({ role: "admin" })).toBe("allowed")
    expect(resolveAdminAccess({ role: "user,admin" })).toBe("allowed")
    expect(resolveAdminAccess({ role: ["user", "admin"] })).toBe("allowed")
  })

  it("denies signed-in users without the admin role", () => {
    expect(resolveAdminAccess({ role: "user" })).toBe("forbidden")
    expect(resolveAdminAccess({})).toBe("forbidden")
  })
})

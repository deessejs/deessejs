import { describe, expect, it } from "vitest"
import { resolveAdminAccess } from "../src/internal/authorization/admin-access.js"

describe("admin dashboard access", () => {
  it("requires a session", () => {
    expect(resolveAdminAccess(null)).toBe("unauthenticated")
  })

  it("allows exact Better Auth admin role tokens, including multi-role sessions", () => {
    expect(resolveAdminAccess({ role: "admin" })).toBe("allowed")
    expect(resolveAdminAccess({ role: "user,admin" })).toBe("allowed")
  })

  it("denies signed-in users without the admin role", () => {
    expect(resolveAdminAccess({ role: "user" })).toBe("forbidden")
    expect(resolveAdminAccess({ role: "" })).toBe("forbidden")
    expect(resolveAdminAccess({ role: "administrator" })).toBe("forbidden")
    expect(resolveAdminAccess({ role: "user, admin" })).toBe("forbidden")
    expect(resolveAdminAccess({ role: " user, admin " })).toBe("forbidden")
    expect(resolveAdminAccess({ role: ["user", "admin"] })).toBe("forbidden")
    expect(resolveAdminAccess({})).toBe("forbidden")
  })
})

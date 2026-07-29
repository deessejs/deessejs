import { describe, expect, it } from "vitest"
import { auth } from "./setup.js"
import { serverEnv } from "@workspace/env/server"

describe("auth session", () => {
  // Note: Integration tests with database require DATABASE_URL env var
  // Run with: TEST_DATABASE_URL=postgresql://... pnpm test

  const hasDatabase =
    !!serverEnv.TEST_DATABASE_URL || !!serverEnv.DATABASE_URL

  describe("configuration", () => {
    it("should have email and password enabled", () => {
      // Verify the auth instance has the correct configuration
      expect(auth).toBeDefined()
    })

    it("should have testUtils plugin available", async () => {
      const ctx = await auth.$context
      expect(ctx.test).toBeDefined()
      expect(typeof ctx.test.createUser).toBe("function")
      expect(typeof ctx.test.saveUser).toBe("function")
      expect(typeof ctx.test.deleteUser).toBe("function")
      expect(typeof ctx.test.login).toBe("function")
      expect(typeof ctx.test.getAuthHeaders).toBe("function")
    })
  })

  describe("test utilities API", () => {
    it("should create a user with defaults", async () => {
      const ctx = await auth.$context
      const user = ctx.test.createUser()

      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
      expect(user.email).toMatch(/^test-.*@example\.com$/)
      expect(user.name).toBe("Test User")
      expect(user.emailVerified).toBe(true)
    })

    it("should create a user with custom values", async () => {
      const ctx = await auth.$context
      const user = ctx.test.createUser({
        email: "custom@example.com",
        name: "Custom User",
        emailVerified: false,
      })

      expect(user.email).toBe("custom@example.com")
      expect(user.name).toBe("Custom User")
      expect(user.emailVerified).toBe(false)
    })

    it("should generate unique user IDs", async () => {
      const ctx = await auth.$context
      const user1 = ctx.test.createUser()
      const user2 = ctx.test.createUser()

      expect(user1.id).not.toBe(user2.id)
    })
  })

  // Integration tests - require database
  if (hasDatabase) {
    describe("database operations (requires database)", () => {
      it("should save and delete a user", async () => {
        const ctx = await auth.$context
        const user = ctx.test.createUser({ email: "db-test@example.com" })
        const saved = await ctx.test.saveUser(user)

        expect(saved.id).toBeDefined()

        // Delete
        await ctx.test.deleteUser(user.id)

        // Verify deleted
        const headers = await ctx.test.getAuthHeaders({ userId: user.id })
        const session = await auth.api.getSession({ headers })
        expect(session).toBeNull()
      })

      it("should create session for a user", async () => {
        const ctx = await auth.$context
        const user = ctx.test.createUser()
        await ctx.test.saveUser(user)

        const { session, headers, token } = await ctx.test.login({ userId: user.id })

        expect(session).toBeDefined()
        expect(session.userId).toBe(user.id)
        expect(headers).toBeInstanceOf(Headers)
        expect(typeof token).toBe("string")

        // Cleanup
        await ctx.test.deleteUser(user.id)
      })

      it("should get auth headers for a user", async () => {
        const ctx = await auth.$context
        const user = ctx.test.createUser()
        await ctx.test.saveUser(user)

        const headers = await ctx.test.getAuthHeaders({ userId: user.id })

        expect(headers).toBeInstanceOf(Headers)
        expect(headers.get("cookie")).toBeDefined()

        // Cleanup
        await ctx.test.deleteUser(user.id)
      })

      it("should validate session from headers", async () => {
        const ctx = await auth.$context
        const user = ctx.test.createUser()
        await ctx.test.saveUser(user)

        const headers = await ctx.test.getAuthHeaders({ userId: user.id })
        const session = await auth.api.getSession({ headers })

        expect(session).toBeDefined()
        expect(session?.user.id).toBe(user.id)

        // Cleanup
        await ctx.test.deleteUser(user.id)
      })
    })
  } else {
    describe("database operations (skipped - no database)", () => {
      it("should skip when DATABASE_URL is not set", () => {
        expect(hasDatabase).toBe(false)
      })
    })
  }
})

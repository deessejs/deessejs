import { describe, expect, it, vi } from "vitest"
import { mailer } from "@workspace/email"
import { auth } from "./setup.js"
import { serverEnv } from "@workspace/env/server"

describe("auth email callbacks", () => {
  const hasDatabase =
    !!serverEnv.TEST_DATABASE_URL || !!serverEnv.DATABASE_URL

  describe("configuration", () => {
    it("should have sendResetPassword wired", () => {
      // The callback exists and is a function. We don't invoke it here because
      // doing so would require a real user + DB. The integration tests below
      // exercise the full path with vi.spyOn.
      expect(auth.options.emailAndPassword?.sendResetPassword).toBeDefined()
      expect(typeof auth.options.emailAndPassword?.sendResetPassword).toBe(
        "function",
      )
    })

    it("should have sendVerificationEmail wired", () => {
      expect(
        auth.options.emailVerification?.sendVerificationEmail,
      ).toBeDefined()
      expect(
        typeof auth.options.emailVerification?.sendVerificationEmail,
      ).toBe("function")
    })
  })

  // Integration tests - require database
  if (hasDatabase) {
    describe("database operations (requires database)", () => {
      it("sendResetPassword calls mailer.send with reset-password tag", async () => {
        const spy = vi
          .spyOn(mailer, "send")
          .mockResolvedValue({ id: "test-id" })

        const ctx = await auth.$context
        const user = ctx.test.createUser({ email: "reset@example.com" })
        await ctx.test.saveUser(user)

        await auth.api.requestPasswordReset({
          body: {
            email: user.email,
            redirectTo: "http://localhost:3000/reset-password",
          },
        })

        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            to: user.email,
            subject: "Reset your password",
            tags: [{ name: "flow", value: "reset-password" }],
          }),
        )

        // Cleanup
        await ctx.test.deleteUser(user.id)
        spy.mockRestore()
      })

      it("sendVerificationEmail calls mailer.send with verify-email tag on signup", async () => {
        const spy = vi
          .spyOn(mailer, "send")
          .mockResolvedValue({ id: "test-id" })

        // signUpEmail triggers sendOnSignUp → sendVerificationEmail
        await auth.api.signUpEmail({
          body: {
            email: `verify-${Date.now()}@example.com`,
            password: "password123",
            name: "Verify User",
          },
        })

        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: "Verify your email",
            tags: [{ name: "flow", value: "verify-email" }],
          }),
        )

        spy.mockRestore()
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
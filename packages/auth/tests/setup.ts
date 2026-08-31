/**
 * Auth test utilities
 *
 * Provides test auth instance with testUtils plugin.
 * Import this in your tests instead of the production auth.
 */
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { testUtils } from "better-auth/plugins"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "@workspace/database/schema"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"

// Test database connection
const pool = postgres(serverEnv.TEST_DATABASE_URL, { max: 1 })
const db = drizzle(pool)

// Test auth instance with testUtils
export const auth = betterAuth({
  // Mirror the production dynamic form so tests exercise the same
  // per-request host resolution. Test runs are always local; localhost
  // is included via the NODE_ENV=development branch in the prod config.
  // We pin the object here (instead of importing from src/auth.ts) to
  // keep this file free of the email/transport wiring — the test auth
  // intentionally drops those plugins.
  //
  // `fallback` mirrors the production value (http://localhost:3000 in
  // dev). Without it, direct `auth.api.X({ ... })` calls that don't
  // forward request headers throw "Dynamic baseURL could not be
  // resolved". Better Auth reads fallback from each instance's own
  // config at construction time, so we duplicate the value here. See
  // packages/auth/src/auth.ts and pitfalls.md §5 for the rationale.
  baseURL: {
    allowedHosts: [
      "app.deessejs.com",
      "deessejs.com",
      "docs.deessejs.com",
      "*.deessejs.com",
      "*.vercel.app",
      "localhost:*",
    ],
    protocol: "http",
    fallback: "http://localhost:3000",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Test setup: fire-and-forget is fine for test isolation.
      // eslint-disable-next-line no-restricted-syntax
      void sendAuthEmail({
        to: user.email,
        subject: "Reset your password",
        react: templates.ResetPassword({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "reset-password" }],
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Test setup: fire-and-forget is fine for test isolation.
      // eslint-disable-next-line no-restricted-syntax
      void sendAuthEmail({
        to: user.email,
        subject: "Verify your email",
        react: templates.VerifyEmail({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "verify-email" }],
      })
    },
  },
  plugins: [
    testUtils(),
  ],
})

// Export types
export type TestHelpers = Awaited<ReturnType<typeof auth.$context>>["test"]

import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"

/**
 * Mount path for the auth API on the server. Mirrors
 * `API_AUTH_PATH` in `packages/api/src/base-path.ts` — kept
 * here as a string to avoid importing across `apps/app` <-> `api`
 * <-> `auth` boundaries. The two values must stay in sync; if one
 * moves, update the other.
 */
const AUTH_BASE_PATH = "/api/v1/auth" as const

/**
 * Log a transactional email failure. Hook your observability vendor here
 * (Sentry.captureException, metrics.increment("email_send_failure_total", {flow}),
 * structured log shipping, etc.). Kept as a thin local function so the auth
 * config stays pure and the observability layer is swappable.
 */
function logEmailFailure(flow: string, userId: string, error: string): void {
	console.error(
		`[auth] ${flow} email failed`,
		JSON.stringify({ userId, flow, error }),
	)
}

export const auth = betterAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,
  // Strip the API prefix before Better Auth's internal route matcher
  // looks for `/sign-up/email`, `/get-session`, etc. Without this,
  // the server returns 404 on every auth route because it tries to
  // match `/api/v1/auth/sign-up/email` against its internal routes,
  // which are mounted at the root. The Hono catch-all already routes
  // `/api/v1/auth/*` to `auth.handler(c.req.raw)` — Better Auth
  // then needs to know to strip the prefix back off.
  basePath: AUTH_BASE_PATH,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: [
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://localhost:3001"]
      : []),
    ...serverEnv.ALLOWED_ORIGINS,
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Fire-and-forget for response latency (per Better Auth's timing-attack
    // guidance), but inspect the result asynchronously so failures are
    // observable. Do not surface to the user — forgot-password must keep
    // its "always succeed" anti-enumeration UX.
    sendResetPassword: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Reset your password",
        react: templates.ResetPassword({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "reset-password" }],
      }).then((result) => {
        if (!result.ok) logEmailFailure("reset-password", user.id, result.error)
      })
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    // Same pattern as sendResetPassword: fire-and-forget for latency, observe
    // the result asynchronously. Unlike forgot-password, this flow happens
    // post-authentication — failing here may warrant a user-visible toast
    // in the calling page (e.g. settings/email-form.tsx), but the auth
    // callback itself must not throw to keep Better Auth's contract.
    sendVerificationEmail: async ({ user, url }) => {
      void sendAuthEmail({
        to: user.email,
        subject: "Verify your email",
        react: templates.VerifyEmail({ url, userEmail: user.email }),
        tags: [{ name: "flow", value: "verify-email" }],
      }).then((result) => {
        if (!result.ok) logEmailFailure("verify-email", user.id, result.error)
      })
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  experimental: {
    joins: true,
  },

  plugins: [nextCookies()],
})

// Type exports for consumers
export type AuthInstance = typeof auth
export type { Session, User } from "better-auth"
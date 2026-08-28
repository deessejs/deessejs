import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { bearer, deviceAuthorization } from "better-auth/plugins"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"

/**
 * Better Auth `basePath` — the URL prefix the handler claims.
 *
 * MUST match the Hono mount at `packages/api/src/http/routes/http.ts:57`
 * (`api.on(["POST", "GET"], "/auth/*", ...)`) composed with the
 * Hono app's `basePath("/api/v1")`. The two must agree, otherwise
 * Better Auth returns 404 for every `/api/v1/auth/*` URL — the
 * Hono middleware fires but `auth.handler` rejects the request
 * because the path does not start with `/api/auth`.
 *
 * Cannot import from `@workspace/api/base-path` because the API
 * package depends on `@workspace/auth` (transitively, via
 * `packages/api/src/http/routes/http.ts` importing `auth`).
 * Defining the literal here keeps the invariant local to auth
 * and avoids the cycle. If the basePath ever changes, this
 * constant and the Hono mount must change together.
 *
 * See ADR-015 for the full root-cause analysis and the prefix
 * alignment invariant.
 */
const AUTH_BASE_PATH = "/api/v1/auth"

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
  basePath: AUTH_BASE_PATH,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: [
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://localhost:3001"]
      : []),
    // Env-driven production origins (ADR-023). Built from the
    // inter-app URL fields so adding a new deployed origin only
    // requires updating WEB_URL / APP_URL / DOCS_URL — no code
    // change here. new URL(x).origin strips path and query.
    ...[serverEnv.WEB_URL, serverEnv.APP_URL, serverEnv.DOCS_URL].map(
      (u) => new URL(u).origin,
    ),
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
    // Cross-subdomain cookies (ADR-023). When PARENT_DOMAIN is set
    // (production only), Better Auth sets Domain=.PARENT_DOMAIN on
    // the session cookie so apps/web (deessejs.com) and apps/app
    // (app.deessejs.com) share it. The `!` is safe: the env schema's
    // superRefine gate fails in production if PARENT_DOMAIN is unset,
    // so this code path never runs with an undefined value in prod.
    // In dev/test the feature is a no-op because the gate short-circuits.
    ...(serverEnv.PARENT_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: serverEnv.PARENT_DOMAIN,
          },
          defaultCookieAttributes: {
            sameSite: "none",
          },
        }
      : {}),
  },

  experimental: {
    joins: true,
  },

  plugins: [
    // Device authorization (ADR-020): the device-code flow that lets the
    // CLI obtain a session token without a password. The plugin adds
    // /device/code, /device/token, /device, /device/approve, /device/deny
    // under the existing /api/v1/auth mount. `verificationUri` is pinned to
    // the relative path so the plugin can be configured independently of
    // the deployment origin. The plugin must sit before `nextCookies()`
    // because `nextCookies()` must remain the last entry (Next.js integration
    // requirement).
    deviceAuthorization({
      verificationUri: "/device",
    }),
    // Bearer plugin (ADR-022): lets `auth.api.getSession` (and
    // `/api/v1/auth/get-session` from the typed client) resolve a session
    // from an `Authorization: Bearer <token>` header instead of a session
    // cookie. Required by the CLI's `fetchUserIdentity` follow-up after
    // `/device/token` returns: the CLI is a stateless Node process with no
    // cookie jar, so the only way to learn the user tied to the device-flow
    // session token is to present it as a Bearer header. The default
    // `requireSignature: false` accepts the raw unsigned session token
    // returned by `/device/token` directly. The plugin is stateless (no
    // schema change). Per Better Auth docs (docs/plugins/bearer) and the
    // device-authorization docs' "Example: CLI Application" callout.
    bearer(),
    nextCookies(),
  ],
})

// Type exports for consumers
export type AuthInstance = typeof auth
export type { Session, User } from "better-auth"
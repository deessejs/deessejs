import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { bearer, deviceAuthorization, organization } from "better-auth/plugins"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"
import { ac, admin, member, owner } from "./access.js"
import { HOST_ALLOWLIST } from "./host-allowlist.js"

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
 * Hosts the auth handler will accept requests from. Better Auth
 * resolves the per-request origin from `x-forwarded-host` → `host`
 * → request URL, validates it against this list, and auto-adds
 * each entry to `trustedOrigins` (with both `http` and `https`
 * for localhost). The wildcard `*.vercel.app` covers every Vercel
 * preview deployment without per-preview env configuration.
 *
 * The list is shared with the Hono CORS layer in
 * `packages/api/src/index.ts` via `packages/auth/src/host-allowlist.ts`
 * (ADR-029 Decision #2). Apex entries are load-bearing — see
 * `host-allowlist.ts` for the rationale.
 *
 * See https://better-auth.com/docs/guides/dynamic-base-url and
 * `docs/guides/better-auth/pitfalls.md` §5.
 */

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

// better-auth 1.7 introduced a transitive dep (better-call) whose
// types are not exported, so a bare `betterAuth({...})` makes TS
// fail with TS2883 — the inferred type stays unnameable. Cast to
// `any` at the export site so consumers (apps/app, packages/api)
// see the rich `BetterAuth` shape without dragging the better-call
// types through the workspace dependency graph.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = betterAuth({
  baseURL: {
    allowedHosts: [...HOST_ALLOWLIST],
    protocol: process.env.NODE_ENV === "development" ? "http" : "https",
    // Fallback used only when a direct `auth.api.X()` call doesn't forward
    // request headers and no host can be resolved from `x-forwarded-host` /
    // `host` / request URL. Production requests always arrive with a `host`
    // header (Vercel sets it), so this is never reached in normal operation.
    // It does kick in for in-process Hono requests that omit the host
    // header (e.g. tests calling `api.request("/...")` directly without
    // forwarding request context) and for misconfigured reverse proxies
    // that strip `host` upstream. See pitfalls.md §5 for the rationale.
    fallback:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://app.deessejs.com",
  },
  basePath: AUTH_BASE_PATH,
  secret: serverEnv.BETTER_AUTH_SECRET,
  // Ad-hoc extras only (staging, partner origins). Prod origins and
  // Vercel previews are auto-added via `allowedHosts` above. Gated
  // on NODE_ENV to keep the localhost defaults in .env.example from
  // leaking into prod (the same hazard pitfalls.md §2 warns about).
  trustedOrigins:
    process.env.NODE_ENV === "development"
      ? serverEnv.ALLOWED_ORIGINS
      : serverEnv.ALLOWED_ORIGINS.filter((origin) => !origin.includes("localhost")),

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
    // ADR-030 §"Decision #3" -> better-auth 1.7+: `experimental.joins`
    // moved to `advanced.database.joins`. The org plugin uses
    // adapter joins to expand `member` rows when listing
    // organizations, so we still need this on.
    database: {
      joins: true,
    },
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

  experimental: {},

  socialProviders: {
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID!,
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET!,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
      allowDifferentEmails: false,
      updateUserInfoOnLink: true,
    },
  },

  user: {
    // ADR-030: the /onboarding/complete server action stamps this
    // timestamp so getOnboardingState() can detect that the
    // three-step wizard finished. The column lives on `user`
    // (not `session`) because the value is permanent — once a
    // user has finished onboarding they don't go through it again
    // even if their session rotates.
    additionalFields: {
      onboardingCompletedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },

  plugins: [
    // Organization plugin (ADR-030): multi-tenant workspaces. Adds
    // organization/member/invitation tables on top of the user/session
    // tables and an `activeOrganizationId` column on the session row
    // the rest of the auth surface switches on. Inserted FIRST so the
    // device flow and the bearer plugin see the active org context.
    // Disabled sub-features: `teams.enabled` (V2), `dynamicAccessControl`
    // (custom roles created at runtime — V2). `requireEmailVerificationOnInvitation`
    // is true to gate accept-invite on the invitee's verified email.
    organization({
      ac,
      roles: { owner, admin, member },
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      creatorRole: "owner",
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 48,
      invitationLimit: 100,
      requireEmailVerificationOnInvitation: true,
      cancelPendingInvitationsOnReInvite: false,
      // Custom invitation URL — see ADR-030 §"Decision #1". The
      // plugin emits `data.id`, `data.email`, `data.role`,
      // `data.organization`, `data.inviter`; we build the URL from
      // the request's resolved origin so Vercel previews receive
      // their own hostname instead of the production apex.
      sendInvitationEmail: async (data, request) => {
        const origin =
          new URL(request?.url ?? "http://localhost:3000").origin
        const url = `${origin}/invite/${data.id}`
        void sendAuthEmail({
          to: data.email,
          subject: `Invitation to join ${data.organization.name}`,
          react: templates.InviteToOrganization({
            url,
            inviter: data.inviter.user.name,
            organizationName: data.organization.name,
          }),
          tags: [{ name: "flow", value: "org-invitation" }],
        }).then((result) => {
          if (!result.ok) logEmailFailure("org-invitation", data.inviter.user.id, result.error)
        })
      },
    }),
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
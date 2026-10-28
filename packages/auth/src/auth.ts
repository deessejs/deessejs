import { betterAuth } from "better-auth"
import type { BetterAuthOptions } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { admin, bearer, deviceAuthorization } from "better-auth/plugins"
import { db } from "@workspace/database"
import * as schema from "@workspace/database"
import { serverEnv } from "@workspace/env/server"
import { sendAuthEmail, templates } from "@workspace/email"
import { HOST_ALLOWLIST } from "./host-allowlist.js"
import { organizationPlugin } from "./organization/plugin.js"

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
 * A Hono↔Better-Auth basePath misalignment caused every
 * `/api/v1/auth/*` URL to 404 in production; the prefix invariant
 * is load-bearing and must hold across both sides.
 */
const AUTH_BASE_PATH = "/api/v1/auth"

/**
 * Hosts the auth handler will accept requests from. Better Auth
 * resolves the per-request origin from `x-forwarded-host` → `host`
 * → request URL, validates it against this list, and auto-adds
 * each entry to `trustedOrigins` (with both `http` and `https`
 * for localhost). Vercel preview hosts are scoped to the app, web, docs
 * and agent projects in our Vercel team. See `host-allowlist.ts` for the
 * enforced patterns.
 *
 * The list is shared with the Hono CORS layer in
 * `packages/api/src/index.ts` via `packages/auth/src/host-allowlist.ts`.
 * Apex entries are load-bearing — see `host-allowlist.ts` for the
 * rationale.
 *
 * See https://better-auth.com/docs/guides/dynamic-base-url.
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
    JSON.stringify({ userId, flow, error })
  )
}

// `authConfig` is annotated with `BetterAuthOptions` *and* validated
// with `satisfies BetterAuthOptions`. The annotation is load-bearing:
// without it, `tsc --noEmit` raises TS2883 on the literal because
// the inferred Better Auth schema type reaches into transitive
// packages (zod / better-call / @better-auth/core) whose versions
// do not unify in the workspace. Verified locally on 1.7.7 by
// removing the annotation and re-running `tsc --noEmit`.
//
// Trade-off: the annotation widens the literal type to the bare
// `BetterAuthOptions` interface, which loses the plugin-augmented
// shape in the inferred `$Infer` chain on the public `auth` export.
// The public `User` / `AuthSession` types therefore do not see the
// admin plugin's `role` / `banned` / `banReason` / `banExpires`
// fields automatically; we re-augment them by hand below so
// consumers (`apps/app/lib/admin-auth.ts`, the settings rail,
// `c.var.user` typing in `packages/api/src/http/env.ts`) keep
// end-to-end type safety. The `as` cast on the `auth` export
// below preserves the `$Infer` chain used by those consumers.
const authConfig: BetterAuthOptions = {
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
      : serverEnv.ALLOWED_ORIGINS.filter(
          (origin) => !origin.includes("localhost")
        ),

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Email-enumeration protection: when `requireEmailVerification: true`,
    // Better Auth fabricates a synthetic user record whenever a
    // sign-up response must be indistinguishable from a duplicate
    // (and in a few other anti-enumeration paths). The synthetic
    // record is what gets returned in the JSON response, and it
    // must include the admin-plugin fields so the response shape
    // matches a real user — otherwise the client would observe a
    // missing `role` on a real account and a present `role` on a
    // synthetic one, which is itself an enumeration leak.
    //
    // The callback fires on the synthetic path only; real
    // sign-ups go through the normal create flow and do not pass
    // through this hook. Reading `user.role` on a record that
    // does not have the field would return `undefined`, not throw
    // — the failure mode this callback prevents is *response
    // shape drift*, not a runtime crash. The `id` and
    // `...coreFields` are required, `...additionalFields` lets
    // the plugin layer on top, and we set the plugin-owned
    // defaults so the synthetic record is consistent with the
    // migration backfill for ordinary users.
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
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
    // 1.7 moved the joins flag out of `experimental`. Behaviour matches
    // what `experimental.joins: true` did in 1.6.x — the ORM performs
    // JOIN-based hydration instead of N+1 selects. Keep off for
    // adapters that don't ship Drizzle relations, and verify the
    // generated relations cover `deviceCode ↔ user` after regeneration.
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

  socialProviders: {
    ...(serverEnv.GITHUB_CLIENT_ID && serverEnv.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: serverEnv.GITHUB_CLIENT_ID,
            clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
      allowDifferentEmails: false,
      updateUserInfoOnLink: true,
    },
  },

  // The two endpoints that read an organization by slug are disabled.
  //
  // They answer a question about an arbitrary organization, and when
  // the caller is not a member of it, they clear the session's active
  // organization before refusing. That is a state change performed by a
  // GET, and the origin check does not cover GET, so a third-party page
  // can cause a signed-in user's active organization to be cleared by
  // navigating to one of them. HTTP requires a GET to be safe.
  //
  // The application's own organization procedures answer the same
  // question, for the same slug, with the caller's membership and role
  // checked and with no effect on the session.
  //
  // The create endpoint is disabled for a different reason: it takes
  // the slug from the body, and the slug is the server's. A caller
  // that reaches it directly would choose the slug, and the guarantee
  // that the slug is generated would hold for the callers that happen
  // to go through the procedure and for nobody else. The application's
  // own procedure generates it, retries a collision against the
  // database, and refuses a name it cannot turn into a usable slug.
  //
  // The server-side call the procedure makes is not affected:
  // `disabledPaths` is applied by the request router, and the call
  // reaches the endpoint's function directly.
  disabledPaths: [
    "/organization/get-organization",
    "/organization/get-full-organization",
    "/organization/create",
  ],

  plugins: [
    // Device authorization: the device-code flow that lets the CLI obtain
    // a session token without a password. The plugin adds /device/code,
    // /device/token, /device, /device/approve, /device/deny under the
    // existing /api/v1/auth mount. `verificationUri` is pinned to the
    // relative path so the plugin can be configured independently of the
    // deployment origin. The plugin must sit before `nextCookies()`
    // because `nextCookies()` must remain the last entry (Next.js
    // integration requirement).
    deviceAuthorization({
      verificationUri: "/device",
    }),
    // Bearer plugin: lets `auth.api.getSession` (and `/api/v1/auth/get-session`
    // from the typed client) resolve a session from an `Authorization: Bearer
    // <token>` header instead of a session cookie. Required by the CLI's
    // `fetchUserIdentity` follow-up after `/device/token` returns: the CLI
    // is a stateless Node process with no cookie jar, so the only way to
    // learn the user tied to the device-flow session token is to present it
    // as a Bearer header. The default `requireSignature: false` accepts the
    // raw unsigned session token returned by `/device/token` directly. The
    // plugin is stateless (no schema change). Per Better Auth docs
    // (docs/plugins/bearer) and the device-authorization docs' "Example:
    // CLI Application" callout.
    bearer(),
    // Admin plugin (RFC: "DeesseJS Administration Routes — V1"): adds the
    // `role`, `banned`, `banReason`, and `banExpires` columns to the
    // `user` table and the `impersonatedBy` column to the `session` table.
    // V1 uses only `role` to gate the `/admin/*` route area in `apps/app`.
    // The plugin's native management endpoints (list, ban, impersonate,
    // …) ship as part of the documented installation but are not exposed
    // in the V1 UI; see RFC §2 for the explicit out-of-scope list. The
    // options are passed explicitly to document the V1 role model: every
    // account is either `user` or `admin`, no allowlist, no custom access
    // control. The plugin must sit before `nextCookies()` (Next.js
    // integration requirement).
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    // Organization plugin: full configuration lives in
    // `./organization/plugin.ts`; this entry is a one-liner. Plugin
    // must sit before `nextCookies()` (Next.js integration requirement).
    organizationPlugin,
    nextCookies(),
  ],
} satisfies BetterAuthOptions

// Public `auth` export. The `as ReturnType<typeof betterAuth<typeof
// authConfig>>` cast is the documented fix for the TS2883 "inferred
// type cannot be named without a reference to zod / better-call /
// @better-auth/core" error that surfaces on the public `auth`
// export when `betterAuth({...})` is composed with multiple plugins
// (admin, deviceAuthorization, bearer, nextCookies). Verified on
// 1.7.7 by removing the cast and re-running `tsc --noEmit`. The
// cast preserves the `$Infer` chain (used by
// `packages/api/src/http/env.ts` for `c.var.user` /
// `c.var.session`) and the plugin-augmented shape on the instance
// type.
//
// Design choice, not a runtime regression: every plugin endpoint
// still works. The cast is *narrow* — it only affects the public
// type of the `auth` export. The plugin augmentation (admin →
// `User.role`, etc.) is still on the instance at runtime; only the
// static type-flow through `User` is masked. The manual `User`
// re-augmentation below mirrors the plugin's server-side fields
// (`role`, `banned`, `banReason`, `banExpires`) so consumers
// (`apps/app/lib/admin-auth.ts`, the settings rail) keep
// end-to-end type safety on `user.role`.
export const auth = betterAuth(authConfig) as ReturnType<
  typeof betterAuth<typeof authConfig>
>

// Type exports for consumers
//
// Inferred from the configured `auth` instance so the public type
// surface tracks the plugin stack. `Session` is the session record
// (matching the shape Better Auth re-exports); `User` is the
// session's `user` payload augmented with the admin plugin's
// `role` / `banned` / `banReason` / `banExpires` fields (the
// augmentation is the matching fix for the explicit
// `BetterAuthOptions` annotation on `authConfig`, which widens the
// inferred `$Infer` chain and drops the plugin-augmented shape —
// see the comment block on `authConfig`); `AuthSession` is the
// full `{ user, session }` envelope returned by `auth.api.getSession`
// and the typed client. The legacy re-export of `Session`/`User`
// from the `better-auth` package was unused in production code
// (only documentation snippets referenced it), so swapping it for
// the inferred types does not break any real consumer.
export type AuthInstance = typeof auth
export type Session = typeof auth.$Infer.Session.session & {
  /**
   * The organization the session currently points at.
   *
   * The plugin declares this as a session field
   * (`organization.mjs`, `schema.session.fields.activeOrganizationId`) and
   * reads it off the session itself, so the runtime object carries it.
   * The `BetterAuthOptions` annotation on `authConfig` drops the
   * plugin-augmented `$Infer` chain, so the type does not. This is the
   * same hand-augmentation `User` below already carries for the admin
   * plugin's fields.
   */
  activeOrganizationId?: string | null
}
export type User = typeof auth.$Infer.Session.user & {
  role: string | null
  banned: boolean | null
  banReason: string | null
  banExpires: Date | null
}
export type AuthSession = {
  user: User
  session: Session
}

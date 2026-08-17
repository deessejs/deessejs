import { z } from "zod"

/**
 * Server-side env contract.
 *
 * Required in every runtime that imports `@workspace/env/server`:
 *   - DATABASE_URL          Postgres connection string
 *
 * Optional (defaults shown):
 *   - NODE_ENV              "development" | "test" | "production"
 *   - TEST_DATABASE_URL     Alias for DATABASE_URL when unset
 *   - BETTER_AUTH_SECRET    >=32 chars in prod; optional in dev/test
 *                           (better-auth auto-generates a dev-only default)
 *                           Generate: openssl rand -base64 32
 *   - AUTH_SECRET           Alias for BETTER_AUTH_SECRET (also validated
 *                           against the 32-char minimum when present)
 *   - BETTER_AUTH_URL       Defaults to http://localhost:3000
 *   - ALLOWED_ORIGINS       CSV. Defaults to localhost dev origins.
 *
 * BETTER_AUTH_SECRET note: better-auth validates the secret internally.
 * In production (NODE_ENV=production), it throws if unset. In dev/test,
 * it uses a built-in default. Making it optional here lets the test
 * suite run without env vars while still enforcing it at prod startup.
 */

const csv = z.string().transform((s) =>
  s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
)

/**
 * Alias resolution lives in the consumer (server.ts), not in the schema.
 *
 * `AUTH_SECRET` is a historical alias for `BETTER_AUTH_SECRET`.
 * `TEST_DATABASE_URL` is a historical alias for `DATABASE_URL`. Both
 * pairs are declared as separate optional fields; the .superRefine
 * accepts either; the production gate looks at the resolved value
 * (alias wins when the canonical is unset). The two consumers of the
 * schema (this file + scripts/env-check.ts) honour the same convention
 * because the rule is symmetric: at least one of each pair must hold
 * its invariant under NODE_ENV=production.
 *
 * Why an object-level .transform() would be wrong: Zod 4 runs
 * .superRefine() before .transform(), and .transform().pipe() around
 * a stricter object drops the `? optional` markers in the inferred
 * type, so .pipe() loses the `BETTER_AUTH_SECRET?: string` shape that
 * `ServerEnv` consumers depend on. Avoiding the transform keeps the
 * inferred type matching what consumers expect.
 */
export const serverInputShape = {
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  TEST_DATABASE_URL: z.string().url().optional(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  // Optional. In production, better-auth throws if unset.
  // In dev/test, better-auth uses a built-in default secret.
  // We only validate length when the value is present (prevents crash in test).
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "Run: openssl rand -base64 32 (>= 32 chars required)")
    .optional(),
  // Historical alias for BETTER_AUTH_SECRET. Same length constraint when
  // present; the resolution happens in the consumer (server.ts) and in
  // scripts/env-check.ts, both of which treat either name as the secret.
  AUTH_SECRET: z.string().min(32).optional(),
  ALLOWED_ORIGINS: csv.default([]),

  // Mailer — Resend (prod)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().default("onboarding@resend.dev"),
  RESEND_FROM_NAME: z.string().min(1).default("DeesseJS"),

  // Mailer — transport selector
  //   "console" (default) → logs to stdout, zero infrastructure
  //   "resend"            → production, uses RESEND_API_KEY
  MAIL_TRANSPORT: z.enum(["console", "resend"]).default("console"),

  // Per-IP rate limit on /api/v1/templates and /api/v1/version.
  // In-memory fixed window per Vercel instance; see the rate-limit
  // middleware comment for the trade-off analysis. 100/min is enough
  // for a CLI that polls once per session and a marketing site that
  // revalidates every 10 minutes.
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(100),

  // GitHub API token (optional). When unset, the templates enricher
  // hits GitHub anonymously (60 req/h). Set in production to lift
  // the rate limit to 5000 req/h. See packages/api/src/core/templates/enrich.ts.
  GITHUB_TOKEN: z.string().optional(),

  // GitHub OAuth credentials (optional). Used by better-auth's
  // `socialProviders.github` block in packages/auth/src/auth.ts to
  // light up "Continue with GitHub". CI / Vitest run without these
  // (mirrors BETTER_AUTH_SECRET's optional treatment). The required
  // `user:email` scope is configured on the OAuth App side
  // (Permissions > Account Permissions > Email Addresses > Read-only),
  // NOT here. See ADR-013.
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
}

export const serverSchema = z.object(serverInputShape).superRefine(
  (data, ctx) => {
    // Production-only invariants. Skipped in dev/test so contributors don't
    // need a full .env to start the app. Enforced in prod because each of these
    // silently degrades to a stub (e.g. dummy `{}` DB, default localhost URL,
    // empty Resend key) that looks fine in dev and breaks in prod.
    if (data.NODE_ENV !== "production") return

    if (!data.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        message:
          "DATABASE_URL is required in production (was optional in dev to keep onboarding simple)",
        path: ["DATABASE_URL"],
      })
    }

    // Either BETTER_AUTH_SECRET or AUTH_SECRET must hold the production
    // invariant — both names are valid. The gate looks at both, so the
    // alias works at parse time, not via a post-hoc transform.
    const secret = data.BETTER_AUTH_SECRET ?? data.AUTH_SECRET
    if (!secret || secret.length < 32) {
      ctx.addIssue({
        code: "custom",
        message:
          "BETTER_AUTH_SECRET or AUTH_SECRET (>= 32 chars) is required in production. Run: openssl rand -base64 32",
        path: ["BETTER_AUTH_SECRET"],
      })
    }

    if (data.MAIL_TRANSPORT === "resend" && !data.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        message:
          "RESEND_API_KEY is required when MAIL_TRANSPORT=resend (or use MAIL_TRANSPORT=console for dev)",
        path: ["RESEND_API_KEY"],
      })
    }
  }
)

/**
 * Client-side env contract. Only NEXT_PUBLIC_* values, safe to bundle to the
 * browser. Values are inlined at build time by the bundler.
 *
 * Authored against `createEnv({ ...runtimeEnvStrict })`, so each key must
 * appear in the destructured literal passed by `client.ts`. Adding a key to
 * this schema without listing it in `client.ts` is a compile-time error.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("DeesseJS"),
  NEXT_PUBLIC_APP_DESCRIPTION: z
    .string()
    .min(1)
    .default("SaaS application built with Next.js and shared UI components"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
})

export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>

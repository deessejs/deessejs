import { z } from "zod"

/**
 * Server-side env contract.
 *
 * Required in every runtime that imports `@workspace/env/server`:
 *   - DATABASE_URL          Postgres connection string
 *
 * Optional (defaults shown):
 *   - NODE_ENV              "development" | "test" | "production"
 *   - TEST_DATABASE_URL     Falls back to DATABASE_URL when unset
 *   - BETTER_AUTH_SECRET    >=32 chars in prod; optional in dev/test
 *                           (better-auth auto-generates a dev-only default)
 *                           Generate: openssl rand -base64 32
 *   - AUTH_SECRET           Alias for BETTER_AUTH_SECRET (resolved at the
 *                           package boundary, so call sites only see the
 *                           resolved value)
 *   - BETTER_AUTH_URL       Defaults to http://localhost:3000
 *   - ALLOWED_ORIGINS       CSV. Defaults to localhost dev origins.
 *
 * BETTER_AUTH_SECRET note: better-auth validates the secret internally.
 * In production (NODE_ENV=production), it throws if unset. In dev/test,
 * it uses a built-in default. Making it optional here lets the test
 * suite run without env vars while still enforcing it at prod startup.
 */

const csv = z
  .string()
  .transform((s) => s.split(",").map((p) => p.trim()).filter(Boolean))

export const serverSchema = z.object({
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
  AUTH_SECRET: z.string().min(32).optional(),
  ALLOWED_ORIGINS: csv.default([]),

  // Mailer — Resend (prod)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .email()
    .default("onboarding@resend.dev"),
  RESEND_FROM_NAME: z.string().min(1).default("SaaS Template"),

  // Mailer — transport selector
  //   "console" (default) → logs to stdout, zero infrastructure
  //   "resend"            → production, uses RESEND_API_KEY
  MAIL_TRANSPORT: z
    .enum(["console", "resend"])
    .default("console"),

  // Per-IP rate limit on /api/v1/templates and /api/v1/cli-version.
  // In-memory fixed window per Vercel instance; see the rate-limit
  // middleware comment for the trade-off analysis. 100/min is enough
  // for a CLI that polls once per session and a marketing site that
  // revalidates every 10 minutes.
  RATE_LIMIT_PER_MINUTE: z.coerce
    .number()
    .int()
    .positive()
    .default(100),
})
  // Production-only invariants. Skipped in dev/test so contributors don't
  // need a full .env to start the app. Enforced in prod because each of these
  // silently degrades to a stub (e.g. dummy `{}` DB, default localhost URL,
  // empty Resend key) that looks fine in dev and breaks in prod.
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== "production") return

    if (!data.DATABASE_URL) {
      ctx.addIssue({
        code: "custom",
        message:
          "DATABASE_URL is required in production (was optional in dev to keep onboarding simple)",
        path: ["DATABASE_URL"],
      })
    }

    const secret = data.BETTER_AUTH_SECRET ?? data.AUTH_SECRET
    if (!secret || secret.length < 32) {
      ctx.addIssue({
        code: "custom",
        message:
          "BETTER_AUTH_SECRET (>= 32 chars) is required in production. Run: openssl rand -base64 32",
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
  })

/**
 * Client-side env contract. Only NEXT_PUBLIC_* values, safe to bundle to the
 * browser. Values are inlined at build time by the bundler.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("SaaS Template"),
  NEXT_PUBLIC_APP_DESCRIPTION: z
    .string()
    .min(1)
    .default("SaaS application built with Next.js and shared UI components"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
})

export type ServerEnv = z.infer<typeof serverSchema>
export type ClientEnv = z.infer<typeof clientSchema>

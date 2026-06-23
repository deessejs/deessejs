import { z } from "zod"

/**
 * Server-only environment. Validated at first access (lazy) so missing
 * vars surface at request time, not at module-import time — that way the
 * Next.js dev server can boot and report a clear error to the browser
 * instead of crashing during build.
 *
 * Required vars (the auth + database packages need them at module load):
 *   - DATABASE_URL          — Postgres connection (postgres-js / Neon)
 *   - BETTER_AUTH_SECRET    — ≥32 chars, used by Better Auth
 *   - NEXT_PUBLIC_APP_URL   — Better Auth trusted origin / base URL
 *
 * Optional vars are checked only when the corresponding feature is used
 * (OAuth providers, cross-subdomain cookies, etc.).
 */

const serverSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required for @deessejs/database"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  PARENT_DOMAIN: z.string().default("localhost"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
})

export type ServerEnv = z.infer<typeof serverSchema>

let cached: ServerEnv | undefined

function formatIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n")
}

/**
 * Read + validate the server env. Cached after first successful parse.
 * Throws a descriptive error on the first call if required vars are
 * missing or malformed.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached
  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(
      `[env] Invalid server environment:\n${formatIssues(parsed.error.issues)}\n` +
        `Copy apps/web/.env.example to apps/web/.env.local and fill the values.`,
    )
  }
  cached = parsed.data
  return cached
}

/**
 * Reset the cache — used in tests only.
 * @internal
 */
export function __resetServerEnvCache(): void {
  cached = undefined
}

/**
 * Client-safe env. Only NEXT_PUBLIC_* vars. Safe to import from client
 * components — Next.js inlines them at build time. No validation here
 * because invalid URLs surface at first network call.
 */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const

#!/usr/bin/env tsx
/**
 * Real env validation — runs the server + client Zod schemas and reports
 * any issues. Replaces the previous `pnpm env:check` (which was just
 * `tsc --noEmit` and validated zero env vars).
 *
 * Usage:
 *   pnpm env:check           # validates whatever's in process.env
 *   NODE_ENV=production pnpm env:check
 *
 * Production invariants (DATABASE_URL required, BETTER_AUTH_SECRET >= 32,
 * RESEND_API_KEY conditional on MAIL_TRANSPORT) live in
 * `packages/env/src/schema.ts` as a `superRefine` — they only fire when
 * `NODE_ENV === "production"`, so dev and test run without a full .env.
 *
 * This script additionally checks the client-side invariant
 * (NEXT_PUBLIC_APP_URL != "http://localhost:3000" in production) because
 * the clientSchema is server-side validated but the *built bundle* needs
 * the real URL.
 */

import { serverSchema, clientSchema } from "../packages/env/src/schema.ts"

const NODE_ENV = process.env.NODE_ENV ?? "development"
const errors: string[] = []

// Server env — superRefines handle production-only checks automatically.
const serverParsed = serverSchema.safeParse(process.env)
if (!serverParsed.success) {
  for (const issue of serverParsed.error.issues) {
    const path = issue.path.join(".") || "(root)"
    errors.push(`server.${path}: ${issue.message}`)
  }
}

// Client env.
const clientParsed = clientSchema.safeParse(process.env)
if (!clientParsed.success) {
  for (const issue of clientParsed.error.issues) {
    const path = issue.path.join(".") || "(root)"
    errors.push(`client.${path}: ${issue.message}`)
  }
}

// Client-side production invariant: every NEXT_PUBLIC_* URL gets inlined
// at build time. The schema accepts the localhost defaults for dev, but in
// production we want the real per-Vercel-environment URL. ADR-028
// Decision #5 parameterises this check across all four URL vars so CI
// catches a missing override before deploy does.
if (NODE_ENV === "production") {
  const SCHEMA_DEFAULTS = {
    NEXT_PUBLIC_APP_URL: "http://localhost:3001",
    NEXT_PUBLIC_WEB_URL: "http://localhost:3000",
    NEXT_PUBLIC_DOCS_URL: "http://localhost:3002",
    NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001",
  } as const
  for (const [name, devDefault] of Object.entries(SCHEMA_DEFAULTS)) {
    const value = process.env[name]
    if (!value || value === devDefault) {
      errors.push(
        `client.${name} must be set to the deployment URL in production (got ${value ?? "unset"}, schema default is ${devDefault})`,
      )
    }
  }
}

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n[env-check] ✗ Invalid environment for NODE_ENV=${NODE_ENV}:\n`)
  for (const e of errors) {
    // eslint-disable-next-line no-console
    console.error(`  - ${e}`)
  }
  // eslint-disable-next-line no-console
  console.error(
    "\nCopy .env.example to .env at the repo root and fill in the values.\n",
  )
  process.exit(1)
}

// eslint-disable-next-line no-console
console.log(`[env-check] ✓ ${NODE_ENV} environment valid`)
process.exit(0)

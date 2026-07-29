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

// Client-side production invariant: NEXT_PUBLIC_APP_URL gets inlined at
// build time. The schema accepts the default (localhost) for dev, but in
// production we want the real URL.
if (NODE_ENV === "production") {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url || url === "http://localhost:3000") {
    errors.push(
      "client.NEXT_PUBLIC_APP_URL must be set to the deployment URL in production (no localhost fallback)",
    )
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

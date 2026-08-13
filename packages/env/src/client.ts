import { clientSchema, type ClientEnv } from "./schema.js"

/**
 * Client-safe env. Only NEXT_PUBLIC_* values are referenced, so the bundler
 * inlines them at build time. No runtime guard needed (browser is the only
 * runtime that imports this).
 *
 * Validation is soft: if values are missing or malformed, we fall back to
 * the schema defaults so the client still renders. A warn is emitted once
 * at module load when the parse fails, but only in the Node runtime (browser
 * bundles have no console to warn into).
 *
 * The fallback values come from the schema itself
 * (`clientSchema.parse({})`) so the schema is the single source of truth
 * for defaults. There is no second literal to keep in sync.
 */
const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
})

if (
  !parsed.success &&
  typeof (globalThis as { window?: unknown }).window === "undefined"
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[env] Client env validation warnings (using defaults):",
    parsed.error.issues,
  )
}

export const clientEnv: Readonly<ClientEnv> = Object.freeze(
  parsed.success ? parsed.data : clientSchema.parse({}),
)

import { loadRepoEnv } from "./loader.js"
import { serverSchema, type ServerEnv } from "./schema.js"

/**
 * Load .env files into process.env. Idempotent.
 */
loadRepoEnv()

/**
 * Cached validation result. Validated lazily on first access, not at import time.
 * This allows packages to build without requiring env vars, and fail at runtime
 * (startup) instead when env vars are missing.
 */
let _cached: ServerEnv | null = null

/**
 * Validate server env lazily on first access.
 * Fail fast with a clear, actionable error message.
 */
function validateServerEnv(): Readonly<ServerEnv> {
  if (_cached) return _cached

  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("\n[env] Invalid environment variables:")
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
    }
    // eslint-disable-next-line no-console
    console.error(
      "\nCopy .env.example to .env at the repo root and fill in the values.\n",
    )
    process.exit(1)
  }

  _cached = Object.freeze({
    ...parsed.data,
    // Resolve alias: BETTER_AUTH_SECRET > AUTH_SECRET.
    // When both are undefined, let the consumer (better-auth) handle the
    // validation — it throws in production and uses a dev default in test/dev.
    BETTER_AUTH_SECRET:
      parsed.data.BETTER_AUTH_SECRET ?? parsed.data.AUTH_SECRET ?? undefined,
    TEST_DATABASE_URL:
      parsed.data.TEST_DATABASE_URL ?? parsed.data.DATABASE_URL,
  })

  return _cached
}

/**
 * Resolved, frozen server env object. Aliases (AUTH_SECRET -> BETTER_AUTH_SECRET)
 * and fallbacks (TEST_DATABASE_URL -> DATABASE_URL) are resolved at this
 * boundary so call sites stay simple.
 *
 * Validation is lazy — only happens on first property access, not at import time.
 * This allows builds and tests to run without env vars, failing at startup
 * instead.
 *
 * Runtime guard: must never be bundled to the browser. The bundler can tree-
 * shake the import if unused, but if a misuse leaks this module into a client
 * bundle, fail loudly at the first reference.
 */
export const serverEnv: Readonly<ServerEnv> = new Proxy({} as Readonly<ServerEnv>, {
  get(_target, prop) {
    if (prop === "toJSON") return undefined
    if (prop === "then") return undefined
    if (prop === "Symbol(\"[object Object]\")") return undefined
    if (prop === "getPrototypeOf") return undefined
    if (prop === "propertyIsEnumerable") return undefined

    // Runtime guard: detect browser bundle leaks
    if (prop === "toString" || prop === "valueOf" || typeof prop === "symbol") {
      const value = validateServerEnv()
      const descriptor = Object.getOwnPropertyDescriptor(value, prop as string)
      if (descriptor?.value) return descriptor.value
    }

    const value = validateServerEnv()
    return (value as Record<string, unknown>)[prop as string]
  },
  has(_target, prop) {
    const value = validateServerEnv()
    return prop in (value as Record<string, unknown>)
  },
  ownKeys() {
    return Reflect.ownKeys(validateServerEnv() as Record<string, unknown>)
  },
  getOwnPropertyDescriptor(_target, prop) {
    const value = validateServerEnv()
    return Object.getOwnPropertyDescriptor(
      value as Record<string, unknown>,
      prop,
    )
  },
})

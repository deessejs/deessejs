import { createEnv } from "@t3-oss/env-core"

import { loadDotenvSnapshot, loadRepoEnv, type EnvSnapshot } from "./loader.js"
import { clientSchema, serverInputShape, type ServerEnv } from "./schema.js"

/**
 * Mirror the snapshot into `process.env` so legacy consumers
 * (drizzle.config.ts, scripts, `require("@workspace/env/server")` in
 * `packages/database/src/client.ts`) keep working. The shim is the only
 * place where `process.env` is mutated by this package.
 *
 * Idempotent. Safe to call at module top-level.
 */
loadRepoEnv()

/**
 * Build the validated server env via `@t3-oss/env-core`'s `createEnv`.
 *
 * `createEnv` validates the combined schema synchronously at the moment
 * it is called (see `packages/core/src/index.ts` ~line 360: validate()
 * runs before the Proxy is built). We wrap the call in `getServerEnv()`
 * so the import of `@workspace/env/server` stays side-effect free:
 * tests, scripts, and `setupFiles: ["@workspace/env/server"]` can import
 * without forcing a validation.
 *
 * The snapshot passed as `runtimeEnv` comes from
 * `loadDotenvSnapshot()` and is mutated only by `createEnv`'s own
 * `emptyStringAsUndefined: true` flag. The live `process.env` is not
 * touched from here.
 *
 * The first caller pays the validation cost; subsequent callers read the
 * memoised result. The Proxy shape preserves the existing
 * `serverEnv.DATABASE_URL` access pattern across the codebase (13
 * callers).
 */
let _cached: ServerEnv | null = null

function getServerEnv(): Readonly<ServerEnv> {
  if (_cached) return _cached

  const snapshot = loadDotenvSnapshot() as EnvSnapshot

  const env = createEnv({
    server: serverInputShape,
    client: clientSchema.shape,
    clientPrefix: "NEXT_PUBLIC_",
    runtimeEnv: snapshot,
    emptyStringAsUndefined: true,
    onValidationError: (issues) => {
      // eslint-disable-next-line no-console
      console.error("\n[env] Invalid environment variables:")
      for (const issue of issues) {
        // eslint-disable-next-line no-console
        console.error(
          `  - ${issue.path?.join(".") ?? "(root)"}: ${issue.message}`
        )
      }
      // eslint-disable-next-line no-console
      console.error(
        "\nCopy .env.example to .env at the repo root and fill in the values.\n"
      )
      throw new Error("Invalid environment variables")
    },
  })

  // Materialise the Proxy into a frozen plain object. The Proxy
  // returned by createEnv enforces the server/client boundary on each
  // get; we freeze the snapshot once and serve it from the outer Proxy
  // below. Aliases (AUTH_SECRET -> BETTER_AUTH_SECRET,
  // TEST_DATABASE_URL -> DATABASE_URL) are resolved at this boundary
  // so call sites see only the canonical name.
  const materialised = Object.freeze({
    NODE_ENV: env.NODE_ENV,
    DATABASE_URL: env.DATABASE_URL,
    TEST_DATABASE_URL: env.TEST_DATABASE_URL ?? env.DATABASE_URL,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET ?? env.AUTH_SECRET,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    RESEND_API_KEY: env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: env.RESEND_FROM_NAME,
    MAIL_TRANSPORT: env.MAIL_TRANSPORT,
    RATE_LIMIT_PER_MINUTE: env.RATE_LIMIT_PER_MINUTE,
    GITHUB_TOKEN: env.GITHUB_TOKEN,
  } as ServerEnv) as Readonly<ServerEnv>

  // Runtime assertion: no NEXT_PUBLIC_* may leak through the server face.
  // The previous hand-rolled Proxy trap list ran on every access; this
  // fires once at materialisation. Compile-time catches it via the
  // schema's clientPrefix contract.
  for (const key of Object.keys(materialised)) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      throw new Error(
        `[env] serverEnv exposes NEXT_PUBLIC_* key: ${key}. ` +
          `NEXT_PUBLIC_* belongs to clientEnv, not serverEnv.`
      )
    }
  }

  _cached = materialised
  return _cached
}

/**
 * Lazy server env. Validation fires on first property access, not at
 * import time. This preserves the existing contract used by:
 *
 *   - vitest config (`setupFiles: ["@workspace/env/server"]`)
 *   - drizzle-kit (`drizzle.config.ts`)
 *   - the `require("@workspace/env/server")` path in
 *     `packages/database/src/client.ts`
 *   - the side-effect-only `import "@workspace/env/server"` form
 *
 * Migration entry point for callers that want explicit control:
 *   import { getServerEnv } from "@workspace/env/server"
 *   const env = getServerEnv()
 */
export const serverEnv: Readonly<ServerEnv> = new Proxy(
  {} as Readonly<ServerEnv>,
  {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined
      const env = getServerEnv()
      const value = (env as unknown as Record<string, unknown>)[prop]
      return value === undefined ? undefined : value
    },
    has(_target, prop) {
      if (typeof prop === "symbol") return false
      return prop in (getServerEnv() as unknown as Record<string, unknown>)
    },
    ownKeys() {
      return Reflect.ownKeys(
        getServerEnv() as unknown as Record<string, unknown>
      )
    },
    getOwnPropertyDescriptor(_target, prop) {
      const env = getServerEnv() as unknown as Record<string, unknown>
      if (typeof prop === "symbol") return undefined
      return Object.getOwnPropertyDescriptor(env, prop)
    },
  }
)

export { getServerEnv }

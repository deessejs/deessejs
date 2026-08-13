import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

import { loadRepoEnv } from "./loader.js"
import {
  clientSchema,
  serverSchema,
  type ServerEnv,
} from "./schema.js"

/**
 * Load .env files into process.env. Idempotent.
 */
loadRepoEnv()

/**
 * Build the validated server env via `@t3-oss/env-core`'s `createEnv`.
 *
 * `createEnv` validates the combined schema synchronously at the moment it
 * is called (see `packages/core/src/index.ts` ~line 360: validate() runs
 * before the Proxy is built). We wrap the call in `getServerEnv()` so the
 * import of `@workspace/env/server` stays side-effect free: tests, scripts,
 * and `setupFiles: ["@workspace/env/server"]` can import without forcing a
 * validation.
 *
 * The first caller pays the validation cost; subsequent callers read the
 * memoised result. The Proxy shape preserves the existing
 * `serverEnv.DATABASE_URL` access pattern across the codebase (13 callers),
 * including the `require("@workspace/env/server")` path in
 * `packages/database/src/client.ts`.
 */
let _cached: ServerEnv | null = null

function getServerEnv(): Readonly<ServerEnv> {
  if (_cached) return _cached

  const env = createEnv({
    server: serverSchema.shape,
    client: clientSchema.shape,
    clientPrefix: "NEXT_PUBLIC_",
    runtimeEnv: {
      // Destructured literal: `emptyStringAsUndefined: true` mutates the
      // object passed as runtimeEnv by deleting keys whose value is `""`.
      // Passing `process.env` directly would mutate the live `process.env`.
      // One entry per schema key keeps the strict-mode inference honest.
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
      MAIL_TRANSPORT: process.env.MAIL_TRANSPORT,
      RATE_LIMIT_PER_MINUTE: process.env.RATE_LIMIT_PER_MINUTE,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    },
    emptyStringAsUndefined: true,
    onValidationError: (issues) => {
      // eslint-disable-next-line no-console
      console.error("\n[env] Invalid environment variables:")
      for (const issue of issues) {
        // eslint-disable-next-line no-console
        console.error(`  - ${issue.path?.join(".") ?? "(root)"}: ${issue.message}`)
      }
      // eslint-disable-next-line no-console
      console.error(
        "\nCopy .env.example to .env at the repo root and fill in the values.\n",
      )
      throw new Error("Invalid environment variables")
    },
  })

  // `createEnv` returns a Proxy; freeze the underlying value the Proxy reads
  // from. We materialise it once for type-safety and JSON.stringify support
  // (the existing `serverEnv` was a plain frozen object, which is part of
  // the implicit contract).
  const materialised = Object.freeze({
    NODE_ENV: env.NODE_ENV,
    DATABASE_URL: env.DATABASE_URL,
    TEST_DATABASE_URL: env.TEST_DATABASE_URL,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    RESEND_API_KEY: env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: env.RESEND_FROM_NAME,
    MAIL_TRANSPORT: env.MAIL_TRANSPORT,
    RATE_LIMIT_PER_MINUTE: env.RATE_LIMIT_PER_MINUTE,
    GITHUB_TOKEN: env.GITHUB_TOKEN,
  } as ServerEnv) as Readonly<ServerEnv>

  // Runtime assertion: no NEXT_PUBLIC_* may leak through the server face.
  // We assert at materialisation time so the guard fires once, not on every
  // property access (the previous hand-rolled Proxy trap list ran on every
  // access; this is cheaper and the types catch it at compile time).
  for (const key of Object.keys(materialised)) {
    if (key.startsWith("NEXT_PUBLIC_")) {
      throw new Error(
        `[env] serverEnv exposes NEXT_PUBLIC_* key: ${key}. ` +
          `NEXT_PUBLIC_* belongs to clientEnv, not serverEnv.`,
      )
    }
  }

  _cached = materialised
  return _cached
}

/**
 * Lazy server env. Validation fires on first property access, not at import
 * time. This preserves the existing contract used by:
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
        getServerEnv() as unknown as Record<string, unknown>,
      )
    },
    getOwnPropertyDescriptor(_target, prop) {
      const env = getServerEnv() as unknown as Record<string, unknown>
      if (typeof prop === "symbol") return undefined
      return Object.getOwnPropertyDescriptor(env, prop)
    },
  },
)

export { getServerEnv }

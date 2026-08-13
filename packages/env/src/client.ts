import { createEnv } from "@t3-oss/env-core"

import { loadRepoEnv } from "./loader.js"
import { clientSchema, type ClientEnv } from "./schema.js"

/**
 * Client-safe env. Only NEXT_PUBLIC_* values are referenced, so the bundler
 * inlines them at build time. No runtime guard needed: `createEnv` enforces
 * the client/server boundary at the type level (via the `runtimeEnvStrict`
 * argument), and at runtime via `onInvalidAccess` if a server-only key
 * ever leaks into a client bundle.
 */
loadRepoEnv()

const env = createEnv({
  client: clientSchema.shape,
  clientPrefix: "NEXT_PUBLIC_",
  runtimeEnvStrict: {
    // Each NEXT_PUBLIC_* must be listed explicitly. The destructured
    // literal keeps `emptyStringAsUndefined: true` (which `delete`s `""`
    // keys on this object) from mutating the live `process.env`.
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
})

/**
 * Eager-validated client env. Validation fires at module load (top-level
 * `createEnv` call above). The Proxy returned by `createEnv` enforces
 * the client/server boundary on every property access.
 */
export const clientEnv: Readonly<ClientEnv> = Object.freeze({
  NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_DESCRIPTION: env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
} as ClientEnv) as Readonly<ClientEnv>

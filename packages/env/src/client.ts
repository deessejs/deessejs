import { createEnv } from "@t3-oss/env-core"

import { loadDotenvSnapshot, loadRepoEnv } from "./loader.js"
import { clientSchema, type ClientEnv } from "./schema.js"

/**
 * Mirror the snapshot into `process.env` for legacy consumers, then
 * read the snapshot ourselves for the validator. Idempotent.
 */
loadRepoEnv()

const dotenv = loadDotenvSnapshot()

const env = createEnv({
  client: clientSchema.shape,
  clientPrefix: "NEXT_PUBLIC_",
  // `runtimeEnvStrict` enforces (at compile time) that every key declared
  // in `clientSchema` is listed here. Adding a NEXT_PUBLIC_* to the
  // schema without listing it here is a TypeScript build error.
  //
  // `emptyStringAsUndefined: true` mutates this `dotenv` snapshot, not
  // `process.env`: the snapshot is a plain object we own, so the
  // delete-on-empty-string stays scoped to our local cache.
  runtimeEnvStrict: {
    NEXT_PUBLIC_APP_NAME: dotenv.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_DESCRIPTION: dotenv.NEXT_PUBLIC_APP_DESCRIPTION,
    NEXT_PUBLIC_APP_URL: dotenv.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
})

/**
 * Eager-validated client env. Validation fires at module load. The
 * Proxy returned by `createEnv` enforces the client/server boundary on
 * every property access.
 */
export const clientEnv: Readonly<ClientEnv> = Object.freeze({
  NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_DESCRIPTION: env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
} as ClientEnv) as Readonly<ClientEnv>

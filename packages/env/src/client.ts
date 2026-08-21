import { createEnv } from "@t3-oss/env-core"

import { clientSchema, type ClientEnv } from "./schema.js"

/**
 * Client-safe env. Only NEXT_PUBLIC_* values, safe to bundle to the
 * browser. Values are inlined at build time by the bundler (Turbopack
 * for Next.js, webpack, etc.) — no runtime loader is needed here.
 *
 * This file MUST NOT import `loader.ts`. The loader reads `node:fs`,
 * which Turbopack cannot bundle into a client chunk. The conditional
 * `exports` map in `package.json` keeps `loader.ts` server-only:
 *
 *   "@workspace/env/server": { "node": "./dist/server.js", ... }
 *   "@workspace/env/client": { "browser": "./dist/client.js", ... }
 *
 * Importing `@workspace/env/client` from a Client Component therefore
 * never reaches the loader. The validator runs on `process.env`
 * directly: in the browser, the values are already inlined by the
 * bundler; in a Node target (e.g. SSR), `process.env.NEXT_PUBLIC_*`
 * is the source of truth.
 */

const env = createEnv({
  client: clientSchema.shape,
  clientPrefix: "NEXT_PUBLIC_",
  // `runtimeEnvStrict` enforces (at compile time) that every key
  // declared in `clientSchema` is listed here. Adding a NEXT_PUBLIC_*
  // to the schema without listing it here is a TypeScript build error.
  runtimeEnvStrict: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
  emptyStringAsUndefined: true,
})

/**
 * Eager-validated client env. Validation fires at module load. The
 * Proxy returned by `createEnv` enforces the client/server boundary
 * on every property access (`onInvalidAccess`).
 */
export const clientEnv: Readonly<ClientEnv> = Object.freeze({
  NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_DESCRIPTION: env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_WEB_URL: env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_DOCS_URL: env.NEXT_PUBLIC_DOCS_URL,
  NEXT_PUBLIC_API_BASE_URL: env.NEXT_PUBLIC_API_BASE_URL,
} as ClientEnv) as Readonly<ClientEnv>

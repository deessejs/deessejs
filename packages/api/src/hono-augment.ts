/**
 * Augment Hono's `ContextVariableMap` so `c.get('requestId')`, `c.get('user')`
 * and `c.get('session')` are typed instead of silently typed as `unknown`.
 *
 * Single source of truth is `types/api-env.ts`. The augmentation below
 * derives `ContextVariableMap` from `ApiEnv["Variables"]` so adding a
 * variable to `ApiEnv` propagates here automatically.
 */
import type { ApiEnv } from "./types/api-env.js"

/**
 * Helper type that turns the variable map shape into the index
 * signature Hono's module augmentation accepts. Mapped types
 * don't work directly inside `declare module`, so we go through
 * this indirection.
 */
type VariablesAsIndex = {
  [K in keyof ApiEnv["Variables"] as K extends string
    ? K
    : never]: ApiEnv["Variables"][K]
}

declare module "hono" {
  interface ContextVariableMap extends VariablesAsIndex {}
}

export {}

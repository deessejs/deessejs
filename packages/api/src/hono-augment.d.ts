/**
 * Augment Hono's ContextVariableMap so `c.get('requestId')` is typed
 * and not silently typed as `unknown`.
 *
 * Without this, every `c.var.requestId` access requires a `?? "unknown"`
 * fallback because the Hono global ContextVariableMap is empty by default.
 */
import "@workspace/auth"

declare module "hono" {
  interface ContextVariableMap {
    requestId: string
    user: NonNullable<
      Awaited<ReturnType<typeof import("@workspace/auth").auth.api.getSession>>
    >["user"] | null
    session: NonNullable<
      Awaited<ReturnType<typeof import("@workspace/auth").auth.api.getSession>>
    >["session"] | null
  }
}

export {}

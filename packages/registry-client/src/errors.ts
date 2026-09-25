/**
 * Error helpers for `@workspace/registry-client`.
 *
 * The SDK never throws `RegistryFailure` directly — it throws a
 * runtime `Error` whose `cause` carries the {@link RegistryFailure}
 * value. This pattern lets consumers `try { ... } catch (err) { ... }`
 * the SDK like any other code while still pattern-matching on the
 * typed failure via `asRegistryFailure(err)`.
 *
 * Same shape as the helpers in `@workspace/storage/errors.ts` for
 * consistency.
 */

import type { RegistryFailure } from "./types.js"

/**
 * Wrap a {@link RegistryFailure} in a runtime `Error`.
 *
 * The wrapping is necessary because TypeScript and the JS runtime
 * both want a real `Error` at the top of the chain (stack traces,
 * `instanceof Error` checks, logging pipelines). The shape of the
 * failure is what consumers should switch on, exposed via `error.cause`.
 */
export const toRegistryError = (
  failure: RegistryFailure,
  message: string,
): Error => {
  const err = new Error(message)
  err.name = failure._tag
  ;(err as Error & { cause: RegistryFailure }).cause = failure
  return err
}

/**
 * Type guard: returns the {@link RegistryFailure} if the given
 * value was thrown by this package, or `null` otherwise.
 *
 * Usage:
 *
 * ```
 * try {
 *   await client.getTemplate(slug)
 * } catch (err) {
 *   const failure = asRegistryFailure(err)
 *   if (failure?._tag === "RegistryNotFound") { ... }
 * }
 * ```
 *
 * Note: the SDK itself never throws to the caller — it returns
 * `Result<...>` directly. This helper is here for symmetry with the
 * `StorageFailure` helpers and to support internal error mapping
 * between the SDK's HTTP layer and the public Result API.
 */
export const asRegistryFailure = (err: unknown): RegistryFailure | null => {
  if (
    err !== null &&
    typeof err === "object" &&
    "cause" in err &&
    typeof (err as { cause: unknown }).cause === "object" &&
    (err as { cause: { _tag?: unknown } }).cause !== null &&
    typeof (err as { cause: { _tag?: unknown } }).cause._tag === "string" &&
    ((err as { cause: { _tag: string } }).cause._tag as string).startsWith(
      "Registry",
    )
  ) {
    return (err as { cause: RegistryFailure }).cause
  }
  return null
}

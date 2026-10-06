/**
 * Shared registry client factory.
 *
 * Every CLI command that talks to the registry (init, list, info,
 * future add) constructs a `RegistryClient` the same way. This
 * helper centralises:
 *
 *   - The default API URL (`https://app.deessejs.com`)
 *   - The `DEESSEJS_API_URL` env-var override (used by CI, dev, and
 *     tests against staging)
 *   - The `fetchImpl` override seam (used by tests to inject a mock)
 *
 * Commands call `getRegistryClient()` once per invocation. The SDK
 * client is cheap to construct (no I/O, just options), so we don't
 * cache it — but the `options` argument exists so tests can inject
 * a mock `fetchImpl` without having to mutate `process.env`.
 */

import { createClient as createSdkClient } from "@workspace/registry-client"

import type { RegistryClient } from "@workspace/registry-client"

export const DEFAULT_API_URL = "https://app.deessejs.com"

/**
 * Options for `getRegistryClient`.
 *
 * `apiUrl` wins over `process.env.DEESSEJS_API_URL`. Pass
 * `fetchImpl` to inject a mock — used by tests.
 */
export type GetRegistryClientOptions = {
  readonly apiUrl?: string
  readonly fetchImpl?: typeof fetch
}

/**
 * Resolve the API URL from options + env, falling back to the
 * production default.
 */
const resolveApiUrl = (override: string | undefined): string =>
  override ?? process.env.DEESSEJS_API_URL ?? DEFAULT_API_URL

/**
 * Build a `RegistryClient` for the current CLI invocation.
 *
 * @example
 * ```ts
 * const client = getRegistryClient()
 * const result = await client.getTemplate(slug, { ref })
 * ```
 *
 * @example Test seam
 * ```ts
 * const client = getRegistryClient({ fetchImpl: myMockFetch })
 * ```
 */
export const getRegistryClient = (
  options: GetRegistryClientOptions = {},
): RegistryClient => {
  const clientOptions: { apiUrl: string; fetchImpl?: typeof fetch } = {
    apiUrl: resolveApiUrl(options.apiUrl),
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
  }
  return createSdkClient(clientOptions)
}

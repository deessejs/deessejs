/**
 * Factory for the registry client.
 *
 * The factory validates its options eagerly (catches programmer
 * errors at construction time, not at first call), then returns a
 * `RegistryClient` whose methods close over the resolved `apiUrl`
 * and the optional `fetchImpl`.
 *
 * The factory is the only way to construct a client — there is no
 * class to instantiate. This keeps the package's surface narrow and
 * makes mocking in tests straightforward.
 */

import {
  getInfoFromApi,
  getTemplateFromApi,
  listTemplatesFromApi,
} from "./http-client.js"
import type {
  FetchedTemplate,
  FetchOptions,
  RegistryClient,
  RegistryClientOptions,
  RegistryFailure,
  Result,
  TemplateInfo,
} from "./types.js"

/**
 * Validate the SDK options eagerly.
 *
 * Throws a plain `Error` (not a `RegistryFailure`) because a missing
 * or malformed `apiUrl` is a programmer error — the SDK can't do
 * anything useful with it, and the caller almost certainly has a
 * config bug.
 */
const validateOptions = (options: RegistryClientOptions): void => {
  if (!options.apiUrl || typeof options.apiUrl !== "string") {
    throw new Error("createClient: apiUrl is required")
  }
  // Validate URL shape early. `new URL` throws on garbage; we wrap
  // the error so the message is actionable.
  try {
    new URL(options.apiUrl)
  } catch {
    throw new Error(
      `createClient: apiUrl is not a valid URL: ${options.apiUrl}`,
    )
  }
}

/**
 * Build a {@link RegistryClient}.
 *
 * The returned object's methods close over `apiUrl` and `fetchImpl`.
 * Calling this factory twice gives two independent clients.
 *
 * Throws on programmer error (missing/invalid `apiUrl`). Runtime
 * errors (network, upstream failure) are returned as
 * `Result.Err` — never thrown.
 */
export const createClient = (
  options: RegistryClientOptions,
): RegistryClient => {
  validateOptions(options)
  const apiUrl = options.apiUrl
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)

  return {
    async getTemplate(
      slug: string,
      fetchOptions?: FetchOptions,
    ): Promise<Result<FetchedTemplate, RegistryFailure>> {
      return getTemplateFromApi(
        apiUrl,
        slug,
        fetchOptions?.ref,
        fetchImpl,
      )
    },

    async info(slug: string): Promise<Result<TemplateInfo, RegistryFailure>> {
      return getInfoFromApi(apiUrl, slug, fetchImpl)
    },

    async listTemplates() {
      return listTemplatesFromApi(apiUrl, fetchImpl)
    },
  }
}

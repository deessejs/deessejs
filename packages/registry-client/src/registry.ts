/**
 * Factory for the registry client.
 *
 * The factory validates its options eagerly (catches programmer
 * errors at construction time, not at first call), then returns a
 * `RegistryClient` whose methods close over the resolved `apiUrl`
 * and the optional `fetchImpl`.
 *
 * ## Slug routing
 *
 * `createClient` parses the input slug for `getTemplate` and `info`
 * and routes deterministically:
 *
 *   1. **GitHub-shaped slug** (`owner/repo`, HTTPS URL, SSH URL)
 *      → fetched directly from `raw.githubusercontent.com` via
 *      `github.ts`. Bypasses the API server entirely.
 *   2. **Non-GitHub HTTPS URL** (gitlab.com, bitbucket.org, …)
 *      → `RegistryUnsupportedSource` with `source` carrying the host
 *      for the CLI to surface in the user message.
 *   3. **Anything else** (catalogue slug, local path, malformed
 *      input) → fetched from the API server via `http-client.ts`.
 *      The server owns the catalogue lookup and the auth layer.
 *
 * `listTemplates` stays API-only — the catalogue is editorial
 * metadata that lives on the server, not on GitHub.
 *
 * The factory is the only way to construct a client — there is no
 * class to instantiate. This keeps the package's surface narrow and
 * makes mocking in tests straightforward.
 */

import {
  parseGitHubSlug,
  type ResolvedRepo,
} from "@workspace/contracts/shared"

import {
  getInfoFromApi,
  getTemplateFromApi,
  listTemplatesFromApi,
} from "./http-client.js"
import {
  getInfoFromGithub,
  getTemplateFromGithub,
} from "./github.js"
import type {
  FetchedTemplate,
  FetchOptions,
  RegistryClient,
  RegistryClientOptions,
  RegistryFailure,
  Result,
  TemplateInfo,
} from "./types.js"
import { err as errResult } from "./types.js"

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
      const gh = parseGitHubSlug(slug)
      if (gh.kind === "ok") {
        return getTemplateFromGithub(
          gh.repo.owner,
          gh.repo.repo,
          fetchOptions?.ref,
          fetchImpl,
        )
      }
      if (gh.kind === "unsupported_host") {
        return errResult<RegistryFailure>({
          _tag: "RegistryUnsupportedSource",
          source: `unsupported_host:${gh.host}`,
        })
      }
      // gh.kind === "not_github" → catalogue lookup territory; let
      // the API server resolve it.
      return getTemplateFromApi(
        apiUrl,
        slug,
        fetchOptions?.ref,
        fetchImpl,
      )
    },

    async info(slug: string): Promise<Result<TemplateInfo, RegistryFailure>> {
      const gh = parseGitHubSlug(slug)
      if (gh.kind === "ok") {
        return getInfoFromGithub(gh.repo.owner, gh.repo.repo, fetchImpl)
      }
      if (gh.kind === "unsupported_host") {
        return errResult<RegistryFailure>({
          _tag: "RegistryUnsupportedSource",
          source: `unsupported_host:${gh.host}`,
        })
      }
      return getInfoFromApi(apiUrl, slug, fetchImpl)
    },

    async listTemplates() {
      return listTemplatesFromApi(apiUrl, fetchImpl)
    },
  }
}

/**
 * Re-export the resolved-repo type for tests that exercise the
 * routing. Production callers should never need this — they go
 * through `createClient`.
 */
export type { ResolvedRepo }
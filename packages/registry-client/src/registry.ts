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
  resolveTemplateFromGithub,
} from "./github.js"
import type {
  FetchedTemplate,
  FetchOptions,
  RegistryClient,
  RegistryClientOptions,
  RegistryFailure,
  ResolvedTemplate,
  ResolvedTemplateFile,
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
  // Resolve `apiUrl` from the constructor argument, falling back
  // to `DEESSEJS_API_URL`. Lets integration tests (and CI sandboxes)
  // wire the URL via env without changing every CLI invocation.
  const apiUrl =
    options.apiUrl ?? process.env["DEESSEJS_API_URL"] ?? ""
  if (!apiUrl) {
    throw new Error(
      "createClient: apiUrl is required (pass it or set DEESSEJS_API_URL)",
    )
  }
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

    async resolveTemplate(
      slug: string,
      fetchOptions?: FetchOptions,
    ): Promise<Result<ResolvedTemplate, RegistryFailure>> {
      const gh = parseGitHubSlug(slug)
      if (gh.kind === "ok") {
        return resolveTemplateFromGithub(
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
      // API path: fetch the descriptor. The server returns
      // `{descriptor, files: Record<path, url>}` (V1 shape). We
      // synthesise the resolved file list from the server-provided
      // URLs, preserving any `target` aliases from descriptor.files[].
      // V2 server-side tree resolution (descriptor includes/excludes
      // resolved on the server) lands in a follow-up; this path stays
      // V1-compatible: explicit `descriptor.files[]` only.
      const templateResult = await getTemplateFromApi(
        apiUrl,
        slug,
        fetchOptions?.ref,
        fetchImpl,
      )
      if (templateResult._tag === "Err") return templateResult
      const { descriptor: apiDescriptor, files: urlMap } =
        templateResult.value
      const targetByPath = new Map<string, string>()
      for (const spec of apiDescriptor.files ?? []) {
        if (spec.target !== undefined) {
          targetByPath.set(spec.path, spec.target)
        }
      }
      const apiFiles: ResolvedTemplateFile[] = Object.keys(urlMap).map(
        (path) => ({
          path,
          kind: "template:source", // API path doesn't carry kind metadata; safe default
          ...(targetByPath.has(path) ? { target: targetByPath.get(path)! } : {}),
          source: "descriptor",
        }),
      )
      return {
        _tag: "Ok",
        value: {
          descriptor: apiDescriptor,
          files: apiFiles,
          treeRef: apiDescriptor.source.ref,
          source: "descriptor-only",
        },
      }
    },
  }
}

/**
 * Re-export the resolved-repo type for tests that exercise the
 * routing. Production callers should never need this — they go
 * through `createClient`.
 */
export type { ResolvedRepo }
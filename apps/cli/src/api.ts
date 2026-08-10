import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { ClientOptions } from "@orpc/client"
import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { USER_AGENT } from "./constants.js"
import { networkError, parseError } from "./errors.js"
import { fetchWithRetry } from "./fetch-with-retry.js"
import { maybeWarnAboutOutdatedCli } from "./version-check.js"

export type Template = TemplatesListResponseV1["templates"][number]

export type FetchOptions = {
  /** Skip the version probe. Used by tests and by the version probe itself. */
  skipVersionCheck?: boolean
  /**
   * Maximum number of retry attempts for `fetchWithRetry`. Production
   * default is 3. Tests pass `1` to skip the retry/backoff in unit tests
   * that target the typed client (procedure contract is tested via the
   * Server-Side Client pattern; see test/contract/templates.test.ts).
   */
  maxAttempts?: number
}

/**
 * Adapter that exposes our retry-aware `fetchWithRetry` as the global
 * `fetch` shape that `RPCLink` expects.
 *
 * Signature comes from `@orpc/client/adapters/fetch/index.d.ts`:
 *   fetch(request, init, options, path, input) => Promise<Response>
 *
 * We only consume `request` and `init.redirect`. The rest are surfaced
 * for plugins/interceptors and we don't use either.
 *
 * The `Request.body` is a stream; the client always passes a string for
 * RPC procedures (the JSON envelope). We read it once via `req.text()`.
 */
export const orpcFetch = async (
  request: Request | string,
  init: { redirect?: Request["redirect"] } | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: ClientOptions<Record<string, unknown>>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _path?: readonly string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input?: unknown,
): Promise<Response> => {
  let req: Request
  if (typeof request === "string") {
    if (init?.redirect !== undefined) {
      req = new Request(request, { redirect: init.redirect })
    } else {
      req = new Request(request)
    }
  } else {
    req = request
  }

  const apiUrl = req.url
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })
  const body = req.body ? await req.text() : undefined

  const opts: {
    apiUrl: string
    method: string
    body: string
    headers: Record<string, string>
    maxAttempts?: number
  } = {
    apiUrl,
    method: req.method,
    headers,
    body: body ?? "",
  }
  if (body === undefined) opts.body = ""

  const res = await fetchWithRetry(opts)
  return new Response(res.bodyText, {
    status: res.status,
    statusText: res.status === 200 ? "OK" : "Error",
    headers: {
      "content-type": "application/json",
      ...(res.etag ? { etag: res.etag } : {}),
    },
  })
}

/**
 * Build a typed oRPC client for the templates registry.
 *
 * `RPCLink` takes a base URL; the client appends procedure paths
 * automatically (`<base>/templates/list`). The router type is inlined
 * against the shared Zod contract — the client and the server speak
 * the same shape.
 */
const buildOrpcClient = (baseUrl: string) => {
  const link = new RPCLink({
    url: baseUrl,
    fetch: orpcFetch,
  })
  return createORPCClient<{
    templates: { list: () => Promise<TemplatesListResponseV1> }
  }>(link)
}

/**
 * Map an unknown error from the typed client to a CliError.
 *
 * The server emits one error channel: ORPCError (e.g. `RATE_LIMITED`,
 * `INTERNAL_SERVER_ERROR`, `NOT_FOUND`). The client decodes the wire
 * shape `{ defined, code, status, message, data }` into a real
 * `ORPCError` instance and throws it.
 *
 * We match the wire shape (not `instanceof ORPCError`) because the
 * client may live-load a different version of `@orpc/client` than the
 * one we import here for the type, breaking `instanceof`. Shape
 * matching is robust to that.
 *
 * Network errors (fetch failed before reaching the server) are
 * `TypeError`. Anything else falls through to a generic `network_error`
 * with the original message.
 */
export const orpcToCliError = (e: unknown): Error & { code: string } => {
  if (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string" &&
    "status" in e &&
    typeof (e as { status: unknown }).status === "number"
  ) {
    const err = e as unknown as {
      code: string
      status: number
      data?: unknown
      message?: string
    }
    const detail =
      err.data !== undefined
        ? typeof err.data === "string"
          ? err.data
          : JSON.stringify(err.data)
        : err.message ?? ""
    return parseError(
      `endpoint returned ORPCError ${err.code} (status ${err.status})`,
      `server returned ${err.code} (status ${err.status}): ${detail}`,
    )
  }
  if (e instanceof TypeError) {
    return networkError(e.message)
  }
  return networkError(e instanceof Error ? e.message : String(e))
}

/**
 * Fetch the templates registry.
 *
 * Flow:
 *   1. (If not skipVersionCheck) probe /cli-version and warn if outdated.
 *      Failure here is silent — version check is best-effort.
 *   2. Call templates.list via the typed oRPC client. Retry + backoff
 *      are handled inside `orpcFetch` (delegating to fetchWithRetry).
 *   3. Surface typed errors. ORPCError.code is mapped to a CliError.
 *
 * Testing:
 *   - The procedure contract (success, ORPCError shapes, contract
 *     drift) is tested via the Server-Side Client pattern in
 *     `test/contract/templates.test.ts`. Call `appRouter.templates.list()`
 *     directly, no HTTP.
 *   - The HTTP layer (retry, envelope parsing, isOrpcErrorBody mapping)
 *     is tested via a Node `http.createServer` fixture in
 *     `test/http/fetch-templates.test.ts`. The CLI hits the fixture URL.
 *   - We do not mock `fetch` globally. RPCLink builds a `Request`
 *     whose body is consumed once, and a global fetch mock bypasses
 *     RPCLink entirely. See Phase 3 of
 *     `docs/engineering/plans/orpc-client-migration.md` for details.
 */
export const fetchTemplates = async (
  apiUrl: string,
  options: FetchOptions = {},
): Promise<Template[]> => {
  if (!options.skipVersionCheck) {
    await maybeWarnAboutOutdatedCli(apiUrl)
  }

  const client = buildOrpcClient(apiUrl)
  try {
    const result = await client.templates.list()
    return result.templates
  } catch (e) {
    throw orpcToCliError(e)
  }
}

// USER_AGENT is forwarded by fetchWithRetry as a default header.
// Kept the import so future work that wants to thread it on the
// link directly has the symbol handy.
void USER_AGENT

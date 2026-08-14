import { createORPCClient, type ClientOptions } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { fetchWithRetry } from "./retry.js"

/**
 * Typed oRPC client construction for the CLI.
 *
 * Internal to the CLI. The public surface (`fetchTemplates`) lives in
 * ../api.ts. Tests that target the typed client (Server-Side Client
 * pattern) import `appRouter` directly from `@workspace/api/router`
 * and bypass this module entirely.
 *
 * Why a `client/` subfolder:
 *   - The construction is the only piece of this CLI that touches
 *     `@orpc/client`. Keeping it isolated makes the rest of `api.ts`
 *     (orchestration, error mapping, version check) easier to read.
 *   - The 5-arg signature of the custom `fetch` hook, plus the
 *     trade-off with shape-matching in the error mapper, are details
 *     that belong with the implementation, not with the API surface.
 *   - When we add MSW-based tests (Phase 3 of the migration plan),
 *     they live in `test/http/` and mock the fetch hook here, not
 *     the orchestration in `api.ts`.
 *
 * See docs/engineering/plans/orpc-client-migration.md phase 2 for the
 * rationale on why we use RPCLink + custom fetch instead of direct
 * `fetch` + manual envelope unwrap.
 */

/**
 * Adapter that exposes our retry-aware `fetchWithRetry` as the global
 * `fetch` shape that `RPCLink` expects.
 *
 * Signature comes from `@orpc/client/adapters/fetch/index.d.ts`:
 *   fetch(request, init, options, path, input) => Promise<Response>
 *
 * We only consume `request` and `init.redirect`. The remaining
 * arguments (`options`, `path`, `input`) are surfaced for
 * plugins/interceptors; we don't use either, hence the `_` prefix.
 *
 * The `Request.body` is a stream; the client always passes a string
 * for RPC procedures (the JSON envelope). We read it once via
 * `req.text()`.
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
export const buildOrpcClient = (baseUrl: string) => {
  const link = new RPCLink({
    url: baseUrl,
    fetch: orpcFetch,
  })
  return createORPCClient<{
    templates: { list: () => Promise<TemplatesListResponseV1> }
  }>(link)
}

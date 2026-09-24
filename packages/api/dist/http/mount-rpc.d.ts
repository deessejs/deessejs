import type { Hono } from "hono";
import type { ApiEnv } from "./env.js";
/**
 * Mount the oRPC handler on `/rpc/*`.
 *
 * `api.use(...)` + `await next()` keeps unmatched paths flowing
 * down the chain instead of short-circuiting. See
 * https://orpc.dev/docs/adapters/hono.
 *
 * Per Hono's docs (https://hono.dev/docs/api/routing), the
 * trailing wildcard `*` is a *special* wildcard that matches
 * any number of path segments: `/rpc/*` matches `/rpc/x`,
 * `/rpc/x/y`, and `/rpc/x/y/z`. The bare pattern is therefore
 * sufficient for any oRPC procedure path, regardless of
 * segment count.
 *
 * The `prefix` passed to `rpcHandler.handle` is the URL
 * prefix the oRPC handler matches against the request
 * pathname. Because the Hono app is built with
 * `basePath("/api/v1")`, the actual request URL Hono sees
 * is `/api/v1/rpc/...`. The prefix must include the
 * basePath: `API_BASE_PATH + "/rpc"` (= `/api/v1/rpc`).
 * Passing only `/rpc` makes the oRPC `StandardHandler.handle`
 * check fail on every request — the path does not start with
 * `/rpc/`. ADR-015 documents the prefix-alignment invariant.
 *
 * The matched response is rewritten to carry the request ID
 * header, so clients can correlate even when oRPC constructs
 * the response internally.
 *
 * Cache directives:
 *   Every RPC response carries `Cache-Control: no-store` so a
 *   CDN/proxy in front of the API never caches upstream
 *   procedure results. RPC responses are user-/session-derived
 *   and time-sensitive; caching them is incorrect. This is a
 *   hardening directive independent of any route-level fetch
 *   cache that the client (e.g. apps/web) opts into via Next.js
 *   ISR directives on the underlying `fetch`. See issue #81.
 */
export declare const mountRpc: (api: Hono<ApiEnv>) => void;
//# sourceMappingURL=mount-rpc.d.ts.map
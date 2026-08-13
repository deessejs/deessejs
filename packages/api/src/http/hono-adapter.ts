import type { Context } from "hono"

/**
 * Body-parser methods that consume the request body. The proxy below
 * redirects these to Hono's parsed getters so oRPC never sees a
 * drained stream when another middleware has already read the body
 * (logger, rate limiter, etc.).
 *
 * Per https://orpc.dev/docs/adapters/hono — "Body Already Used".
 */
const BODY_PARSER_METHODS = new Set([
  "arrayBuffer",
  "blob",
  "formData",
  "json",
  "text",
] as const)
type BodyParserMethod = (typeof BODY_PARSER_METHODS extends Set<infer T> ? T : never)

/**
 * Wrap `c.req.raw` in a Proxy that delegates body-parser methods
 * to Hono's parsed getters. Pass the result to
 * `RPCHandler.handle(...)` so the body stays consumable.
 */
export const wrapForOrpc = (c: Context): Request =>
  new Proxy(c.req.raw, {
    get(target, prop) {
      if (typeof prop === "string" && BODY_PARSER_METHODS.has(prop as BodyParserMethod)) {
        switch (prop) {
          case "arrayBuffer": return () => c.req.arrayBuffer()
          case "blob":        return () => c.req.blob()
          case "formData":    return () => c.req.formData()
          case "json":        return () => c.req.json()
          case "text":        return () => c.req.text()
        }
      }
      return Reflect.get(target, prop, target)
    },
  })

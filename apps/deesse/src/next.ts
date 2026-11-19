import { Hono } from "hono"
import { handle } from "hono/vercel"
import type { DeesseHost } from "./runtime-types.js"

export function toNextJsHandler(instance: DeesseHost) {
  const host = new Hono()
  host.all("*", (context) => instance.handler(context.req.raw))
  return handle(host)
}

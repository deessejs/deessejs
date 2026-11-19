import { CATALOGUE, ITEMS } from "@workspace/content/registry"
import type { Hono } from "hono"
import { API_BASE_PATH } from "../../constants/base-path.js"
import type { ApiEnv } from "../env.js"

export const mountRegistryRoutes = (api: Hono<ApiEnv>): void => {
  api.get("/r/registry.json", (c) => c.json(CATALOGUE))
  api.get("/r/*", (c) => {
    const path = c.req.path.slice(`${API_BASE_PATH}/r/`.length)
    if (!path.endsWith(".json")) return c.text("Not found", 404)
    const name = path.slice(0, -5)
    const segments = name.split("/")
    const namespaced =
      segments.length === 2 &&
      (segments[0] === "components" || segments[0] === "blocks")
    if (segments.length !== 1 && !namespaced) return c.text("Not found", 404)
    const key = namespaced ? segments[1] : segments[0]
    const group =
      namespaced && segments[0] === "blocks" ? ITEMS.blocks : ITEMS.components
    const item = Object.entries(group).find(([entry]) => entry === key)?.[1]
    return item ? c.json(item) : c.text("Not found", 404)
  })
}

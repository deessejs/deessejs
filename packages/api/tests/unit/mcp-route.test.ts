import { describe, expect, it } from "vitest"
import { api } from "../../src/index.js"
import { API_BASE_PATH } from "../../src/constants/base-path.js"
import { serverEnv } from "@workspace/env/server"

describe("MCP HTTP route", () => {
  it("mounts the canonical resource path once", async () => {
    const canonicalPath = new URL(serverEnv.MCP_RESOURCE_URL).pathname
    const canonical = await api.request(canonicalPath, { method: "POST" })
    const doubled = await api.request(
      `${new URL(serverEnv.MCP_RESOURCE_URL).origin}${API_BASE_PATH}${canonicalPath}`,
      { method: "POST" }
    )

    expect(canonical.status).toBe(401)
    expect(doubled.status).toBe(404)
  })
})

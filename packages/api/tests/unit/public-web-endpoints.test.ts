import { describe, expect, it } from "vitest"
import { api } from "../../src/index.js"
import { API_BASE_PATH } from "../../src/constants/base-path.js"
import { serverEnv } from "@workspace/env/server"

describe("public web HTTP endpoints", () => {
  it("serves the shadcn registry index as JSON", async () => {
    const response = await api.request(`${API_BASE_PATH}/r/registry.json`)
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    const body = await response.json()
    expect(body.name).toBe("deessejs")
    expect(body.items.map((item: { name: string }) => item.name)).toEqual(["button", "input", "badge"])
  })

  it("serves registry items and returns 404 for unknown items", async () => {
    const response = await api.request(`${API_BASE_PATH}/r/button.json`)
    expect(response.status).toBe(200)
    expect((await response.json()).name).toBe("button")
    const missing = await api.request(`${API_BASE_PATH}/r/does-not-exist.json`)
    expect(missing.status).toBe(404)
    expect(await missing.text()).toBe("Not found")
  })

  it("serves the blog RSS with canonical links and cache headers", async () => {
    const response = await api.request(`${API_BASE_PATH}/blog/feed.xml`)
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8")
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=3600")
    expect(body).toContain(`<link>${serverEnv.WEB_URL}/blog</link>`)
    expect(body).toContain(`${serverEnv.WEB_URL}/blog/welcome`)
  })

  it("serves the changelog RSS with canonical links and cache headers", async () => {
    const response = await api.request(`${API_BASE_PATH}/changelog/feed.xml`)
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8")
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=3600")
    expect(body).toContain(`<link>${serverEnv.WEB_URL}/changelog</link>`)
    expect(body).toContain(`${serverEnv.WEB_URL}/changelog/0.3.1`)
  })
})

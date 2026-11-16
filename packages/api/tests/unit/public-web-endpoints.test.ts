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
    const namespaced = await api.request(`${API_BASE_PATH}/r/components/button.json`)
    expect(namespaced.status).toBe(200)
    expect((await namespaced.json()).name).toBe("button")
    const missing = await api.request(`${API_BASE_PATH}/r/does-not-exist.json`)
    expect(missing.status).toBe(404)
    expect(await missing.text()).toBe("Not found")
    expect((await api.request(`${API_BASE_PATH}/r/button/extra.json`)).status).toBe(404)
    expect((await api.request(`${API_BASE_PATH}/r/button`)).status).toBe(404)
  })

  it("serves the blog RSS with canonical links and cache headers", async () => {
    const response = await api.request(`${API_BASE_PATH}/blog/feed.xml`)
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8")
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=3600")
    expect(body).toContain(`<link>${serverEnv.WEB_URL}/blog</link>`)
    expect(body).toContain(`${serverEnv.WEB_URL}/blog/welcome`)
    const dates = [...body.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)]
      .map((match) => match[1])
      .filter((date): date is string => typeof date === "string")
      .map(Date.parse)
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
  })

  it("serves the changelog RSS with canonical links and cache headers", async () => {
    const response = await api.request(`${API_BASE_PATH}/changelog/feed.xml`)
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/rss+xml; charset=utf-8")
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=3600")
    expect(body).toContain(`<link>${serverEnv.WEB_URL}/changelog</link>`)
    expect(body).toContain(`${serverEnv.WEB_URL}/changelog/0.3.1`)
    const versions = [...body.matchAll(/<guid isPermaLink="true">[^<]*\/changelog\/(\d+\.\d+\.\d+)<\/guid>/g)].map((match) => match[1])
    expect(versions).toEqual(["0.3.1", "0.3.0", "0.2.1", "0.2.0", "0.1.1", "0.1.0"])
  })

  it("serves paginated blog posts and preserves validation statuses", async () => {
    const response = await api.request(`${API_BASE_PATH}/api/blog/posts?page=1`)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.page).toBe(1)
    expect(body.posts).toHaveLength(9)
    expect(body.posts[0].date >= body.posts[1].date).toBe(true)
    expect(body.posts[0]).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      tags: expect.any(Array),
      authors: [{ handle: "admin", name: "David Pereira" }],
    })
    expect(body.posts[0].slug).toEqual(expect.any(String))
    expect(body.posts[0].url).toBe(`/blog/${body.posts[0].slug}`)
    expect((await api.request(`${API_BASE_PATH}/api/blog/posts?page=0`)).status).toBe(400)
    expect((await api.request(`${API_BASE_PATH}/api/blog/posts?page=1&tag=unknown`)).status).toBe(404)
  })
})

import { posts } from "@workspace/content/feeds"
import type { Hono } from "hono"
import { serverEnv } from "@workspace/env/server"
import { buildBlogFeed } from "../feeds/rss.js"
import type { ApiEnv } from "../env.js"

export const mountBlogRoutes = (api: Hono<ApiEnv>): void => {
  api.get("/blog/feed.xml", (c) => {
    c.header("content-type", "application/rss+xml; charset=utf-8")
    c.header("cache-control", "public, max-age=3600, s-maxage=3600")
    return c.body(buildBlogFeed([...posts], serverEnv.WEB_URL))
  })

  api.get("/blog/posts", (c) => {
    const page = Number(c.req.query("page"))
    const tag = c.req.query("tag")
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000) {
      return c.json({ error: "Invalid page" }, 400)
    }
    const validTags = new Set([
      "engineering",
      "community",
      "news",
      "customers",
      "security",
    ])
    if (tag && !validTags.has(tag)) return c.json({ error: "Invalid tag" }, 404)
    const selected = posts.filter(
      (post) => !tag || post.tags.some((postTag) => postTag === tag),
    )
    const pageSize = 9
    const start = (page - 1) * pageSize
    return c.json({
      posts: selected.slice(start, start + pageSize),
      hasMore: start + pageSize < selected.length,
      page,
    })
  })
}

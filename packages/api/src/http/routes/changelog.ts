import { releases } from "@workspace/content/feeds"
import type { Hono } from "hono"
import { serverEnv } from "@workspace/env/server"
import { buildChangelogFeed } from "../feeds/rss.js"
import type { ApiEnv } from "../env.js"

export const mountChangelogRoutes = (api: Hono<ApiEnv>): void => {
  api.get("/changelog/feed.xml", (c) => {
    c.header("content-type", "application/rss+xml; charset=utf-8")
    c.header("cache-control", "public, max-age=3600, s-maxage=3600")
    return c.body(buildChangelogFeed([...releases], serverEnv.WEB_URL))
  })
}

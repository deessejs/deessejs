import { ORPCError } from "@orpc/server"
import { adminPage } from "@deessejs/admin"
import { createPluginApi, plugin } from "deesse"
import { z } from "zod"
import { PostsAdminPage } from "./posts-admin-page.ts"

export const postsSchema = {
  posts: {
    fields: {
      title: { type: "string" },
      createdAt: { type: "timestamp" },
    },
    indexes: [{ name: "posts_created_at_idx", fields: ["createdAt"] }],
  },
} as const

const postsRpc = createPluginApi(postsSchema)

const postsRouter = postsRpc.router({
  status: postsRpc.handler(() => ({ status: "ready" as const })),
  list: postsRpc.handler(async ({ context }) => {
    const result = await context.database.findMany("posts", {
      orderBy: { createdAt: "desc" },
      limit: 10,
    })
    if (result._tag === "Err") throw result.error
    return result.value
  }),
  create: postsRpc.input(z.object({ title: z.string().trim().min(1).max(120) })).handler(async ({ context, input }) => {
    const result = await context.database.insert("posts", {
      title: input.title,
      createdAt: new Date(),
    })
    if (result._tag === "Err") throw result.error
    return result.value
  }),
  me: postsRpc.handler(({ context }) => {
    if (!context.user) throw new ORPCError("UNAUTHORIZED")
    return { id: context.user.id, email: context.user.email }
  }),
})

export const postsPlugin = plugin({
  id: "posts",
  requires: ["admin"],
  handler: () => ({
    database: { schema: postsSchema },
    api: { router: postsRouter },
    admin: {
      pages: [adminPage({ path: "posts", title: "Posts", component: PostsAdminPage })],
    },
  }),
})

import { ORPCError, os } from "@orpc/server"
import { plugin } from "deesse"
import { z } from "zod"
import type { ExampleRequestContext } from "./src/server/types.js"

export const postsSchema = {
  posts: {
    fields: {
      title: { type: "string" },
      createdAt: { type: "timestamp" },
    },
    indexes: [{ name: "posts_created_at_idx", fields: ["createdAt"] }],
  },
} as const

const appRpc = os.router({
  health: os.handler(() => ({ status: "ok" as const })),
})

const postsRpc = os.$context<ExampleRequestContext>()

const postsRouter = postsRpc.router({
  status: postsRpc.handler(() => ({ status: "ready" as const })),
  list: postsRpc.input(z.object({ limit: z.number().int().min(1).max(100).default(10) })).handler(async ({ context, input }) => {
    const result = await context.database.findMany("posts", {
      orderBy: { createdAt: "desc" },
      limit: input.limit,
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
  handler: () => ({
    database: { schema: postsSchema },
    api: { router: postsRouter },
  }),
})

export const deesseConfig = {
  api: { router: appRpc },
  plugins: [postsPlugin()],
} as const


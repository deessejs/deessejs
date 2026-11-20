import { os } from "@orpc/server"
import { plugin } from "deesse"

const publicRouter = os.router({
  status: os.handler(() => "posts-ready"),
})

const postSchema = {
  posts: {
    fields: {
      title: { type: "string", unique: true },
      status: { type: "string" },
      publishedAt: { type: "timestamp", nullable: true },
      publishedOn: { type: "date", nullable: true },
      details: { type: "json", nullable: true },
      views: { type: "integer", default: 0 },
      live: { type: "boolean", default: false },
    },
    indexes: [{ name: "posts_status_idx", fields: ["status"] }],
  },
} as const

export const postsPlugin = plugin({
  id: "posts",
  handler: () => ({
    database: { schema: postSchema },
    api: { router: publicRouter },
  }),
})

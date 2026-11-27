import type { DeesseModelRow } from "../../types.js"

export const blogSchema = {
  posts: {
    fields: {
      title: { type: "string" },
      slug: { type: "string", unique: true },
      excerpt: { type: "text", nullable: true },
      content: { type: "text" },
      status: { type: "string", default: "draft" },
      publishedAt: { type: "timestamp", nullable: true },
      createdAt: { type: "timestamp" },
      updatedAt: { type: "timestamp" },
    },
    indexes: [{ name: "posts_status_published_at_idx", fields: ["status", "publishedAt"] }],
  },
} as const

export type BlogPostStatus = "draft" | "published"
export type BlogPost = DeesseModelRow<typeof blogSchema.posts>

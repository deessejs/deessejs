import { plugin } from "../../index.js"
import { blogRouter } from "./api.js"
import { blogSchema } from "./schema.js"

export { blogAdminPages } from "./admin/page.js"
export { blogRouter } from "./api.js"
export { blogSchema, type BlogPost, type BlogPostStatus } from "./schema.js"

export const blogPlugin = plugin({
  id: "blog",
  handler: () => ({
    database: { schema: blogSchema },
    api: { router: blogRouter },
  }),
})

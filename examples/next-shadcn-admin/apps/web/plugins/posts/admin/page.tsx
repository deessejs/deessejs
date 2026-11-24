import { adminPage } from "@deessejs/admin"
import { PostsAdminPage } from "./posts-admin-page.tsx"

export const postsAdminPages = [
  adminPage({ path: "posts", title: "Posts", component: PostsAdminPage }),
] as const

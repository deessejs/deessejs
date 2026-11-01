import type { Post } from "./types"

export const BLOG_PAGE_SIZE = 9

export function getPostPage(posts: ReadonlyArray<Post>, page: number) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
  const start = (safePage - 1) * BLOG_PAGE_SIZE
  return {
    posts: posts.slice(start, start + BLOG_PAGE_SIZE),
    hasMore: start + BLOG_PAGE_SIZE < posts.length,
    page: safePage,
  }
}

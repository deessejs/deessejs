import { describe, expect, it } from "vitest"
import { vi } from "vitest"
vi.mock("content-collections", () => ({ allPosts: [] }))
import { BLOG_PAGE_SIZE, getPostPage } from "../../src/lib/blog/posts"
import type { Post } from "../../src/lib/blog/types"

const posts = Array.from({ length: BLOG_PAGE_SIZE * 2 + 1 }, (_, index) => ({
  slug: `post-${index}`,
})) as Post[]

describe("getPostPage", () => {
  it("returns sequential, non-overlapping pages and reports the end", () => {
    const first = getPostPage(posts, 1)
    const second = getPostPage(posts, 2)
    const last = getPostPage(posts, 3)

    expect(first.posts).toHaveLength(BLOG_PAGE_SIZE)
    expect(first.hasMore).toBe(true)
    expect(second.posts[0]?.slug).toBe("post-9")
    expect(
      new Set([...first.posts, ...second.posts].map((post) => post.slug)).size
    ).toBe(18)
    expect(second.hasMore).toBe(true)
    expect(last.posts.map((post) => post.slug)).toEqual(["post-18"])
    expect(last.hasMore).toBe(false)
  })

  it("normalizes invalid pages and handles empty input", () => {
    expect(getPostPage(posts, 0).page).toBe(1)
    expect(getPostPage(posts, Number.NaN).page).toBe(1)
    expect(getPostPage([], 1)).toEqual({ posts: [], hasMore: false, page: 1 })
  })
})

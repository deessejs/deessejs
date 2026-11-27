import { ok } from "@deessejs/fp"
import { createRouterClient } from "@orpc/server"
import { describe, expect, it, vi } from "vitest"
import type {
  DeesseDatabaseService,
  DeesseRequestContext,
} from "../../../src/types.js"
import { blogRouter } from "../../../src/plugins/blog/api.js"
import { blogSchema, type BlogPost } from "../../../src/plugins/blog/schema.js"

function makePosts(count: number): BlogPost[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `post-${String(index).padStart(3, "0")}`,
    title: `Post ${index}`,
    slug: `post-${index}`,
    excerpt: null,
    content: `# Post ${index}`,
    status: "draft",
    publishedAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  }))
}

function createClient(posts: BlogPost[] = []) {
  const database = {
    findMany: vi.fn(
      async (_model: string, options?: { limit?: number; offset?: number }) => {
        const offset = options?.offset ?? 0
        const limit = options?.limit ?? 20
        const orderedPosts = posts.toSorted(
          (left, right) =>
            right.updatedAt.getTime() - left.updatedAt.getTime() ||
            right.id.localeCompare(left.id)
        )
        return ok(orderedPosts.slice(offset, offset + limit))
      }
    ),
    insert: vi.fn(async (_model: string, values: object) => {
      const post = { id: "created-post", ...values }
      return ok(post)
    }),
  } as unknown as DeesseDatabaseService<typeof blogSchema>
  const context = {
    database,
    request: new Request("https://example.test"),
    headers: new Headers(),
    user: { id: "admin-id", email: "admin@example.test", role: "admin" },
    session: {},
  } satisfies DeesseRequestContext<typeof blogSchema>

  return { client: createRouterClient(blogRouter, { context }), database }
}

describe("Blog API", () => {
  it("preserves Markdown content exactly while rejecting whitespace-only content", async () => {
    const { client, database } = createClient()
    const markdown = "\n# Heading  \n\n- first\n\t- second\u00a0\n"

    const created = await client.management.create({
      title: "Markdown",
      content: markdown,
    })

    expect(created.content).toBe(markdown)
    expect(Buffer.from(created.content, "utf8")).toEqual(
      Buffer.from(markdown, "utf8")
    )
    expect(database.insert).toHaveBeenCalledWith(
      "posts",
      expect.objectContaining({ content: markdown })
    )
    await expect(
      client.management.create({ title: "Empty", content: " \n\t" })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    })
    expect(database.insert).toHaveBeenCalledTimes(1)
  })

  it("returns bounded, navigable management pages beyond the first 100 posts", async () => {
    const { client, database } = createClient(makePosts(105))

    const firstPage = await client.management.list({ limit: 50, offset: 0 })
    expect(firstPage.posts.map(({ id }) => id)).toEqual(
      Array.from(
        { length: 50 },
        (_, index) => `post-${String(104 - index).padStart(3, "0")}`
      )
    )
    expect(firstPage.nextOffset).toBe(50)
    if (firstPage.nextOffset === null)
      throw new Error("The first page should have a next offset.")

    const secondPage = await client.management.list({
      limit: 50,
      offset: firstPage.nextOffset,
    })
    expect(secondPage.posts.map(({ id }) => id)).toEqual(
      Array.from(
        { length: 50 },
        (_, index) => `post-${String(54 - index).padStart(3, "0")}`
      )
    )
    expect(secondPage.nextOffset).toBe(100)
    if (secondPage.nextOffset === null)
      throw new Error("The second page should have a next offset.")

    const thirdPage = await client.management.list({
      limit: 50,
      offset: secondPage.nextOffset,
    })
    expect(thirdPage.posts.map(({ id }) => id)).toEqual([
      "post-004",
      "post-003",
      "post-002",
      "post-001",
      "post-000",
    ])
    expect(thirdPage.nextOffset).toBeNull()
    expect(database.findMany).toHaveBeenLastCalledWith(
      "posts",
      expect.objectContaining({
        limit: 51,
        offset: 100,
        orderBy: { updatedAt: "desc", id: "desc" },
      })
    )
  })

  it("rejects oversized management pages and unsafe offsets", async () => {
    const { client, database } = createClient()

    await expect(
      client.management.list({ limit: 100, offset: 0 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    await expect(
      client.management.list({ limit: 50, offset: Number.MAX_SAFE_INTEGER })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" })
    expect(database.findMany).not.toHaveBeenCalled()
  })
})

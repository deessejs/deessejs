import { ORPCError } from "@orpc/server"
import { createPluginApi } from "../../plugin-api.js"
import type { DeesseDatabaseResult, DeesseDatabaseService, DeesseRequestContext } from "../../types.js"
import { resolveBlogManagementAccess } from "./access.js"
import { blogSchema, type BlogPostStatus } from "./schema.js"
import { z } from "zod"

const blogRpc = createPluginApi(blogSchema)
type BlogDatabase = DeesseDatabaseService<typeof blogSchema>

const slugSchema = z.string().trim().min(1).max(160)
const editablePost = z.object({
  title: z.string().trim().min(1).max(120),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(280).nullable().optional(),
  content: z.string().max(100_000).refine((value) => value.trim().length > 0, "Markdown content cannot be empty."),
})

function requireAdministrator(context: Pick<DeesseRequestContext<typeof blogSchema>, "user">): void {
  const access = resolveBlogManagementAccess(context.user ? { role: context.user.role } : null)
  if (access === "unauthenticated") throw new ORPCError("UNAUTHORIZED")
  if (access === "forbidden") throw new ORPCError("FORBIDDEN")
}

function throwDatabaseError(error: { fields: { code: string; message: string } }): never {
  if (error.fields.code === "NOT_FOUND") throw new ORPCError("NOT_FOUND", { message: error.fields.message })
  if (error.fields.code === "CONFLICT") throw new ORPCError("CONFLICT", { message: "A post with that slug already exists." })
  if (error.fields.code === "VALIDATION") throw new ORPCError("BAD_REQUEST", { message: error.fields.message })
  throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "The post could not be saved." })
}

function unwrap<T>(result: DeesseDatabaseResult<T>): T {
  if (result._tag === "Err") throwDatabaseError(result.error)
  return result.value
}

function slugify(value: string): string {
  const slug = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .split(/[^a-z0-9]+/).filter(Boolean).join("-").slice(0, 160).replace(/-$/, "")
  return slug || "post"
}

async function uniqueSlug(database: BlogDatabase, base: string, options: { excludedId?: string; resolveCollisions?: boolean } = {}): Promise<string> {
  const normalized = slugify(base)
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? normalized : `${normalized.slice(0, 160 - String(suffix).length - 1)}-${suffix}`
    const rows = unwrap(await database.findMany("posts", { where: { slug: candidate }, limit: 1 }))
    if (!rows.length || (options.excludedId && rows[0]?.id === options.excludedId)) return candidate
    if (!options.resolveCollisions) {
      throw new ORPCError("CONFLICT", { message: "A post with that slug already exists." })
    }
  }
  throw new ORPCError("CONFLICT", { message: "Could not find an available slug. Choose a different one." })
}

const published = blogRpc.router({
  list: blogRpc.input(z.object({ limit: z.number().int().min(1).max(100).optional() }).default({})).handler(async ({ context, input }) =>
    unwrap(await context.database.findMany("posts", {
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      limit: (input.limit ?? 20) as import("../../types.js").BoundedLimit,
    }))),
  getBySlug: blogRpc.input(z.object({ slug: slugSchema })).handler(async ({ context, input }) => {
    const rows = unwrap(await context.database.findMany("posts", {
      where: { slug: input.slug, status: "published" },
      limit: 1,
    }))
    const post = rows[0]
    if (!post) throw new ORPCError("NOT_FOUND", { message: "Published post not found." })
    return post
  }),
})

const management = blogRpc.router({
  list: blogRpc.input(z.object({
    status: z.enum(["draft", "published"]).optional(),
    limit: z.number().int().min(1).max(99).default(50),
    offset: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER - 99).default(0),
  }).default({ limit: 50, offset: 0 })).handler(async ({ context, input }) => {
    requireAdministrator(context)
    const rows = unwrap(await context.database.findMany("posts", {
      ...(input.status ? { where: { status: input.status } } : {}),
      orderBy: { updatedAt: "desc", id: "desc" },
      limit: (input.limit + 1) as import("../../types.js").BoundedLimit,
      offset: input.offset,
    }))
    const hasMore = rows.length > input.limit
    return {
      posts: hasMore ? rows.slice(0, input.limit) : rows,
      offset: input.offset,
      nextOffset: hasMore ? input.offset + input.limit : null,
    }
  }),
  get: blogRpc.input(z.object({ id: z.string().uuid() })).handler(async ({ context, input }) => {
    requireAdministrator(context)
    return unwrap(await context.database.findById("posts", input.id))
  }),
  create: blogRpc.input(editablePost).handler(async ({ context, input }) => {
    requireAdministrator(context)
    const now = new Date()
    const slug = await uniqueSlug(context.database, input.slug ?? input.title, { resolveCollisions: input.slug === undefined })
    return unwrap(await context.database.insert("posts", {
      title: input.title,
      slug,
      excerpt: input.excerpt ?? null,
      content: input.content,
      status: "draft",
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    }))
  }),
  update: blogRpc.input(z.object({ id: z.string().uuid(), ...editablePost.partial().shape })).handler(async ({ context, input }) => {
    requireAdministrator(context)
    const current = unwrap(await context.database.findById("posts", input.id))
    const slug = input.slug === undefined ? current.slug : await uniqueSlug(context.database, input.slug, { excludedId: current.id })
    return unwrap(await context.database.updateById("posts", input.id, {
      ...(input.title === undefined ? {} : { title: input.title }),
      slug,
      ...(input.excerpt === undefined ? {} : { excerpt: input.excerpt }),
      ...(input.content === undefined ? {} : { content: input.content }),
      updatedAt: new Date(),
    }))
  }),
  publish: blogRpc.input(z.object({ id: z.string().uuid() })).handler(async ({ context, input }) => {
    requireAdministrator(context)
    const now = new Date()
    return unwrap(await context.database.updateById("posts", input.id, {
      status: "published" satisfies BlogPostStatus,
      publishedAt: now,
      updatedAt: now,
    }))
  }),
  unpublish: blogRpc.input(z.object({ id: z.string().uuid() })).handler(async ({ context, input }) => {
    requireAdministrator(context)
    const now = new Date()
    return unwrap(await context.database.updateById("posts", input.id, {
      status: "draft",
      publishedAt: null,
      updatedAt: now,
    }))
  }),
  delete: blogRpc.input(z.object({ id: z.string().uuid() })).handler(async ({ context, input }) => {
    requireAdministrator(context)
    unwrap(await context.database.deleteById("posts", input.id))
    return { id: input.id }
  }),
})

export const blogRouter = blogRpc.router({ published, management })

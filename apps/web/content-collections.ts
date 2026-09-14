import { defineCollection, defineConfig } from "@content-collections/core"
import { compileMDX } from "@content-collections/mdx"
import rehypeShiki from "@shikijs/rehype"
import { z } from "zod"
import readingTime from "reading-time"

const authors = defineCollection({
  name: "authors",
  directory: "content/authors",
  include: "*.md",
  schema: z.object({
    handle: z.string().min(1).max(60),
    name: z.string().min(1).max(120),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    // External identity links surfaced as schema.org `sameAs` on the
    // Person JSON-LD emitted by /blog/[slug] and /blog/author/[handle].
    // All optional; absent links are simply not emitted. The values
    // are kept as free strings (no URL validation) to match the
    // existing avatar/cover convention in this file.
    twitter: z.string().optional(),
    github: z.string().optional(),
    website: z.string().optional(),
    content: z.string(),
  }),
})

const posts = defineCollection({
  name: "posts",
  directory: "content/posts",
  include: "*.mdx",
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(280),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().min(1).optional(),
    authors: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
    cover: z.string().optional(),
    scheduled: z.string().datetime().optional(),
    content: z.string(),
  }),
  transform: async (post, context) => {
    if (post.draft && process.env.NODE_ENV === "production") {
      return context.skip("document is a draft")
    }

    if (post.scheduled && new Date(post.scheduled) > new Date()) {
      return context.skip(`scheduled for ${post.scheduled}`)
    }

    const handles = post.authors.length > 0
      ? post.authors
      : post.author
        ? [post.author]
        : []
    if (handles.length === 0) {
      throw new Error(
        `Post "${post.title}" has no author. Add \`author: <handle>\` or ` +
          `\`authors: [handle, ...]\` to its frontmatter.`,
      )
    }

    const resolvedAuthors = handles.map((handle) => {
      const author = context.documents(authors).find(
        (a) => a.handle === handle,
      )
      if (!author) {
        throw new Error(
          `Post "${post.title}" references unknown author "${handle}". ` +
            `Add content/authors/${handle}.md or fix the frontmatter.`,
        )
      }
      return author
    })

    const slug = post._meta.filePath
      .replace(/^.*\//, "")
      .replace(/\.mdx$/, "")

    const mdxCode = await compileMDX(context, post, {
      rehypePlugins: [
        [
          rehypeShiki,
          {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
        ],
      ],
    })

    const stats = readingTime(post.content)

    return {
      ...post,
      slug,
      url: `/blog/${slug}`,
      readingTime: Math.max(1, Math.round(stats.minutes)),
      authors: resolvedAuthors,
      author: resolvedAuthors[0],
      mdxCode,
    }
  },
})

const releases = defineCollection({
  name: "releases",
  directory: "content/releases",
  include: "*.mdx",
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(280),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "semver"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    categories: z
      .array(
        z.enum([
          "added",
          "changed",
          "fixed",
          "removed",
          "deprecated",
          "security",
        ]),
      )
      .default([]),
    cover: z.string().optional(),
    relatedPosts: z.array(z.string()).default([]),
    content: z.string(),
  }),
  transform: async (release, context) => {
    const slug = release._meta.filePath
      .replace(/^.*\//, "")
      .replace(/\.mdx$/, "")

    const mdxCode = await compileMDX(context, release, {
      rehypePlugins: [
        [
          rehypeShiki,
          {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
        ],
      ],
    })

    return {
      ...release,
      slug,
      url: `/changelog/${slug}`,
      mdxCode,
    }
  },
})

const kbTopics = defineCollection({
  name: "kbTopics",
  directory: "content/knowledge-base/topics",
  include: "*.mdx",
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(280),
    order: z.number().int().nonnegative().default(0),
    tags: z.array(z.string()).default([]),
    content: z.string(),
  }),
  transform: async (topic, context) => {
    const slug = topic._meta.filePath
      .replace(/^.*\//, "")
      .replace(/\.mdx$/, "")

    const mdxCode = await compileMDX(context, topic, {
      rehypePlugins: [
        [
          rehypeShiki,
          {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
        ],
      ],
    })

    return {
      ...topic,
      slug,
      url: `/knowledge-base/topics/${slug}`,
      mdxCode,
    }
  },
})

const kbGuides = defineCollection({
  name: "kbGuides",
  directory: "content/knowledge-base/guides",
  include: "*.mdx",
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(280),
    topic: z.string().min(1),
    products: z.array(z.string()).default([]),
    order: z.number().int().nonnegative().default(0),
    draft: z.boolean().default(false),
    content: z.string(),
  }),
  transform: async (guide, context) => {
    if (guide.draft && process.env.NODE_ENV === "production") {
      return context.skip("document is a draft")
    }

    const slug = guide._meta.filePath
      .replace(/^.*\//, "")
      .replace(/\.mdx$/, "")

    const mdxCode = await compileMDX(context, guide, {
      rehypePlugins: [
        [
          rehypeShiki,
          {
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          },
        ],
      ],
    })

    return {
      ...guide,
      slug,
      url: `/knowledge-base/guides/${slug}`,
      mdxCode,
    }
  },
})

export default defineConfig({
  content: [authors, posts, releases, kbTopics, kbGuides],
})

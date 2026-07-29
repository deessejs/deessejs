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

export default defineConfig({
  content: [authors, posts, releases],
})

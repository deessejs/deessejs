import { defineCollection, defineConfig } from "@content-collections/core"
import { compileMDX } from "@content-collections/mdx"
import type { Root, Element } from "hast"
import { visit } from "unist-util-visit"

/**
 * Custom rehype plugin (inlined to avoid esbuild import-resolution
 * issues at content-collections build time). Captures the raw source
 * text of every fenced code block and stores it in `data-code` and
 * `data-language` attributes on the `<pre>` element so the MDX
 * runtime's `MdxPre` adapter can hand the source to `<CodeBlock>`,
 * which is the single source of truth for shiki output at request
 * time.
 *
 * The build-time shiki transformer is intentionally NOT in the
 * pipeline anymore: dual-theme output via the rehype plugin is hard
 * to combine with a runtime shiki re-render without doubling the
 * work, and the runtime-only path keeps the contract in one place.
 */
function rehypeStoreRawCode() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return

      const codeNode = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code",
      )
      if (!codeNode) return

      const raw = collectText(codeNode).replace(/\n$/, "")

      const classNames = Array.isArray(codeNode.properties?.className)
        ? ((codeNode.properties.className as string[]) ?? [])
        : []
      const langClass = classNames.find(
        (c: string) => typeof c === "string" && c.startsWith("language-"),
      )
      const language = langClass ? langClass.replace("language-", "") : undefined

      node.properties = {
        ...node.properties,
        "data-code": raw,
        ...(language ? { "data-language": language } : {}),
      }
    })
  }
}

function collectText(node: Element): string {
  let out = ""
  for (const child of node.children) {
    if (child.type === "text") {
      out += child.value
    } else if (child.type === "element") {
      out += collectText(child)
    }
  }
  return out
}
import { z } from "zod"
import readingTime from "reading-time"

const authors = defineCollection({
  name: "authors",
  directory: "content/authors",
  include: "*.md",
  schema: z.object({
    handle: z.string().min(1).max(60),
    name: z.string().min(1).max(120),
    role: z.string().min(1).max(120).optional(),
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
    tags: z
      .array(
        z.enum(["engineering", "community", "news", "customers", "security"]),
      )
      .default([]),
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
        // `rehypeStoreRawCode` is the build-time plugin that captures
        // the raw source of every fenced code block and stores it on
        // the `<pre>` element as `data-code` / `data-language`. The
        // MDX runtime reads those attrs and hands them to <CodeBlock>,
        // which is the single source of truth for shiki output. The
        // build-time shiki transformer is intentionally NOT in this
        // pipeline: dual-theme output is hard to combine with a
        // runtime shiki re-render without doubling the work, and the
        // runtime-only path keeps the contract in one place.
        [rehypeStoreRawCode],
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
    authors: z.array(z.string().min(1)).default([]),
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
    const handles = release.authors
    if (handles.length === 0) {
      throw new Error(
        `Release "${release.title}" has no author. Add ` +
          "`authors: [<handle>]` to its frontmatter.",
      )
    }

    const resolvedAuthors = handles.map((handle) => {
      const author = context.documents(authors).find(
        (a) => a.handle === handle,
      )
      if (!author) {
        throw new Error(
          `Release "${release.title}" references unknown author "${handle}". ` +
            `Add content/authors/${handle}.md or fix the frontmatter.`,
        )
      }
      return author
    })

    const slug = release._meta.filePath
      .replace(/^.*\//, "")
      .replace(/\.mdx$/, "")

    const mdxCode = await compileMDX(context, release, {
      rehypePlugins: [
        [rehypeStoreRawCode],
      ],
    })

    return {
      ...release,
      authors: resolvedAuthors,
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
        [rehypeStoreRawCode],
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
    author: z.string().min(1).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
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

    const author = guide.author
      ? context.documents(authors).find((a) => a.handle === guide.author)
      : undefined
    if (guide.author && !author) {
      throw new Error(
        `Guide "${guide.title}" references unknown author "${guide.author}". ` +
          `Add content/authors/${guide.author}.md or fix the frontmatter.`,
      )
    }

    const stats = readingTime(guide.content)

    const mdxCode = await compileMDX(context, guide, {
      rehypePlugins: [
        [rehypeStoreRawCode],
      ],
    })

    return {
      ...guide,
      author,
      readingTime: Math.max(1, Math.round(stats.minutes)),
      slug,
      url: `/knowledge-base/guides/${slug}`,
      mdxCode,
    }
  },
})

export default defineConfig({
  content: [authors, posts, releases, kbTopics, kbGuides],
})

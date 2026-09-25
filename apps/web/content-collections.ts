import { defineCollection, defineConfig } from "@content-collections/core"
import { compileMDX } from "@content-collections/mdx"
import rehypeShiki from "@shikijs/rehype"
import type { Element, Root } from "hast"
import { visit } from "unist-util-visit"
import { z } from "zod"
import readingTime from "reading-time"

/**
 * Build-time rehype plugin that assigns stable `id` attributes to
 * every <h2> and <h3> emitted by the MDX. Without this, the table
 * of contents on the guide / blog / changelog detail pages links
 * to anchors that do not exist in the SSR HTML — clicking a TOC
 * item does nothing on the first paint because the ids are added
 * by a client-side useEffect that runs only after hydration.
 *
 * Slug rules match the popular `github-slugger` behavior (which we
 * do not have as a dependency): lowercase, dashes for whitespace,
 * drop non-word characters, dedupe by suffixing -1, -2, … when two
 * headings share the same text (e.g. consecutive "What's next").
 *
 * Must run BEFORE @shikijs/rehype so the heading ids are stable when
 * code blocks are highlighted. Runs as a custom plugin below the
 * @shikijs/rehype slot in every rehypePlugins array; cheap (only
 * walks headings, of which there are at most ~20 per doc).
 */
function rehypeHeadingIds() {
  return (tree: Root) => {
    const counts = new Map<string, number>()
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return

      const existing = node.properties?.id
      if (typeof existing === "string" && existing.length > 0) {
        // Editor-supplied id (rare in our MDX) wins.
        counts.set(existing, (counts.get(existing) ?? 0) + 1)
        return
      }

      const text = collectText(node)
      const base = slugify(text)
      const seen = counts.get(base) ?? 0
      counts.set(base, seen + 1)
      const id = seen === 0 ? base : `${base}-${seen}`

      node.properties = {
        ...(node.properties ?? {}),
        id,
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

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
        // Build-time Shiki: @shikijs/rehype replaces every fenced
        // code block in the MDX with the shiki-highlighted HTML
        // (theme="github-dark", class="shiki shiki-themes …", inline
        // `color` on token spans). The MDX runtime then renders that
        // HTML through MdxPre, which only adds the surrounding
        // border/overflow chrome — no runtime shiki, no client
        // bundling, no async boundary.
        [rehypeHeadingIds],
        [rehypeShiki, { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false }],
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
        [rehypeHeadingIds],
        [rehypeShiki, { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false }],
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
        [rehypeHeadingIds],
        [rehypeShiki, { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false }],
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
        [rehypeHeadingIds],
        [rehypeShiki, { themes: { light: "github-light", dark: "github-dark" }, defaultColor: false }],
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

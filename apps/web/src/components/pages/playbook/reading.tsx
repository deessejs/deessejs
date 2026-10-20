import { PostCardGrid } from "@/components/blog/blog-post-grid"
import { Section } from "@/components/marketing/section"
import { getAllPosts } from "@/lib/blog/posts"

/**
 * Three most recent blog posts, as a closing block under the hero.
 *
 * Server Component: `getAllPosts()` reads the content collection at
 * build time and already sorts newest-first, so the three shown are
 * simply the first three. Nothing is interactive here, so no
 * `"use client"` and no Embla in the bundle.
 *
 * The cards are not rebuilt. `PostCardGrid` is the grid every blog
 * surface shares (`/blog`, `/blog/tag/[tag]`, `/blog/author/[handle]`,
 * and the "Related reading" block on `/blog/[slug]`), and it carries
 * the border strategy: each cell takes `border-r border-b` while the
 * inner list shifts `-mr-px -mb-px` so the outermost edges clip
 * against the grid's own frame instead of doubling. One rule on every
 * interior edge, none doubled.
 *
 * `PostCardGrid` draws its own frame, so it sits inset inside the
 * section's padding rather than full-bleed. Full-bleed would place
 * its border directly on the page card's border and read as a
 * doubled line.
 */
export function Reading() {
  const posts = getAllPosts().slice(0, 3)
  if (posts.length === 0) return null

  return (
    <Section>
      <div className="flex flex-col gap-2 p-6 lg:p-12">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          From the blog
        </p>
        <h2 className="text-heading-32 tracking-tight text-balance lg:text-heading-40">
          More on the same problem
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          Three articles on keeping agent-written code readable,
          testable, and maintainable after the first commit.
        </p>
      </div>
      <div className="px-6 pb-6 lg:px-12 lg:pb-12">
        <PostCardGrid posts={posts} />
      </div>
    </Section>
  )
}
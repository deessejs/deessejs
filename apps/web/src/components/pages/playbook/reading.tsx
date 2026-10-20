import { PostCard } from "@/components/blog/post-card"
import { Section } from "@/components/marketing/section"
import { getAllPosts } from "@/lib/blog/posts"

/**
 * Three most recent blog posts, as a closing block under the hero.
 *
 * The section chrome is the homepage `ForWho` recipe, not the
 * blog's `PostCardGrid`: `<Section>` is the grid container so the
 * `divide-y` / `divide-x` rules apply directly to the cells, the
 * header spans all three columns with its own `border-b`, and the
 * borders sit flush against the page card like every other
 * homepage section. `PostCardGrid` instead draws its own inset
 * frame, which would nest a second bordered box inside the page.
 *
 * The card content is the blog's own `<PostCard>`, so the cells
 * carry the real post title, description, date, tags, author, and
 * reading time, with the card's hover treatment. The cards are
 * direct grid children; the `divide-x` borders fall between them
 * and the header (which spans full width) supplies the bottom rule.
 *
 * Server Component: `getAllPosts()` reads the content collection at
 * build time and already sorts newest-first, so the three shown are
 * simply the first three. Nothing is interactive here, so no
 * `"use client"` and no Embla in the bundle.
 */
export function Reading() {
  const posts = getAllPosts().slice(0, 3)
  if (posts.length === 0) return null

  return (
    <Section className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
      <div className="flex flex-col col-span-1 md:col-span-3 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">From the blog</p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            More on the same problem
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
            Three articles on keeping agent-written code readable,
            testable, and maintainable after the first commit.
          </p>
        </div>
      </div>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </Section>
  )
}
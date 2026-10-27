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
 * reading time, with the card's hover treatment.
 *
 * Each `PostCard` is wrapped in a neutral `flex flex-col` cell. The
 * grid's `divide-x` targets direct children, and `PostCard` is a
 * `Card` carrying `border-0 ring-0` to strip the shadcn border in
 * the blog's own grid. Those zeroed borders can win against the
 * `divide-x` rule, leaving the cards with no divider between them.
 * A plain wrapper owns the divider instead, so each card reliably
 * gets one, exactly like every ForWho cell.
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
    <Section className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
      <div className="col-span-1 flex flex-col border-0 md:col-span-3">
        <div className="flex flex-col gap-2 border-b border-border p-6">
          <p className="text-label-13 text-muted-foreground">From the blog</p>
          <h2 className="text-heading-32 tracking-tight text-balance lg:text-heading-40">
            More on the same problem
          </h2>
          <p className="max-w-2xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
            Three articles on keeping agent-written code readable, testable, and
            maintainable after the first commit.
          </p>
        </div>
      </div>
      {posts.map((post) => (
        <div key={post.slug} className="flex flex-col">
          <PostCard post={post} />
        </div>
      ))}
    </Section>
  )
}

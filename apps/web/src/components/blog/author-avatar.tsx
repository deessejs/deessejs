import Image from "next/image"
import Link from "next/link"
import type { Author } from "@/lib/blog/types"

/**
 * Vercel's universal SVG identicon endpoint. Same endpoint and same
 * `dpl=` cookie value as `apps/app/components/sidebars/nav-user.tsx`,
 * so author avatars stay visually consistent across the web and app
 * surfaces. The endpoint serves a deterministic SVG for any input —
 * no PII required.
 */
const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"
const VERCEL_AVATAR_DPL =
  "dpl_AS99V7XmtTzE4xdb72tYFtNTVV48" as const

/** Build the avatar URL for an author. Prefers `author.avatar` from
 *  the frontmatter; falls back to a Vercel SVG identicon keyed on the
 *  author's handle. */
export function authorAvatarUrl(
  author: Pick<Author, "handle" | "avatar">,
): string {
  if (author.avatar) return author.avatar
  return `${VERCEL_AVATAR_BASE}?s=64&u=${encodeURIComponent(author.handle)}&dpl=${VERCEL_AVATAR_DPL}`
}

/**
 * Avatar component for an author. By default it renders as a Link to
 * the author profile page. Pass `asLink={false}` when nesting inside
 * another Link (e.g. a card or timeline row that is itself a Link)
 * to avoid invalid nested `<a>` HTML.
 */
export function AuthorAvatarLink({
  author,
  size = 32,
  asLink = true,
}: {
  author: Pick<Author, "handle" | "name">
  size?: number
  /** Render the avatar as a Link to `/blog/author/[handle]`. Set to
   *  `false` when the avatar is already inside a parent Link. */
  asLink?: boolean
}) {
  const img = (
    <Image
      src={authorAvatarUrl(author)}
      alt=""
      width={size}
      height={size}
      className="rounded-full bg-muted dark:invert"
      style={{ width: size, height: size }}
    />
  )

  if (!asLink) {
    return (
      <span
        aria-label={`Author: ${author.name}`}
        title={author.name}
        className="inline-flex shrink-0"
      >
        {img}
      </span>
    )
  }

  return (
    <Link
      href={`/blog/author/${encodeURIComponent(author.handle)}`}
      aria-label={`Author: ${author.name}`}
      title={author.name}
      className="inline-flex shrink-0 transition-opacity hover:opacity-80"
    >
      {img}
    </Link>
  )
}

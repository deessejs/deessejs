/**
 * Pure helpers extracted from `user-menu.tsx` so they can be unit
 * tested without pulling the React component, lucide icons, the
 * auth client, or the env schema into the test graph.
 *
 * See `apps/web/test/unit/user-menu.test.ts` for the pinned
 * expectations.
 */

const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"

/**
 * Two-letter uppercase initials for a user display name.
 *
 * Empty / whitespace-only / null inputs return `"?"` so the
 * avatar fallback renders something visible rather than blank.
 * Single-word names take the first two characters (uppercased);
 * multi-word names take the first letter of the first and last
 * word. This mirrors `apps/app/components/sidebars/nav-user.tsx`
 * line 46.
 */
export function getInitials(name: string | null | undefined): string {
	const safe = (name ?? "").trim()
	if (safe.length === 0) return "?"
	const parts = safe.split(/\s+/).filter(Boolean)
	if (parts.length === 0) return "?"
	if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
	return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/**
 * Returns the avatar URL for a user. The explicit `image` (set by
 * the OAuth provider, surfaced by Better Auth) wins when present;
 * otherwise we fall back to the Vercel avatar endpoint, which
 * renders a deterministic SVG for any email. This is the same
 * fallback `apps/app/components/sidebars/nav-user.tsx` uses
 * (line 53-56).
 */
export function getAvatarUrl(email: string, image?: string | null): string {
	if (image) return image
	return `${VERCEL_AVATAR_BASE}?s=40&u=${encodeURIComponent(email)}`
}

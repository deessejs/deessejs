const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"

/**
 * Deployment token baked into the existing NavUser avatar URL
 * (see apps/app/components/sidebars/nav-user.tsx line 53-56). ADR-014
 * plans to move this to a real env var; until then both the user
 * and organization avatars share the same token literal.
 */
const DPL = "dpl_AS99V7XmtTzE4xdb72tYFtNTVV48"

/**
 * Build the Vercel-style avatar URL for an arbitrary identifier
 * (user email, organization id, etc). The shape mirrors the
 * helper already wired into <NavUser /> — extracted so orgs, teams,
 * and any future avatar surface share one source of truth.
 */
export function getAvatarUrl(
	identifier: string,
	options: { size?: number; image?: string | null } = {},
): string {
	if (options.image) return options.image
	const size = options.size ?? 40
	return `${VERCEL_AVATAR_BASE}?s=${size}&u=${encodeURIComponent(identifier)}&dpl=${DPL}`
}
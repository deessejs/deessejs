/**
 * Dummy org-slug routing constant (ADR-030 §"Decision #5").
 *
 * The per-organization dashboard is scoped at `/[orgSlug]/home`.
 * Until the better-auth org plugin lands (PR #4), we hardcode the
 * slug to `acme` so every internal link lands somewhere usable.
 */
export const ORG_SLUG = "acme" as const

export function orgHomePath(slug: string = ORG_SLUG): string {
	return `/${slug}/home`
}

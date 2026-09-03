/**
 * Dummy org-slug routing constant (ADR-030 §"Decision #5").
 *
 * The per-organization dashboard is scoped at `/[orgSlug]/home`.
 * Until the better-auth org plugin lands (PR #4), we hardcode the
 * slug to `acme` so every internal link lands somewhere usable.
 * Search and replace `HOME_PATH` → `orgHomePath(ORG_SLUG)` once the
 * real session-aware resolution is wired.
 */
export const ORG_SLUG = "acme" as const

export function orgHomePath(slug: string = ORG_SLUG): string {
	return `/${slug}/home`
}

/**
 * Backward-compat alias used in a few places that haven't been
 * migrated yet. Keep the literal so the project still grep-clears.
 */
export const LEGACY_HOME_PATH = "/home"

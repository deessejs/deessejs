import { redirect } from "next/navigation"

import { orgHomePath, ORG_SLUG } from "@/lib/org-route"

/**
 * Backward-compat entry. Redirects `/home` to the dummy per-org
 * dashboard at `/${ORG_SLUG}/home`. Once the better-auth org plugin
 * lands (ADR-030 PR #4), this becomes a real active-org lookup.
 */
export default function LegacyHomePage(): never {
	redirect(orgHomePath(ORG_SLUG))
}
import { redirect } from "next/navigation"
import {
	requireAccountSession,
	getDefaultOrganizationSlug,
} from "@/lib/organization-auth"

/**
 * Authenticated routing entry (RFC-001 §8):
 *   - incomplete accounts → /onboarding/first-organization
 *   - completed accounts with a valid selected organization → its home
 *   - completed accounts without a valid selected organization → their
 *     default organization's home
 *
 * The proxy at apps/app/proxy.ts short-circuits when the request
 * matches an explicit auth-page or org-scoped path; the root `/` is
 * NOT in that matcher, so the proxy passes it through and this
 * Server Component owns the routing.
 *
 * The `requireAccountSession` helper redirects unauthenticated
 * requests to /login. The "is the account verified" and
 * "does the account have a default organization" checks live in
 * the helpers because the routing needs both pieces of information
 * to pick the right destination.
 */
export default async function RootPage() {
	const session = await requireAccountSession()

	if (!session.user.emailVerified) {
		redirect("/verify-email")
	}

	const defaultSlug = await getDefaultOrganizationSlug(session.user.id)
	if (!defaultSlug) {
		redirect("/onboarding/first-organization")
	}

	// For the scaffolding step the active-organization resolution is
	// the same as the default; the implementation branch will
	// compare against `session.session.activeOrganizationId` first
	// and fall back to the default.
	redirect(`/${defaultSlug}/home`)
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { API_AUTH_PATH } from "@workspace/api/base-path"

/**
 * Reserved top-level route segments. Classified BEFORE the
 * organization-slug segment in the proxy's JavaScript branch so an
 * organization named `account`, `onboarding`, `admin` or `api` can
 * never shadow a system route. Keep this set in sync with
 * `RESERVED_ORGANIZATION_SLUGS` in `packages/auth/src/auth.ts` and
 * `validateOrganizationSlug` (RFC-001 §6).
 */
const RESERVED_SEGMENTS = new Set([
	"account",
	"admin",
	"onboarding",
	"accept-invitation",
	"api",
	"login",
	"signup",
	"forgot-password",
	"reset-password",
	"verify-email",
	"device",
])

/**
 * Organization-scoped route prefixes. The first URL segment is the
 * organization slug; the proxy does NOT treat it as a slug unless it
 * passes the reserved-segment filter below. `/[organization_slug]/*`
 * replaces the previous `/home` and `/settings` flat routes
 * (RFC-001 §8).
 */
const ORG_SCOPED_PREFIXES = ["/home", "/settings"] as const

/**
 * Onboarding and account routes that bypass the organization-slug
 * classification. `/onboarding/*` is the first-organization wizard
 * (mandatory destination when the account has no default). The
 * proxy short-circuits for it (no gate runs). `/account/*` is
 * account-scoped settings that never require organization
 * membership.
 */
const BYPASS_PREFIXES = ["/onboarding", "/accept-invitation"] as const

/**
 * Auth pages (unauthenticated surfaces). A signed-in user landing
 * on one of these is redirected to their account default home.
 */
const AUTH_PREFIXES = [
	"/login",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	// /device is intentionally NOT here: an authenticated user
	// landing on /device from the CLI's auth login must see the
	// approve / deny view, not /home. Routing is owned by the
	// page-level Server Component. See ADR-022 §"Bug B".
] as const

/**
 * Match every request the proxy might gate. The actual gate
 * decision happens in the proxy body; the matcher is a coarse
 * filter that skips static assets and framework internals.
 */
export const config = {
	matcher: [
		// Organization-scoped pages (the first segment is a slug).
		"/:organization_slug/home/:path*",
		"/:organization_slug/settings/:path*",
		// Onboarding, account, accept-invitation.
		"/onboarding/:path*",
		"/account/:path*",
		"/accept-invitation/:path*",
		// Auth pages.
		"/login",
		"/signup",
		"/forgot-password",
		"/reset-password",
		"/verify-email",
		"/device",
		// Legacy /home and /settings pages exist as redirect-only
		// Server Components during the migration window. The proxy
		// does not gate them (they are trivial redirects to
		// /account/settings/profile and /, both of which have their
		// own auth handling).
		"/home",
		"/home/:path*",
		"/settings",
		"/settings/:path*",
	],
}

/**
 * The proxy uses a pure HTTP fetch to /api/v1/auth/get-session
 * instead of importing better-auth directly (see the original proxy
 * for the rationale: Turbopack cannot bundle postgres for the
 * Edge runtime).
 */
interface GetSessionResponse {
	user?: { id?: string; emailVerified?: boolean } | null
	session?: unknown
}

export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname

	// 1. Bypass routes short-circuit before any classification work.
	// `/onboarding/*` and `/accept-invitation/*` are reachable
	// without a gate; the page-level Server Component owns its own
	// auth checks.
	if (
		BYPASS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
	) {
		return NextResponse.next()
	}

	// 2. Classify the first path segment. Reserved segments
	// (`/account`, `/admin`, `/api`, `/login`, ...) must be
	// classified before any organization-slug interpretation so an
	// organization named `account` cannot shadow `/account/settings`.
	const firstSegment = pathname.split("/")[1] ?? ""
	const isReservedSegment = RESERVED_SEGMENTS.has(firstSegment)

	// 3. Auth pages: a signed-in user lands on `/login` (e.g. from
	// a stale redirect) — bounce them to the post-onboarding
	// destination. We can't read the active org here, so we send
	// them to a placeholder that the page-level layout resolves to
	// their default.
	const isAuthPage = AUTH_PREFIXES.some(
		(p) => pathname === p || pathname.startsWith(`${p}/`),
	)

	// 4. Organization-scoped routes. Two cases:
	//   (a) the first segment is reserved → not an org route, treat
	//       as an account / admin / auth page (handled below by the
	//       session checks).
	//   (b) the first segment is anything else → treat as
	//       organization slug. The page-level layout and Server
	//       Actions call `requireOrganizationAccess` for the real
	//       authorization (RFC-001 §10 "Authoritative guard
	//       placement"). The proxy only handles the login /
	//       email-verification redirects.
	const isOrgScoped =
		!isReservedSegment &&
		firstSegment !== "" &&
		ORG_SCOPED_PREFIXES.some(
			(p) => pathname === `/${firstSegment}${p}` || pathname.startsWith(`/${firstSegment}${p}/`),
		)

	// 5. Account-scoped routes. The proxy treats `/account/*` like
	// the legacy `/settings/*` did: requires sign-in and email
	// verification, no organization membership check.
	const isAccountScoped =
		firstSegment === "account" && pathname.startsWith("/account/")

	// 6. Decide whether the proxy needs to call getSession at all.
	// Skip the roundtrip on static assets and unrelated requests.
	const needsGate = isOrgScoped || isAccountScoped || isAuthPage
	if (!needsGate) {
		return NextResponse.next()
	}

	// 7. Self-fetch the session. Same-origin so Vercel previews and
	// local dev both work without per-environment env wiring.
	const getSessionUrl = new URL(
		`${API_AUTH_PATH}/get-session`,
		request.nextUrl.origin,
	)
	const response = await fetch(getSessionUrl, {
		headers: { cookie: request.headers.get("cookie") ?? "" },
	})
	const session = (response.ok
		? ((await response.json()) as GetSessionResponse | null)
		: null)

	// 8. Auth gate. Org-scoped and account-scoped routes both
	// require a signed-in account. Email verification is checked
	// for both surfaces; the organization-onboarding redirect
	// lives in the page-level layout (the proxy does not query
	// memberships or provisioning rows per RFC-001 §10 "Auth
	// transport and proxy").
	if ((isOrgScoped || isAccountScoped) && !session?.user) {
		const loginUrl = new URL("/login", request.url)
		loginUrl.searchParams.set("redirect", pathname)
		return NextResponse.redirect(loginUrl)
	}

	if (
		(isOrgScoped || isAccountScoped) &&
		session?.user &&
		!session.user.emailVerified
	) {
		return NextResponse.redirect(new URL("/verify-email", request.url))
	}

	// 9. Auth pages: a signed-in user lands on `/login` — bounce
	// them. We send them to `/onboarding/first-organization` if
	// they have no default, otherwise the layout resolves their
	// default. The proxy itself doesn't know the default, so the
	// post-signin destination is `/`; the root page Server
	// Component picks the right target.
	//
	// `/verify-email` is special: an authed user who has not yet
	// verified their email must be allowed to land here, otherwise
	// the gate sends them to `/verify-email` from `/` and back in
	// a loop. We only bounce to `/` when the email IS verified.
	if (isAuthPage && session?.user) {
		const isVerifyEmailPage =
			pathname === "/verify-email" || pathname.startsWith("/verify-email/")
		if (!isVerifyEmailPage || session.user.emailVerified) {
			return NextResponse.redirect(new URL("/", request.url))
		}
	}

	return NextResponse.next()
}

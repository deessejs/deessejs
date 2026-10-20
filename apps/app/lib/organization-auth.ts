import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth } from "@workspace/auth"
import { fetchFullOrganization } from "@workspace/auth/organization/queries"

export type AccountSession = { userId: string; emailVerified: boolean }

export async function requireAccountSession(): Promise<AccountSession> {
  const data = await auth.api.getSession({ headers: await headers() })
  if (!data?.session || !data.user) redirect("/login")
  return {
    userId: data.user.id,
    emailVerified: data.user.emailVerified === true,
  }
}

/**
 * Better Auth's default built-in roles. The member table column is
 * `text` (verified against better-auth 1.7.7: `role: z.string()`),
 * so the application must validate at runtime: a value outside this
 * set is treated as "no membership sufficient for any protected
 * action".
 */
const KNOWN_ROLES = ["owner", "admin", "member"] as const
type OrgRole = (typeof KNOWN_ROLES)[number]

// Declared as `Set<string>` rather than `Set<OrgRole>` so `.has` takes
// the unknown value being tested instead of demanding a narrower one.
const KNOWN_ROLE_SET: ReadonlySet<string> = new Set(KNOWN_ROLES)

const ROLE_RANK: Record<OrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
}

function isOrgRole(value: string): value is OrgRole {
  return KNOWN_ROLE_SET.has(value)
}

export type OrgAccessAction =
  | "view"
  | "view-members"
  | "manage-invitations"
  | "manage-settings"
  | "delete-organization"

const KNOWN_ACTION_SET: ReadonlySet<string> = new Set<OrgAccessAction>([
  "view",
  "view-members",
  "manage-invitations",
  "manage-settings",
  "delete-organization",
])

function isOrgAccessAction(value: string): value is OrgAccessAction {
  return KNOWN_ACTION_SET.has(value)
}

const ACTION_MIN_RANK: Record<OrgAccessAction, number> = {
  view: ROLE_RANK.member,
  "view-members": ROLE_RANK.member,
  "manage-invitations": ROLE_RANK.admin,
  "manage-settings": ROLE_RANK.admin,
  "delete-organization": ROLE_RANK.owner,
}

export type OrgAccess = {
  userId: string
  organizationId: string
  slug: string
  role: OrgRole
}

// Better Auth's organization plugin throws `APIError("BAD_REQUEST", {
// code: "ORGANIZATION_NOT_FOUND" })` when the slug does not match an
// existing organization, and `APIError("FORBIDDEN", { code:
// "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION" })` when the session is
// valid but the user has no membership in the org. The reference
// table is `ORGANIZATION_ERROR_CODES` in
// `node_modules/better-auth/dist/plugins/organization/error-codes.mjs`.
const ORG_ERROR_NOT_FOUND = "ORGANIZATION_NOT_FOUND"
const ORG_ERROR_NOT_A_MEMBER = "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION"

/**
 * Read the `code` discriminator off an `APIError` body.
 *
 * `error.body` is typed `unknown`, and Better Auth's error bodies are
 * not uniform: some carry `code`, some carry only `message`. Narrow
 * the value rather than asserting a shape, so a body that changes
 * shape upstream degrades to "unknown code" (and therefore to the
 * rethrow path) instead of silently reading `undefined`.
 */
function readApiErrorCode(error: APIError): string | undefined {
  const body: unknown = error.body
  if (typeof body !== "object" || body === null) return undefined
  if (!("code" in body)) return undefined
  const code = body.code
  return typeof code === "string" ? code : undefined
}

/**
 * Server-only authorization guard for organization-scoped routes.
 *
 * `apps/app` reads organization state through Better Auth's API, never
 * through `@workspace/database`: the database package is the storage
 * layer, and the application talks to an API. `fetchFullOrganization`
 * wraps Better Auth's own `getFullOrganization` endpoint, which joins
 * the organization to its members and enforces membership server-side
 * before returning.
 *
 * That endpoint's own errors are what let this function distinguish
 * "the organization does not exist" from "you are not a member of it",
 * which are different user-facing outcomes and must not collapse into
 * a single redirect.
 */
export async function requireOrganizationAccess(
  slug: string,
  action: string,
): Promise<OrgAccess> {
  if (!isOrgAccessAction(action)) {
    console.error(
      "[organization-auth] unknown action",
      JSON.stringify({ action, slug }),
    )
    redirect("/error?reason=misconfigured")
  }

  const session = await requireAccountSession()

  let full
  try {
    full = await fetchFullOrganization({
      headers: await headers(),
      query: { organizationSlug: slug },
    })
  } catch (error) {
    if (error instanceof APIError) {
      const code = readApiErrorCode(error)
      if (code === ORG_ERROR_NOT_FOUND) redirect("/no-organization")
      if (code === ORG_ERROR_NOT_A_MEMBER) redirect(`/${slug}/forbidden`)
    }
    throw error
  }

  if (!full) redirect("/no-organization")

  const membership = full.members.find((m) => m.userId === session.userId)
  if (!membership) {
    // Defensive: the endpoint throws USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION
    // before this branch is reached. If we land here, the membership
    // table is out of sync with the session.
    redirect(`/${slug}/forbidden`)
  }

  if (!isOrgRole(membership.role)) {
    console.error(
      "[organization-auth] unknown role",
      JSON.stringify({
        role: membership.role,
        organizationId: full.id,
        userId: session.userId,
      }),
    )
    redirect(`/${slug}/forbidden`)
  }

  if (ROLE_RANK[membership.role] < ACTION_MIN_RANK[action]) {
    redirect(`/${slug}/forbidden`)
  }

  return {
    userId: session.userId,
    organizationId: full.id,
    slug: full.slug,
    role: membership.role,
  }
}
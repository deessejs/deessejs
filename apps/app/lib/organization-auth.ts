import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth, type AuthSession } from "@workspace/auth"

export type AccountSession = { userId: string; emailVerified: boolean }

export async function requireAccountSession(): Promise<AccountSession> {
  const data = (await auth.api.getSession({
    headers: await headers(),
  })) as AuthSession | null
  if (!data?.session || !data.user) redirect("/login")
  return {
    userId: data.user.id,
    emailVerified: data.user.emailVerified === true,
  }
}

// Better Auth's default built-in roles. The member table column is
// `text` (verified against better-auth 1.7.7: `role: z.string()`), so
// the application must validate at runtime — a value outside this
// set is treated as "no membership sufficient for any protected
// action".
const KNOWN_ROLES = ["owner", "admin", "member"] as const
type OrgRole = (typeof KNOWN_ROLES)[number]

const ROLE_RANK: Record<OrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
}

function isOrgRole(value: string): value is OrgRole {
  return (KNOWN_ROLES as readonly string[]).includes(value)
}

export type OrgAccessAction =
  | "view"
  | "view-members"
  | "manage-invitations"
  | "manage-settings"
  | "delete-organization"

const KNOWN_ACTIONS: readonly OrgAccessAction[] = [
  "view",
  "view-members",
  "manage-invitations",
  "manage-settings",
  "delete-organization",
]

function isOrgAccessAction(value: string): value is OrgAccessAction {
  return (KNOWN_ACTIONS as readonly string[]).includes(value)
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

  // Better Auth's `getFullOrganization` returns the org joined to its
  // members and invitations. The session middleware (orgSessionMiddleware)
  // validates the user is signed in; the handler then enforces
  // membership against the org adapter, throwing
  // USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION otherwise. We never query
  // the database directly from this layer — the only way to read org
  // state from `apps/app` is through the auth API surface, which is
  // what `auth.api.getFullOrganization` provides.
  //
  // The `as AuthApi` cast mirrors the pattern in `admin-auth.ts`: the
  // TS2883 workaround on `packages/auth/src/auth.ts` widens the
  // inferred `$Infer` chain via the `authConfig: BetterAuthOptions`
  // annotation, and the `as ReturnType<typeof betterAuth<...>>` cast
  // on the public `auth` export narrows the static type-flow
  // through `User` and the plugin-augmented shape. The same narrowing
  // applies to `auth.api.*` member access — the static shape on
  // `auth.api` resolves to the narrowest possible call surface, and
  // organization-plugin endpoints are not visible without an explicit
  // cast. We cast the `api` object once at the call site rather than
  // augmenting the public `auth` type; the runtime shape is the
  // canonical Better Auth 1.7.7 `getFullOrganization` response, which
  // is verified against the lockfile.
  type AuthApi = {
    getFullOrganization: (args: {
      headers: Headers
      query: { organizationSlug: string }
    }) => Promise<{
      id: string
      slug: string
      members: Array<{ userId: string; role: string }>
    } | null>
  }
  const api = auth.api as unknown as AuthApi

  let full: {
    id: string
    slug: string
    members: Array<{ userId: string; role: string }>
  } | null = null
  try {
    full = await api.getFullOrganization({
      headers: await headers(),
      query: { organizationSlug: slug },
    })
  } catch (error) {
    if (error instanceof APIError) {
      const code = (error.body as { code?: string } | undefined)?.code
      if (code === ORG_ERROR_NOT_FOUND) redirect("/no-organization")
      if (code === ORG_ERROR_NOT_A_MEMBER) redirect(`/${slug}/forbidden`)
    }
    throw error
  }

  if (!full) redirect("/no-organization")

  const membership = full.members.find((m) => m.userId === session.userId)
  if (!membership) {
    // Defensive: the handler should have thrown USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION
    // before this branch is reached. If we land here, the membership
    // table is out of sync with the session.
    redirect(`/${slug}/forbidden`)
  }

  if (!isOrgRole(membership.role)) {
    console.error(
      "[organization-auth] unknown role",
      JSON.stringify({ role: membership.role, organizationId: full.id, userId: session.userId }),
    )
    redirect(`/${slug}/forbidden`)
  }

  if (ROLE_RANK[membership.role] < ACTION_MIN_RANK[action]) {
    redirect(`/${slug}/forbidden`)
  }

  return { userId: session.userId, organizationId: full.id, slug: full.slug, role: membership.role }
}

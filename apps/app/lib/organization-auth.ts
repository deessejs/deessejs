import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { auth, type AuthSession } from "@workspace/auth"
import { db } from "@workspace/database"
import { member, organization } from "@workspace/database/schema"

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

  const { userId } = await requireAccountSession()

  const rows = await db
    .select({
      organizationId: organization.id,
      slug: organization.slug,
      role: member.role,
    })
    .from(organization)
    .innerJoin(
      member,
      and(eq(member.organizationId, organization.id), eq(member.userId, userId)),
    )
    .where(eq(organization.slug, slug))
    .limit(1)

  const row = rows[0]
  if (!row) {
    const orgRow = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.slug, slug))
      .limit(1)
    if (!orgRow[0]) redirect("/no-organization")
    redirect(`/${slug}/forbidden`)
  }

  if (!isOrgRole(row.role)) {
    console.error(
      "[organization-auth] unknown role",
      JSON.stringify({ role: row.role, organizationId: row.organizationId, userId }),
    )
    redirect(`/${slug}/forbidden`)
  }

  if (ROLE_RANK[row.role] < ACTION_MIN_RANK[action]) {
    redirect(`/${slug}/forbidden`)
  }

  return { userId, organizationId: row.organizationId, slug: row.slug, role: row.role }
}

import { and, eq } from "drizzle-orm"
import { db } from "@workspace/database"
import { member, organization } from "@workspace/database/schema"

/** The organization, as the caller sees it. */
export type OrganizationForMember = {
  id: string
  slug: string
  name: string
  /** The caller's role in it. A comma-separated string, as Better Auth stores it. */
  role: string
}

const selection = {
  id: organization.id,
  slug: organization.slug,
  name: organization.name,
  role: member.role,
}

/**
 * Finds the organization the caller is a member of, by slug.
 *
 * Returns null when the slug does not exist and when the caller is not
 * a member of it. The two are deliberately indistinguishable: a caller
 * who cannot see an organization must not be able to learn whether it
 * exists.
 *
 * This is a direct read of the membership row rather than a call to
 * Better Auth's `/organization/get-full-organization`. That endpoint
 * clears the session's active organization when the caller is not a
 * member of the organization being named, so using it as a check for an
 * arbitrary slug would take away a selection the caller still has
 * every right to.
 *
 * The predicate is the plugin's own (`adapter.mjs`, `checkMembership`):
 * a `member` row exists for this user and this organization. There is
 * no second notion of membership to diverge from.
 */
export async function findOrganizationForMember(
  userId: string,
  slug: string,
): Promise<OrganizationForMember | null> {
  const rows = await db
    .select(selection)
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(and(eq(member.userId, userId), eq(organization.slug, slug)))
    .limit(1)

  return rows[0] ?? null
}

/** The same, for an organization the session already points at. */
export async function findOrganizationForMemberById(
  userId: string,
  organizationId: string,
): Promise<OrganizationForMember | null> {
  const rows = await db
    .select(selection)
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(
      and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId),
      ),
    )
    .limit(1)

  return rows[0] ?? null
}

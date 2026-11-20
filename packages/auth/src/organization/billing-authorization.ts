import { and, eq } from "drizzle-orm"

import { db, member } from "@workspace/database"
import { hasManagingRole } from "./roles.js"

export type StripeBillingAction =
  | "upgrade-subscription"
  | "list-subscription"
  | "cancel-subscription"
  | "restore-subscription"
  | "billing-portal"

const MUTATING_BILLING_ACTIONS = new Set([
  "upgrade-subscription",
  "cancel-subscription",
  "restore-subscription",
  "billing-portal",
])

/** Raw billing records and mutations are restricted to owners and admins. */
export function canAccessOrganizationBilling(
  role: string,
  action: string
): boolean {
  if (action !== "list-subscription" && !MUTATING_BILLING_ACTIONS.has(action))
    return false

  return hasManagingRole(role)
}

/** Resolves membership using both identities passed by Better Auth. */
export async function authorizeOrganizationBilling(
  userId: string,
  referenceId: string,
  action: StripeBillingAction
): Promise<boolean> {
  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, referenceId))
    )
    .limit(1)

  return membership
    ? canAccessOrganizationBilling(membership.role, action)
    : false
}

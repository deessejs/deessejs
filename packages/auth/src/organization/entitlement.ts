import { and, eq } from "drizzle-orm"
import { db } from "@workspace/database"
import { member, subscription } from "@workspace/database/schema"

export type OrganizationSubscriptionState = {
  plan: string
  status: string
  billingInterval: string | null
  endedAt: Date | null
  cancelAtPeriodEnd: boolean | null
  periodEnd: Date | null
}

/** Only persisted, recognized Pro states grant access. Unknown values fail closed. */
export function subscriptionGrantsPro(
  value: OrganizationSubscriptionState,
  now = new Date()
): boolean {
  if (
    value.plan !== "pro" ||
    value.billingInterval !== "month" ||
    value.endedAt !== null
  ) {
    return false
  }
  if (value.status !== "active" && value.status !== "trialing") return false
  if (value.cancelAtPeriodEnd && (!value.periodEnd || value.periodEnd <= now)) {
    return false
  }
  return true
}

/** Re-check current membership and persisted subscription state on every call. */
export async function hasOrganizationProEntitlement(
  userId: string,
  organizationId: string,
  now = new Date()
): Promise<boolean> {
  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId))
    )
    .limit(1)
  if (!membership) return false

  const rows = await db
    .select({
      plan: subscription.plan,
      status: subscription.status,
      billingInterval: subscription.billingInterval,
      endedAt: subscription.endedAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      periodEnd: subscription.periodEnd,
    })
    .from(subscription)
    .where(eq(subscription.referenceId, organizationId))

  return rows.some((row) => subscriptionGrantsPro(row, now))
}

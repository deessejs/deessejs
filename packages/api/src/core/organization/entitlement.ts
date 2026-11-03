import { and, eq, gt, or } from "drizzle-orm"
import { db } from "@workspace/database"
import { member, organizationSubscription } from "@workspace/database/schema"

export function isProSubscriptionEntitled(
  status: string,
  cancelAtPeriodEnd: boolean,
  currentPeriodEnd: Date | null,
  now = new Date(),
): boolean {
  if (status !== "active" && status !== "trialing") return false
  return !cancelAtPeriodEnd || (currentPeriodEnd !== null && currentPeriodEnd > now)
}

/** Resolve Pro from persisted organization subscription state for a current member. */
export async function hasOrganizationProEntitlement(userId: string, organizationId: string): Promise<boolean> {
  const [row] = await db.select({ id: organizationSubscription.id })
    .from(organizationSubscription)
    .innerJoin(member, eq(member.organizationId, organizationSubscription.organizationId))
    .where(and(
      eq(member.userId, userId),
      eq(organizationSubscription.organizationId, organizationId),
      or(eq(organizationSubscription.status, "active"), eq(organizationSubscription.status, "trialing")),
      or(eq(organizationSubscription.cancelAtPeriodEnd, false), gt(organizationSubscription.currentPeriodEnd, new Date())),
    )).limit(1)
  return Boolean(row)
}

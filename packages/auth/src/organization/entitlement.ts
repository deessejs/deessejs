import { and, asc, eq } from "drizzle-orm"
import { db } from "@workspace/database"
import {
  member,
  organizationProSeat,
  subscription,
} from "@workspace/database/schema"

export type OrganizationSubscriptionState = {
  plan: string
  status: string
  billingInterval: string | null
  endedAt: Date | null
  cancelAtPeriodEnd: boolean | null
  periodEnd: Date | null
  seats?: number | null
}

/** Only persisted, recognized Pro states grant access. Unknown values fail closed. */
export function subscriptionGrantsPro(
  value: OrganizationSubscriptionState,
  now = new Date()
): boolean {
  if (value.plan !== "pro") return false
  if (value.billingInterval !== "month") return false
  if ((value.seats ?? 0) < 1) return false
  if (value.endedAt !== null) return false
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
      seats: subscription.seats,
    })
    .from(subscription)
    .where(eq(subscription.referenceId, organizationId))

  const active = rows.find((row) => subscriptionGrantsPro(row, now))
  if (!active) return false

  const assigned = await db
    .select({ memberId: organizationProSeat.memberId })
    .from(organizationProSeat)
    .where(eq(organizationProSeat.organizationId, organizationId))
    .orderBy(asc(organizationProSeat.createdAt), asc(organizationProSeat.id))
  const seatIndex = assigned.findIndex(
    (seat) => seat.memberId === membership.id
  )
  return seatIndex >= 0 && seatIndex < (active.seats ?? 0)
}

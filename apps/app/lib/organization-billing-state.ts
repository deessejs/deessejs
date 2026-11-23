export type OrganizationBillingState =
  | "loading"
  | "unavailable"
  | "empty"
  | "subscribed"

export function organizationBillingState(input: {
  isPending: boolean
  isError: boolean
  subscriptionCount: number
}): OrganizationBillingState {
  if (input.isPending) return "loading"
  if (input.isError) return "unavailable"
  return input.subscriptionCount === 0 ? "empty" : "subscribed"
}

type OrganizationProSubscription = {
  plan: string
  status: string
  billingInterval?: string | null | undefined
  seats?: number | null | undefined
  endedAt?: Date | string | null | undefined
  cancelAtPeriodEnd?: boolean | null | undefined
  periodEnd?: Date | string | null | undefined
}

export function organizationProSeatCapacity(
  subscriptions: OrganizationProSubscription[],
  now = new Date()
): number {
  const qualifyingSubscription = subscriptions.find((subscription) => {
    if (subscription.plan !== "pro") return false
    if (subscription.billingInterval !== "month") return false
    if ((subscription.seats ?? 0) < 1) return false
    if (subscription.endedAt != null) return false
    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return false
    }

    if (!subscription.cancelAtPeriodEnd) return true
    if (!subscription.periodEnd) return false

    const periodEnd =
      subscription.periodEnd instanceof Date
        ? subscription.periodEnd
        : new Date(subscription.periodEnd)
    return (
      !Number.isNaN(periodEnd.getTime()) && periodEnd.getTime() > now.getTime()
    )
  })

  return qualifyingSubscription?.seats ?? 0
}

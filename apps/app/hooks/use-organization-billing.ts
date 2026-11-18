"use client"

import { client } from "@/lib/client"
import { hasManagingRole } from "@workspace/auth/organization/roles"
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

export type BillingPlan = "pro-monthly" | "pro-annual"
export type BillingSubscription = {
  id: string
  stripeSubscriptionId?: string
  plan: string
  status: string
  cancelAtPeriodEnd?: boolean | null
  periodEnd?: Date | string | null
}

const activeStatuses = new Set(["active", "trialing"])
const subscriptionKey = (organizationId: string) =>
  ["organization-billing", organizationId] as const

export function organizationSubscriptionQueryOptions(organizationId: string) {
  return queryOptions({
    queryKey: subscriptionKey(organizationId),
    queryFn: async () => {
      const { data, error } = await client.auth.subscription.list({
        query: { referenceId: organizationId, customerType: "organization" },
      })
      if (error) throw new Error(error.message ?? "Could not load subscription")
      return (data ?? []) as BillingSubscription[]
    },
  })
}

export function useOrganizationBilling(organizationId: string) {
  return useQuery(organizationSubscriptionQueryOptions(organizationId))
}

export function useOrganizationBillingMutations(organizationId: string) {
  const queryClient = useQueryClient()
  const queryKey = organizationSubscriptionQueryOptions(organizationId).queryKey
  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const checkout = useMutation({
    mutationFn: async ({ plan, subscriptionId }: { plan: BillingPlan; subscriptionId?: string }) => {
      const { data, error } = await client.auth.subscription.upgrade({
        plan,
        referenceId: organizationId,
        customerType: "organization",
        subscriptionId,
        successUrl: window.location.href,
        cancelUrl: window.location.href,
        returnUrl: window.location.href,
        disableRedirect: true,
      })
      if (error) throw new Error(error.message ?? "Checkout is unavailable")
      if (!data?.url) throw new Error("Checkout URL was not returned")
      window.location.assign(data.url)
    },
    onSuccess: invalidate,
  })

  const portal = useMutation({
    mutationFn: async () => {
      const { data, error } = await client.auth.subscription.billingPortal({
        referenceId: organizationId,
        customerType: "organization",
        returnUrl: window.location.href,
        disableRedirect: true,
      })
      if (error) throw new Error(error.message ?? "Billing portal is unavailable")
      if (!data?.url) throw new Error("Billing portal URL was not returned")
      window.location.assign(data.url)
    },
    onSuccess: invalidate,
  })

  return { checkout, portal }
}


export function canManageBilling(role: string) {
  return hasManagingRole(role)
}

export function selectCurrentSubscription(subscriptions: BillingSubscription[]) {
  return [...subscriptions]
    .filter((subscription) => activeStatuses.has(subscription.status))
    .sort((a, b) => a.id.localeCompare(b.id))[0]
}

import { client } from "@/lib/client"
import { queryOptions, useQuery } from "@tanstack/react-query"

type OrganizationBillingInput = {
  organizationId: string
  organizationSlug: string
  canManage: boolean
}

export const organizationSubscriptionsQueryKey = (organizationId: string) =>
  ["organization", organizationId, "billing", "subscriptions"] as const

export function organizationSubscriptionsQueryOptions(
  input: OrganizationBillingInput
) {
  return queryOptions({
    queryKey: [
      ...organizationSubscriptionsQueryKey(input.organizationId),
      input.canManage ? "details" : "entitlement",
    ] as const,
    queryFn: async () => {
      if (!input.canManage) {
        const { data, error } = await client.rpc.organization.proEntitlement({
          slug: input.organizationSlug,
        })
        if (error || !data)
          throw new Error(error?.message ?? "Could not load Pro status")
        return { kind: "entitlement" as const, proIncluded: data.proIncluded }
      }

      const { data, error } = await client.auth.subscription.list({
        query: {
          referenceId: input.organizationId,
          customerType: "organization",
        },
      })
      if (error)
        throw new Error(error.message ?? "Could not load billing details")
      return { kind: "billing" as const, subscriptions: data ?? [] }
    },
    retry: false,
    refetchOnMount: "always",
  })
}

export function useOrganizationSubscriptions(input: OrganizationBillingInput) {
  return useQuery(organizationSubscriptionsQueryOptions(input))
}

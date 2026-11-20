import { client } from "@/lib/client"
import { queryOptions, useQuery } from "@tanstack/react-query"

export const organizationSubscriptionsQueryKey = (organizationId: string) =>
  ["organization", organizationId, "billing", "subscriptions"] as const

export function organizationSubscriptionsQueryOptions(organizationId: string) {
  return queryOptions({
    queryKey: organizationSubscriptionsQueryKey(organizationId),
    queryFn: async () => {
      const { data, error } = await client.auth.subscription.list({
        query: {
          referenceId: organizationId,
          customerType: "organization",
        },
      })
      if (error) {
        throw new Error(error.message ?? "Could not load billing details")
      }
      return data ?? []
    },
    retry: false,
    refetchOnMount: "always",
  })
}

export function useOrganizationSubscriptions(organizationId: string) {
  return useQuery(organizationSubscriptionsQueryOptions(organizationId))
}

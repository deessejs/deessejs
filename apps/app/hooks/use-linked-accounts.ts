"use client"

import { client } from "@/lib/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

const linkedAccountQueryKeys = {
  all: ["settings", "linked-accounts"] as const,
  list: (userId: string | undefined) =>
    [...linkedAccountQueryKeys.all, userId] as const,
}

function linkedAccountQueryOptions(userId: string | undefined) {
  return queryOptions({
    queryKey: linkedAccountQueryKeys.list(userId),
    enabled: userId !== undefined,
    queryFn: async () => {
      const { data, error } = await client.auth.listAccounts()
      if (error) {
        throw new Error(error.message ?? "Failed to load linked accounts")
      }
      if (!data) {
        throw new Error("Linked account response did not include data")
      }

      return data.map(({ id, providerId, accountId }) => ({
        id,
        providerId,
        accountId,
      }))
    },
  })
}

export function useLinkedAccounts(userId: string | undefined) {
  return useQuery(linkedAccountQueryOptions(userId))
}

export function useUnlinkAccount(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await client.auth.unlinkAccount({ accountId })
      if (error) {
        throw new Error(error.message ?? "Failed to unlink account")
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: linkedAccountQueryOptions(userId).queryKey,
      }),
  })
}

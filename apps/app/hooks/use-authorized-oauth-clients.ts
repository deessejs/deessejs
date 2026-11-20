"use client"

import { client } from "@/lib/client"
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

type OAuthConsentView = {
  id: string
  clientId: string
  resources?: string[]
  scopes: string[]
  createdAt: Date | string
  updatedAt: Date | string
}

type OAuthClientView = {
  client_name?: string
  client_uri?: string
}

export type AuthorizedOAuthClient = {
  consent: OAuthConsentView
  client: OAuthClientView | null
}

const authorizedOAuthClientQueryKey = (userId: string | undefined) =>
  ["settings", "authorized-oauth-clients", userId] as const

function authorizedOAuthClientsQueryOptions(userId: string | undefined) {
  return queryOptions({
    queryKey: authorizedOAuthClientQueryKey(userId),
    enabled: userId !== undefined,
    queryFn: async (): Promise<AuthorizedOAuthClient[]> => {
      const { data, error } = await client.auth.oauth2.getConsents()
      if (error || !data) {
        throw new Error(error?.message ?? "Could not load connected apps.")
      }

      return Promise.all(
        (data as OAuthConsentView[]).map(async (consent) => {
          try {
            const { data: clientData } = await client.auth.oauth2.publicClient({
              query: { client_id: consent.clientId },
            })
            return { consent, client: clientData ?? null }
          } catch {
            return { consent, client: null }
          }
        })
      )
    },
  })
}

export function useAuthorizedOAuthClients() {
  const { data: session, isPending: isSessionPending } =
    client.auth.useSession()
  const query = useQuery(authorizedOAuthClientsQueryOptions(session?.user.id))
  return { query, isSessionPending }
}

export function useRevokeOAuthConsent() {
  const queryClient = useQueryClient()
  const { data: session } = client.auth.useSession()

  return useMutation({
    mutationFn: async (consentId: string) => {
      const { error } = await client.auth.oauth2.deleteConsent({
        id: consentId,
      })
      if (error) {
        throw new Error(error.message ?? "Could not revoke access")
      }
    },
    onSuccess: async () => {
      toast.success("App access revoked")
      await queryClient.invalidateQueries({
        queryKey: authorizedOAuthClientQueryKey(session?.user.id),
      })
    },
    onError: (error) => toast.error(error.message ?? "Could not revoke access"),
  })
}

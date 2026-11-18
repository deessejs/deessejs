"use client"

import { client } from "@/lib/client"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const accountInvitationsQueryOptions = queryOptions({
  queryKey: ["account-invitations"] as const,
  queryFn: () => client.rpc.organization.accountInvitations(),
})

export function invitationDetailsQueryOptions(invitationId: string, userId: string | undefined) {
  return queryOptions({
    queryKey: ["organization-invitation", invitationId, userId] as const,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await client.auth.organization.getInvitation({
        query: { id: invitationId },
      })
      if (error || !data) {
        throw new Error(error?.message ?? "This invitation is unavailable.")
      }
      return data
    },
  })
}

export type InvitationDetails = NonNullable<
  Awaited<ReturnType<typeof client.auth.organization.getInvitation>>["data"]
>

export function useInvitationDetails(invitationId: string, userId: string | undefined) {
  return useQuery(invitationDetailsQueryOptions(invitationId, userId))
}

export function useAccountInvitations() {
  return useQuery(accountInvitationsQueryOptions)
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invitationId, action }: { invitationId: string; action: "accept" | "decline" }) => {
      const result = action === "accept"
        ? await client.auth.organization.acceptInvitation({ invitationId })
        : await client.auth.organization.rejectInvitation({ invitationId })
      if (result.error) throw new Error(result.error.message ?? `The invitation could not be ${action === "accept" ? "accepted" : "declined"}.`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountInvitationsQueryOptions.queryKey }),
  })
}

export function useSendVerificationEmail() {
  return useMutation({
    mutationFn: async ({ email, callbackURL }: { email: string; callbackURL: string }) => {
      const { error } = await client.auth.sendVerificationEmail({ email, callbackURL })
      if (error) throw new Error(error.message ?? "The verification email could not be sent.")
    },
    // Sending mail does not change any TanStack Query data. Verification state
    // is read from Better Auth's reactive session hook after the user returns.
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await client.auth.signOut()
      if (error) throw new Error(error.message ?? "Could not sign out of this account.")
    },
    // Remove user-scoped cached data at the auth boundary so a later sign-in
    // cannot render data from the previous account. Better Auth owns session state.
    onSuccess: () => queryClient.clear(),
  })
}

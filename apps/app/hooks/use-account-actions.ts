"use client"

import { client } from "@/lib/client"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const accountInvitationsQueryOptions = queryOptions({
  queryKey: ["account-invitations"] as const,
  queryFn: () => client.rpc.organization.accountInvitations(),
})

export function useAccountInvitations() {
  return useQuery(accountInvitationsQueryOptions)
}

export function useSetActiveOrganization() {
  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await client.auth.organization.setActive({ organizationId })
      if (error) throw new Error(error.message ?? "The organization could not be selected.")
    },
  })
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
  })
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await client.auth.signOut()
      if (error) throw new Error(error.message ?? "Could not sign out of this account.")
    },
  })
}

export function useCreateOrganization() {
  return useMutation({ mutationFn: (name: string) => client.rpc.organization.create({ name }) })
}

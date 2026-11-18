"use client"

import { client } from "@/lib/client"
import { sessionsQueryOptions } from "@/hooks/use-sessions"
import { organizationProjectsQueryOptions } from "@/lib/github-projects-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useSendEmailChangeVerification() {
  return useMutation({
    mutationFn: async ({ email, callbackURL }: { email: string; callbackURL: string }) => {
      const { error } = await client.auth.sendVerificationEmail({ email, callbackURL })
      if (error) throw new Error(error.message ?? "Failed to send verification email")
    },
  })
}

export function useChangePassword(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const { error } = await client.auth.changePassword({ currentPassword, newPassword })
      if (error) throw new Error(error.message ?? "Failed to update password")
    },
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: sessionsQueryOptions(userId).queryKey,
    }),
  })
}

export function useUpdateProfileName() {
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await client.auth.updateUser({ name })
      if (error) throw new Error(error.message ?? "Failed to update profile")
    },
    // Profile identity is read from Better Auth's reactive useSession hook.
  })
}

export function useUpdateOrganizationProfile() {
  return useMutation({
    mutationFn: async ({ organizationId, name, logo }: {
      organizationId: string
      name: string
      logo: string | null
    }) => {
      const { error } = await client.auth.organization.update({
        organizationId,
        data: { name, logo },
      })
      if (error) throw new Error(error.message ?? "Could not update organization")
    },
    // The organization profile is supplied by the server route. Its owner calls
    // router.refresh() after this mutation; no TanStack Query cache owns it.
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (callbackURL: string) => {
      const { error } = await client.auth.deleteUser({ callbackURL })
      if (error) throw new Error(error.message ?? "Failed to delete account")
    },
    // Deletion ends the current identity, so remove all cached account-scoped
    // data. Better Auth owns session state and the callback navigates away.
    onSuccess: () => queryClient.clear(),
  })
}

export function useDisconnectGitHubApp(slug: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => client.rpc.githubApp.disconnect({ slug }),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: organizationProjectsQueryOptions(slug).queryKey,
    }),
  })
}

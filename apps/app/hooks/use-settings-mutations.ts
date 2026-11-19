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
  const githubAppRoot = organizationProjectsQueryOptions(slug).queryKey[0]
  return useMutation({
    mutationFn: () => client.rpc.githubApp.disconnect({ slug }),
    onSuccess: () => queryClient.invalidateQueries({
      predicate: ({ queryKey }) => {
        if (queryKey[0] !== githubAppRoot || queryKey[2] !== slug) return false
        return queryKey[1] === "projects"
          || queryKey[1] === "repositories"
          || queryKey[1] === "project-config"
      },
    }),
  })
}

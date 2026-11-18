"use client"

import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"

export function useSendEmailChangeVerification() {
  return useMutation({
    mutationFn: async ({ email, callbackURL }: { email: string; callbackURL: string }) => {
      const { error } = await client.auth.sendVerificationEmail({ email, callbackURL })
      if (error) throw new Error(error.message ?? "Failed to send verification email")
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const { error } = await client.auth.changePassword({ currentPassword, newPassword })
      if (error) throw new Error(error.message ?? "Failed to update password")
    },
  })
}

export function useUpdateProfileName() {
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await client.auth.updateUser({ name })
      if (error) throw new Error(error.message ?? "Failed to update profile")
    },
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (callbackURL: string) => {
      const { error } = await client.auth.deleteUser({ callbackURL })
      if (error) throw new Error(error.message ?? "Failed to delete account")
    },
  })
}

export function useDisconnectGitHubApp(slug: string) {
  return useMutation({ mutationFn: () => client.rpc.githubApp.disconnect({ slug }) })
}

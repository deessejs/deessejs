"use client"

import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"

// These mutations update Better Auth-owned session state or return a generic
// response, and they navigate the browser after completion. None has a
// TanStack Query cache owner to invalidate.
export function useEmailLogin() {
  return useMutation({ mutationFn: async (input: { email: string; password: string }) => {
    const { error } = await client.auth.signIn.email(input)
    if (error) throw new Error(error.message ?? "Invalid credentials")
  } })
}

export function useEmailSignup() {
  return useMutation({ mutationFn: async ({ callbackURL, ...input }: { email: string; password: string; name: string; callbackURL: string }) => {
    const { error } = await client.auth.signUp.email({ ...input, callbackURL })
    if (error) throw new Error(error.message ?? "Could not create account")
  } })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: async (email: string) => {
    // Better Auth intentionally returns a generic response here. Treat both
    // returned errors and network failures as the same request outcome so the
    // UI cannot reveal whether an address is registered.
    try {
      await client.auth.requestPasswordReset({ email, redirectTo: "/reset-password" })
    } catch {
      return
    }
  } })
}

export function useResetPassword(token: string) {
  return useMutation({ mutationFn: async (newPassword: string) => {
    const { error } = await client.auth.resetPassword({ newPassword }, { query: { token } })
    if (error) throw new Error(error.message ?? "Could not reset password")
  } })
}

export function useOAuthSignIn() {
  return useMutation({
    mutationFn: async ({ provider, callbackURL }: { provider: "google" | "github"; callbackURL: string }) => {
      const { error } = await client.auth.signIn.social({ provider, callbackURL })
      if (error) throw new Error(error.message ?? "Authentication failed")
    },
    // Better Auth owns the session and navigates the browser to the provider.
  })
}

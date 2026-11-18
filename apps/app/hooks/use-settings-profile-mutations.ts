"use client"

import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"

// Profile name is rendered from Better Auth's reactive useSession state.
export function useUpdateProfileName() {
  return useMutation({
    mutationFn: async (name: string) => {
      const { error } = await client.auth.updateUser({ name })
      if (error) throw new Error(error.message ?? "Failed to update profile")
    },
  })
}

// Organization profile data is server-rendered. The caller refreshes its route
// after saving, and no TanStack Query cache owns this data.
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
  })
}

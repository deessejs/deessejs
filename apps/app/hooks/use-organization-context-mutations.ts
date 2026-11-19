"use client"

import { client } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"

// Better Auth's reactive organization hooks own the organization list and
// active-organization session state. The create dialog refetches that list and
// navigates after success; no TanStack Query cache owns either value.
export function useSetActiveOrganization() {
  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await client.auth.organization.setActive({ organizationId })
      if (error) throw new Error(error.message ?? "The organization could not be selected.")
    },
  })
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: (name: string) => client.rpc.organization.create({ name }),
  })
}

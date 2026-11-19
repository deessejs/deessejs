"use client"

import { client } from "@/lib/client"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export type PendingInvitation = Awaited<ReturnType<typeof client.rpc.organization.pendingInvitations>>[number]

export function memberManagementQueryOptions(organizationId: string, slug: string, canManage: boolean) {
  return queryOptions({
    queryKey: ["organization-members", organizationId, slug, canManage, 100, 0] as const,
    queryFn: async () => {
      const [memberResult, invitations] = await Promise.all([
        client.auth.organization.listMembers({ query: { organizationId, limit: 100, offset: 0 } }),
        canManage ? client.rpc.organization.pendingInvitations({ slug }) : Promise.resolve([]),
      ])
      if (memberResult.error) throw new Error(memberResult.error.message ?? "Could not load members.")
      return { members: memberResult.data?.members ?? [], invitations }
    },
  })
}

export function useMemberManagement(organizationId: string, slug: string, canManage: boolean) {
  const queryClient = useQueryClient()
  const options = memberManagementQueryOptions(organizationId, slug, canManage)
  const query = useQuery(options)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: options.queryKey })
  const invite = useMutation({
    mutationFn: async ({ email, resend = false }: { email: string; resend?: boolean }) => {
      const { error } = await client.auth.organization.inviteMember({ email, role: "member", organizationId, ...(resend ? { resend: true } : {}) })
      if (error) throw new Error(error.message ?? (resend ? "The invitation could not be resent." : "The invitation could not be sent."))
    },
    onSuccess: invalidate,
  })
  const cancel = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await client.auth.organization.cancelInvitation({ invitationId })
      if (error) throw new Error(error.message ?? "The invitation could not be canceled.")
    },
    onSuccess: invalidate,
  })
  return { query, invite, cancel }
}

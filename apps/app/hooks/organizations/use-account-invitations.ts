import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"

import { client } from "@/lib/client"
import { workspaceHomePath } from "@/lib/workspace-paths"

const accountInvitationsQuery = queryOptions({
  queryKey: ["account-invitations"],
  queryFn: () => client.rpc.organization.accountInvitations(),
})

export type AccountInvitation = Awaited<
  ReturnType<typeof client.rpc.organization.accountInvitations>
>[number]

export type InvitationAction = "accept" | "decline"

export function useAccountInvitations(isEmailVerified: boolean) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const query = useQuery({
    ...accountInvitationsQuery,
    enabled: isEmailVerified,
  })
  const activeActionRef = useRef<{
    invitationId: string
    action: InvitationAction
  } | null>(null)
  const [activeAction, setActiveAction] = useState<{
    invitationId: string
    action: InvitationAction
  } | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function respond(
    invitationId: string,
    action: InvitationAction,
    organizationSlug: string
  ) {
    if (activeActionRef.current) return
    const pending = { invitationId, action }
    activeActionRef.current = pending
    setActiveAction(pending)
    setError(null)
    setStatus(null)

    try {
      const result =
        action === "accept"
          ? await client.auth.organization.acceptInvitation({ invitationId })
          : await client.auth.organization.rejectInvitation({ invitationId })

      if (result.error) {
        setError(
          result.error.message ||
            `The invitation could not be ${action === "accept" ? "accepted" : "declined"}.`
        )
        return
      }

      setStatus(`Invitation ${action === "accept" ? "accepted" : "declined"}.`)
      await queryClient.invalidateQueries({
        queryKey: accountInvitationsQuery.queryKey,
      })
      if (action === "accept") router.push(workspaceHomePath(organizationSlug))
    } catch (cause) {
      const fallback = `The invitation could not be ${action === "accept" ? "accepted" : "declined"}. It may have expired or already been processed.`
      setError(
        cause instanceof Error && cause.message ? cause.message : fallback
      )
      await queryClient.invalidateQueries({
        queryKey: accountInvitationsQuery.queryKey,
      })
    } finally {
      activeActionRef.current = null
      setActiveAction(null)
    }
  }

  return {
    query,
    activeAction,
    status,
    error,
    respond,
  }
}

"use client"

import { client } from "@/lib/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"

import { workspaceHomePath } from "@/lib/workspace-paths"

const invitationsQuery = queryOptions({
  queryKey: ["account-invitations"],
  // The account-owned API procedure verifies the recipient and enriches
  // the results for the inbox. Keep this call on the typed oRPC client.
  queryFn: () => client.rpc.organization.accountInvitations(),
})

export function useAccountInvitations() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const session = client.auth.useSession()
  const query = useQuery(invitationsQuery)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [processed, setProcessed] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  async function respond(
    invitationId: string,
    action: "accept" | "decline",
    slug: string
  ) {
    setBusyId(invitationId)
    setFailure(null)
    setProcessed(null)
    try {
      const result =
        action === "accept"
          ? await client.auth.organization.acceptInvitation({ invitationId })
          : await client.auth.organization.rejectInvitation({ invitationId })
      if (result.error) {
        setFailure(
          result.error.message ??
            `The invitation could not be ${action === "accept" ? "accepted" : "declined"}.`
        )
        return
      }
      setProcessed(
        `Invitation ${action === "accept" ? "accepted" : "declined"}.`
      )
      await queryClient.invalidateQueries({
        queryKey: invitationsQuery.queryKey,
      })
      if (action === "accept") router.push(workspaceHomePath(slug))
    } catch {
      setFailure(
        `The invitation could not be ${action === "accept" ? "accepted" : "declined"}. It may have expired or already been processed.`
      )
      await queryClient.invalidateQueries({
        queryKey: invitationsQuery.queryKey,
      })
    } finally {
      setBusyId(null)
    }
  }

  return {
    session,
    query,
    busyId,
    processed,
    failure,
    respond,
  }
}

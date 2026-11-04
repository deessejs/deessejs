"use client"

import { client } from "@/lib/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"

import { workspaceHomePath } from "@/lib/workspace-paths"

const invitationsQuery = queryOptions({
  queryKey: ["account-invitations"],
  queryFn: () => client.rpc.organization.accountInvitations(),
})

export function AccountInvitations() {
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

  if (!session.data?.user.emailVerified) {
    return (
      <p className="text-sm text-muted-foreground">
        Verify your email address to view invitations sent to your account.
      </p>
    )
  }
  if (query.isPending)
    return <p className="text-sm text-muted-foreground">Loading invitations…</p>
  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-3" role="alert">
        <p className="text-sm text-destructive">
          Invitations could not be loaded. Please try again.
        </p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <section
      className="flex flex-col gap-4"
      aria-label="Incoming organization invitations"
    >
      {failure && (
        <p className="text-sm text-destructive" role="alert">
          {failure}
        </p>
      )}
      {processed && (
        <p className="text-sm text-muted-foreground" role="status">
          {processed}
        </p>
      )}
      {query.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You have no pending organization invitations.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {query.data.map((invitation) => {
            const expired = invitation.expired
            return (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{invitation.organizationName}</p>
                  <p className="text-sm text-muted-foreground">
                    Invited by {invitation.inviterName} as{" "}
                    {invitation.role ?? "member"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString(
                      "en-US",
                      { timeZone: "UTC" }
                    )}
                  </p>
                  {expired && (
                    <p className="text-sm text-destructive">
                      This invitation has expired.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={expired || busyId !== null}
                    onClick={() =>
                      void respond(
                        invitation.id,
                        "accept",
                        invitation.organizationSlug
                      )
                    }
                  >
                    {busyId === invitation.id ? "Working…" : "Accept"}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={expired || busyId !== null}
                    onClick={() =>
                      void respond(
                        invitation.id,
                        "decline",
                        invitation.organizationSlug
                      )
                    }
                  >
                    Decline
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

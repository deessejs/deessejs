"use client"

import { Button } from "@workspace/ui/components/button"

import { useAccountInvitations } from "@/hooks/organizations/use-account-invitations"

import { AccountInvitationList } from "./account-invitation-list"

function AccountInvitations() {
  const { session, query, activeAction, status, error, respond } =
    useAccountInvitations()

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
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      )}
      {query.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You have no pending organization invitations.
        </p>
      ) : (
        <AccountInvitationList
          invitations={query.data}
          activeAction={activeAction}
          onRespond={respond}
        />
      )}
    </section>
  )
}

export { AccountInvitations }

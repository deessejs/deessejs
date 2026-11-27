import { AsyncButton } from "@workspace/ui/components/async-button"

import type {
  AccountInvitation,
  InvitationAction,
} from "@/hooks/organizations/use-account-invitations"

type ActiveAction = { invitationId: string; action: InvitationAction } | null

type AccountInvitationRowProps = {
  invitation: AccountInvitation
  activeAction: ActiveAction
  onRespond: (
    invitationId: string,
    action: InvitationAction,
    organizationSlug: string
  ) => Promise<void>
}

function AccountInvitationRow({
  invitation,
  activeAction,
  onRespond,
}: AccountInvitationRowProps) {
  const expired = invitation.expired
  const busy = activeAction?.invitationId === invitation.id

  return (
    <li className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="font-medium">{invitation.organizationName}</p>
        <p className="text-sm text-muted-foreground">
          Invited by {invitation.inviterName} as {invitation.role ?? "member"}
        </p>
        <p className="text-sm text-muted-foreground">
          Expires{" "}
          {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
            timeZone: "UTC",
          })}
        </p>
        {expired && (
          <p className="text-sm text-destructive" role="status">
            This invitation has expired.
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <AsyncButton
          disabled={expired || activeAction !== null}
          pendingAnnouncement="Accepting invitation"
          onClick={() =>
            onRespond(invitation.id, "accept", invitation.organizationSlug)
          }
        >
          {busy && activeAction.action === "accept" ? "Accepting…" : "Accept"}
        </AsyncButton>
        <AsyncButton
          variant="outline"
          disabled={expired || activeAction !== null}
          pendingAnnouncement="Declining invitation"
          onClick={() =>
            onRespond(invitation.id, "decline", invitation.organizationSlug)
          }
        >
          {busy && activeAction.action === "decline" ? "Declining…" : "Decline"}
        </AsyncButton>
      </div>
    </li>
  )
}

export { AccountInvitationRow }

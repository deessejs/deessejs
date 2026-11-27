import type {
  AccountInvitation,
  InvitationAction,
} from "@/hooks/organizations/use-account-invitations"

import { AccountInvitationRow } from "./account-invitation-row"

type ActiveAction = { invitationId: string; action: InvitationAction } | null

type AccountInvitationListProps = {
  invitations: AccountInvitation[]
  activeAction: ActiveAction
  onRespond: (
    invitationId: string,
    action: InvitationAction,
    organizationSlug: string
  ) => Promise<void>
}

function AccountInvitationList({
  invitations,
  activeAction,
  onRespond,
}: AccountInvitationListProps) {
  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {invitations.map((invitation) => (
        <AccountInvitationRow
          key={invitation.id}
          invitation={invitation}
          activeAction={activeAction}
          onRespond={onRespond}
        />
      ))}
    </ul>
  )
}

export { AccountInvitationList }

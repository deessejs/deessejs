import { AccountInvitations } from "@/components/organizations/account-invitations"
import { SettingsPage } from "@/components/settings"

export default function InvitationsPage() {
  return (
    <SettingsPage
      title="Invitations"
      description="Review organization invitations sent to your verified email address."
    >
      <AccountInvitations />
    </SettingsPage>
  )
}

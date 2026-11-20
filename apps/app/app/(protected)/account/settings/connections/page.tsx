import {
  ConnectedAccountsList,
  SettingsCard,
  SettingsPage,
} from "@/components/settings"
import { AuthorizedOAuthClients } from "@/components/settings/authorized-oauth-clients"

export default function ConnectionsPage() {
  return (
    <SettingsPage
      title="Connections"
      description="Manage linked social accounts and apps connected to your DeesseJS account."
    >
      <SettingsCard
        title="Linked accounts"
        description="Connect your social accounts for easier sign-in."
      >
        <ConnectedAccountsList />
      </SettingsCard>
      <SettingsCard
        title="Authorized apps"
        description="Review the access you granted to connected apps. Revoke access at any time."
      >
        <AuthorizedOAuthClients />
      </SettingsCard>
    </SettingsPage>
  )
}

import { ConnectedAccountsList, SettingsCard, SettingsPage } from "@/components/settings"

export default function ConnectionsPage() {
  return (
    <SettingsPage
      title="Connections"
      description="Manage your linked social accounts."
    >
      <SettingsCard
        title="Linked accounts"
        description="Connect your social accounts for easier sign-in."
      >
        <ConnectedAccountsList />
      </SettingsCard>
    </SettingsPage>
  )
}

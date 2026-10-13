import { SessionsTable, SettingsCard, SettingsPage } from "@/components/settings"

export default function SessionsPage() {
  return (
    <SettingsPage
      title="Sessions"
      description="Manage your active sessions and signed-in devices."
    >
      <SettingsCard
        title="Active sessions"
        description="These devices are currently signed in to your account."
      >
        <SessionsTable />
      </SettingsCard>
    </SettingsPage>
  )
}

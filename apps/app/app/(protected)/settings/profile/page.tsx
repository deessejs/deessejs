import { ProfileForm, SettingsCard, SettingsPage } from "@/components/settings"

export default function ProfilePage() {
  return (
    <SettingsPage
      title="Profile"
      description="Manage your public profile information."
    >
      <SettingsCard
        title="Public profile"
        description="This information will be visible to others."
      >
        <ProfileForm />
      </SettingsCard>
    </SettingsPage>
  )
}

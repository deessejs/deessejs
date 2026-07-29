import { EmailForm, SettingsCard, SettingsPage } from "@/components/settings"

export default function EmailPage() {
  return (
    <SettingsPage
      title="Change email"
      description="Update your account email address. A verification link will be sent to the new address."
    >
      <SettingsCard>
        <EmailForm />
      </SettingsCard>
    </SettingsPage>
  )
}

import { PasswordForm, SettingsCard, SettingsPage } from "@/components/settings"

export default function PasswordPage() {
  return (
    <SettingsPage
      title="Change password"
      description="Update your account password."
    >
      <SettingsCard>
        <PasswordForm />
      </SettingsCard>
    </SettingsPage>
  )
}

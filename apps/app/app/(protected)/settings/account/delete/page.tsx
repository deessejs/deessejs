import { DeleteAccountDialog, SettingsPage } from "@/components/settings"

export default function DeleteAccountPage() {
  return (
    <SettingsPage
      title="Delete account"
      description="Permanently remove your account and all associated data."
    >
      <DeleteAccountDialog />
    </SettingsPage>
  )
}

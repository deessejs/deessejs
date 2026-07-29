import Link from "next/link"
import { DangerZone, SettingsCard, SettingsPage } from "@/components/settings"

export default function AccountPage() {
  return (
    <SettingsPage
      title="Account"
      description="Manage your email and account data."
    >
      <SettingsCard
        title="Email"
        description="Change your account email address."
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Update the email associated with your account.
          </p>
          <Link
            href="/settings/account/email"
            className="text-sm font-medium text-primary hover:underline"
          >
            Change
          </Link>
        </div>
      </SettingsCard>

      <DangerZone
        title="Delete account"
        description="Permanently delete your account and all associated data. This action cannot be undone."
      >
        <div className="flex justify-end">
          <Link
            href="/settings/account/delete"
            className="text-sm font-medium text-destructive hover:underline"
          >
            Delete account
          </Link>
        </div>
      </DangerZone>
    </SettingsPage>
  )
}

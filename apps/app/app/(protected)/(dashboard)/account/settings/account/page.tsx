import Link from "next/link"
import { DangerZone, SettingsCard, SettingsPage } from "@/components/settings"

import { SETTINGS_PATHS } from "@/lib/settings-routes"

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
          {/* The email form lives on the Profile tab (it was
              consolidated there in 271f8c9). This link used to point
              at a `/settings/account/email` page that was deleted in
              the same commit, and it has been a 404 since. */}
          <Link
            href={SETTINGS_PATHS.profile}
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
            href={SETTINGS_PATHS.accountDelete}
            className="text-sm font-medium text-destructive hover:underline"
          >
            Delete account
          </Link>
        </div>
      </DangerZone>
    </SettingsPage>
  )
}

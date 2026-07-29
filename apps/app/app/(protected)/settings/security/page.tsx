import Link from "next/link"
import { SettingsCard, SettingsPage } from "@/components/settings"

export default function SecurityPage() {
  return (
    <SettingsPage
      title="Security"
      description="Manage your password and active sessions."
    >
      <SettingsCard
        title="Password"
        description="Change your account password."
      >
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Use a strong password you don&apos;t use elsewhere.
          </p>
          <Link
            href="/settings/security/password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Change
          </Link>
        </div>
      </SettingsCard>
    </SettingsPage>
  )
}

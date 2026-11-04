"use client"

import { PageSkeleton } from "@/components/loading/page-skeleton"
import {
  AccountIdentityCard,
  OrganizationMembershipsCard,
  SettingsPage,
} from "@/components/settings"
import { authClient } from "@/lib/auth-client"

export default function AccountOverviewPage() {
  const session = authClient.useSession()
  const organizations = authClient.useListOrganizations()

  if (session.isPending || organizations.isPending) {
    return <PageSkeleton label="Loading account overview" variant="form" />
  }

  if (session.error) {
    return (
      <SettingsPage
        title="Account overview"
        description="Your account and the organizations you can access."
      >
        <p className="text-sm text-destructive" role="alert">
          Your account information could not be loaded.
        </p>
      </SettingsPage>
    )
  }

  const user = session.data?.user
  if (!user) {
    return (
      <SettingsPage
        title="Account overview"
        description="Your account and the organizations you can access."
      >
        <p className="text-sm text-destructive" role="alert">
          Sign in again to view your account overview.
        </p>
      </SettingsPage>
    )
  }

  return (
    <SettingsPage
      title="Account overview"
      description="Your account and the organizations you can access."
    >
      <AccountIdentityCard user={user} />
      <OrganizationMembershipsCard
        organizations={organizations.data ?? []}
        error={Boolean(organizations.error)}
      />
    </SettingsPage>
  )
}

import Link from "next/link"
import { connection } from "next/server"
import { redirect } from "next/navigation"
import {
  ArrowUpRightIcon,
  Building2Icon,
  UserRoundIcon,
} from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"

import { SettingsCard, SettingsPage } from "@/components/settings"
import { ACCOUNT_OVERVIEW_PATH } from "@/lib/settings-paths"
import { readAccountOverview } from "@/lib/account-overview"
import {
  ORGANIZATIONS_PATH,
  workspaceHomePath,
} from "@/lib/workspace-paths"

function initials(name: string, email: string): string {
  const parts = (name.trim() || email).split(/\s+/).filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase()
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? "?"
}

export default async function AccountOverviewPage() {
  await connection()

  let overview: Awaited<ReturnType<typeof readAccountOverview>>
  try {
    overview = await readAccountOverview()
  } catch {
    return (
      <SettingsPage
        title="Account overview"
        description="Your account and the organizations you can access."
      >
        <div className="rounded-lg border border-destructive/30 p-4" role="alert">
          <h2 className="font-medium">Account information unavailable</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn’t load your account overview. Try again in a moment.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href={ACCOUNT_OVERVIEW_PATH}>Try again</Link>
          </Button>
        </div>
      </SettingsPage>
    )
  }

  if (!overview) {
    redirect(`/login?redirect=${encodeURIComponent(ACCOUNT_OVERVIEW_PATH)}`)
  }

  const { user, organizations } = overview

  return (
    <SettingsPage
      title="Account overview"
      description="Your account and the organizations you can access."
    >
      <SettingsCard
        title="Your account"
        description="The personal identity associated with your sign-in."
      >
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarImage src={user.image ?? undefined} alt="" />
            <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user.emailVerified ? "Email verified" : "Email not verified"}
            </p>
          </div>
          <UserRoundIcon
            aria-hidden
            className="ml-auto hidden size-5 text-muted-foreground sm:block"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Organizations"
        description="Organizations where you have a membership."
      >
        {organizations.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              You don’t belong to any organizations yet.
            </p>
            <Button asChild variant="outline">
              <Link href={ORGANIZATIONS_PATH}>Browse organizations</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {organizations.map((organization) => (
              <li key={organization.id}>
                <Link
                  href={workspaceHomePath(organization.slug)}
                  className="group flex min-h-20 items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="size-10 shrink-0 rounded-md">
                    <AvatarImage
                      src={organization.logo ?? undefined}
                      alt=""
                    />
                    <AvatarFallback className="rounded-md bg-muted">
                      <Building2Icon
                        aria-hidden
                        className="size-5 text-muted-foreground"
                      />
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {organization.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      /{organization.slug}
                    </span>
                  </span>
                  <ArrowUpRightIcon
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>
    </SettingsPage>
  )
}

import Link from "next/link"
import { ArrowUpRightIcon, Building2Icon } from "lucide-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"

import { ORGANIZATIONS_PATH, workspaceHomePath } from "@/lib/workspace-paths"
import { SettingsCard } from "./settings-card"

interface OrganizationMembership {
  id: string
  name: string
  slug: string
  logo?: string | null
}

export function OrganizationMembershipsCard({
  organizations,
  error,
}: {
  organizations: OrganizationMembership[]
  error: boolean
}) {
  return (
    <SettingsCard
      title="Organizations"
      description="Organizations where you have a membership."
    >
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          Your organizations could not be loaded.
        </p>
      ) : organizations.length === 0 ? (
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
                  <AvatarImage src={organization.logo ?? undefined} alt="" />
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
  )
}

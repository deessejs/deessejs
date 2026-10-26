"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  Building2Icon,
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
} from "lucide-react"

import { authClient } from "@/lib/auth-client"
import {
  organizationSlugFromPathname,
  workspaceHomePath,
} from "@/lib/workspace-paths"
import { CreateOrganizationDialog } from "@/components/organizations/create-organization-dialog"

/**
 * The words the rail shows when a switch did not happen.
 *
 * A refusal from the server and a network that never answers are the
 * same thing from the browser: the organization could not be selected.
 * The two differ in the log, not in the rail, and a rail that blamed
 * the caller for the server's absence would be lying.
 */
const SWITCH_FAILED_MESSAGE = "The organization could not be selected."

/**
 * The organization the page belongs to, and the way to another one.
 *
 * The switcher names the organization of the page, not the session's
 * active organization: the rail says what the caller is looking at.
 * The two can disagree, and the disagreement lasts until the caller
 * switches explicitly through the rail. Nothing in a page view writes
 * the session's selection, so the selection stays the caller's choice.
 *
 * The list comes from the plugin's own endpoint, which answers the
 * caller's own memberships and carries no authorization decision.
 *
 * The write comes before the navigation, because the write is what
 * `/home` reads. A refused write leaves the caller where they are and
 * says so in the rail.
 */
export function OrganizationSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpenMobile } = useSidebar()
  const slug = organizationSlugFromPathname(pathname)
  const organizations = authClient.useListOrganizations()
  const [failure, setFailure] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const list = organizations.data ?? []
  const current = list.find((organization) => organization.slug === slug)

  async function switchTo(organization: { id: string; slug: string }) {
    setFailure(null)
    try {
      const { error: refusal } = await authClient.organization.setActive({
        organizationId: organization.id,
      })
      if (refusal) {
        setFailure(refusal.message ?? SWITCH_FAILED_MESSAGE)
        return
      }
    } catch {
      // The call never came back: the network is down, or the server
      // answered nothing. The browser cannot tell that apart from a
      // refusal, and neither can the caller.
      setFailure(SWITCH_FAILED_MESSAGE)
      return
    }
    setOpenMobile(false)
    router.push(workspaceHomePath(organization.slug))
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <Building2Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
                  <span className="truncate font-medium">
                    {current?.name ?? slug ?? "Organization"}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    /{slug ?? ""}
                  </span>
                </span>
                <ChevronsUpDownIcon
                  className="ml-auto size-4 shrink-0 opacity-60"
                  aria-hidden
                />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              <DropdownMenuLabel>Organizations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.isPending && (
                <DropdownMenuItem disabled>Loading…</DropdownMenuItem>
              )}
              {organizations.error && (
                <DropdownMenuItem disabled>
                  Your organizations could not be loaded.
                </DropdownMenuItem>
              )}
              {!organizations.isPending &&
                !organizations.error &&
                list.map((organization) => {
                  const isCurrent = organization.slug === slug
                  return (
                    <DropdownMenuItem
                      key={organization.id}
                      aria-current={isCurrent ? "page" : undefined}
                      onSelect={async () => {
                        await switchTo(organization)
                      }}
                    >
                      <CheckIcon
                        className={isCurrent ? "opacity-100" : "opacity-0"}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">
                        {organization.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{organization.slug}
                      </span>
                    </DropdownMenuItem>
                  )
                })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  // The sheet closes first: on a narrow viewport the
                  // dialog would otherwise open inside the sheet's
                  // modal.
                  setOpenMobile(false)
                  setDialogOpen(true)
                }}
              >
                <PlusIcon aria-hidden />
                Create an organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {failure && (
        <p className="text-xs text-destructive" role="alert">
          {failure}
        </p>
      )}

      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          // The creation goes through the API and not through the
          // plugin's own endpoint, so the plugin's listener never
          // fires and the list has to be refreshed by hand.
          void organizations.refetch()
        }}
      />
    </>
  )
}

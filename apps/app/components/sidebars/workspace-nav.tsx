"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"

import {
  activeWorkspaceHref,
  workspaceNavEntries,
  workspaceNavGroups,
} from "@/lib/workspace-nav"
import { organizationSlugFromPathname } from "@/lib/workspace-paths"

/**
 * The organization's navigation, in the rail.
 *
 * The entries come from a module, so the next increment adds its
 * entries there and this component renders whatever the module holds.
 * The active entry is the one whose path is the longest prefix of the
 * current pathname.
 *
 * A link closes the mobile sheet. The workspace layout stays mounted
 * across a navigation, so a sheet left open would cover the page the
 * caller just asked for.
 */
export function WorkspaceNav() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const slug = organizationSlugFromPathname(pathname)

  if (slug === null) return null

  const groups = workspaceNavGroups(slug)
  const entries = workspaceNavEntries(slug)
  const active = activeWorkspaceHref(pathname, entries)

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.entries.map((entry) => {
              const Icon = entry.icon
              const isActive = active === entry.href
              return (
                <SidebarMenuItem key={entry.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={entry.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Icon className="size-4" aria-hidden />
                      <span>{entry.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}

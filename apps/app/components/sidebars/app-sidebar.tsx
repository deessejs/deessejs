"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@workspace/ui/components/sidebar"

import { NavUser } from "@/components/sidebars/nav-user"
import { OrganizationSwitcher } from "@/components/sidebars/organization-switcher"
import { WorkspaceNav } from "@/components/sidebars/workspace-nav"

/**
 * The workspace's rail.
 *
 * The header names the organization the page belongs to and carries
 * the way to another one, the content holds the organization's own
 * navigation, and the footer holds the account menu.
 *
 * The rail is collapsible off-canvas: it slides out of the way and
 * keeps its full width when it is open, which is what a switcher with
 * a name in it needs. Collapsing it to an icon would leave the
 * switcher with no icon to show.
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <WorkspaceNav />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

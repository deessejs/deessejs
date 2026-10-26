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
 * The header is the height of the page's own header, and it carries
 * the same separator, so the two read as one line across the window.
 * The footer carries its own, so the account menu is separated from
 * the navigation the same way.
 *
 * The rail is collapsible off-canvas: it slides out of the way and
 * keeps its full width when it is open, which is what a switcher with
 * a name in it needs. Collapsing it to an icon would leave the
 * switcher with no icon to show.
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-14 justify-center border-b bg-background px-2 py-1">
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <WorkspaceNav />
      </SidebarContent>
      <SidebarFooter className="border-t bg-background">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

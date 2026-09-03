"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavUser } from "@/components/sidebars/nav-user"
import { SettingsNav } from "@/components/sidebars/settings-nav"
import { SidebarBackAction } from "@/components/sidebars/sidebar-back-action"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { orgHomePath } from "@/lib/org-route"

import { Home, Settings } from "lucide-react"
import { TeamSwitcher } from "@/components/sidebars/team-switcher"

/**
 * Pinned "Home" entry rendered below the brand header. Always visible —
 * the user needs an exit ramp from any nested route. `isActive` matches
 * the per-org home at `/{ORG_SLUG}/home` (ADR-030 §"Decision #5").
 */
function HomeShortcut() {
  const pathname = usePathname()
  const homePath = orgHomePath()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip="Home"
        isActive={pathname === homePath}
      >
        <Link href={homePath}>
          <Home />
          <span>Home</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * Pinned "Settings" shortcut rendered at the bottom of the scrollable
 * sidebar content via `mt-auto`. Hidden on /settings/* — the SettingsNav
 * renders the full settings menu there, and SidebarBackAction brings the
 * user home, so adding a third entry would be redundant.
 */
function SettingsShortcut() {
  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

/**
 * Returns true when the current path lives under /settings (but NOT a path
 * that merely starts with the same letters, e.g. /settings-pro).
 */
function isSettingsPath(pathname: string): boolean {
  return pathname === "/settings" || pathname.startsWith("/settings/")
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const inSettings = isSettingsPath(pathname)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 border-b bg-background">
        {/*
          Brand header replaced by the workspace switcher (ADR-030
          §"Decision #5"). The TeamSwitcher carries the active org
          name + role and lets users hop between workspaces.
        */}
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarBackAction />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <HomeShortcut />
          </SidebarMenu>
        </SidebarGroup>
        {inSettings ? <SettingsNav /> : <SettingsShortcut />}
      </SidebarContent>
      <SidebarFooter className="border-t bg-background">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

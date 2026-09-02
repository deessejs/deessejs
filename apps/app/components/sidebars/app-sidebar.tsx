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
import { APP_NAME } from "@/lib/app-config"

import { Home, Settings } from "lucide-react"

/**
 * Pinned "Home" entry rendered below the brand header. Always visible —
 * the user needs an exit ramp from any nested route. `isActive` provides
 * the sidebar's active styling when on /home.
 */
function HomeShortcut() {
  const pathname = usePathname()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip="Home"
        isActive={pathname === "/home"}
      >
        <Link href="/home">
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
      <SidebarHeader className="h-14 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="h-14 font-semibold"
              tooltip={APP_NAME}
            >
              <Link href="/home">
                <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
                  {APP_NAME.charAt(0)}
                </span>
                <span>{APP_NAME}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
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
      <SidebarFooter className="border-t">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

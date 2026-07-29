"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"

function isSettingsPath(pathname: string): boolean {
  return pathname === "/settings" || pathname.startsWith("/settings/")
}

/**
 * Contextual "Back" action rendered inside the sidebar. Shown only on
 * /settings/* routes so users can return to the dashboard.
 *
 * Uses the same `SidebarMenuButton` primitives as the rest of the sidebar
 * (SettingsNav, NavUser, NavMain) so the visual language, hover state,
 * icon-only collapse, and tooltip behavior all stay consistent.
 *
 * Renders at the top of the sidebar content (above the main nav), so it
 * stays discoverable regardless of sidebar collapse state and doesn't
 * compete with the top header.
 *
 * Client component because it reads `usePathname()`. The surrounding
 * AppSidebar is also client so this composes cleanly.
 */
export function SidebarBackAction() {
  const pathname = usePathname()

  if (!isSettingsPath(pathname)) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Back to home">
          <Link href="/home">
            <ArrowLeftIcon className="size-4" />
            <span>Back to home</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
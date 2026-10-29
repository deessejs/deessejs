"use client"

import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/sidebars/app-sidebar"
import { OrganizationSettingsSidebar } from "@/components/sidebars/organization-settings-sidebar"
import {
  organizationSlugFromPathname,
  workspaceSettingsPath,
} from "@/lib/workspace-paths"

export function WorkspaceSidebar() {
  const pathname = usePathname()
  const slug = organizationSlugFromPathname(pathname)
  const settingsPath = slug ? workspaceSettingsPath(slug) : null
  const isOrganizationSettings =
    settingsPath !== null &&
    (pathname === settingsPath || pathname.startsWith(`${settingsPath}/`))

  return isOrganizationSettings ? (
    <OrganizationSettingsSidebar />
  ) : (
    <AppSidebar />
  )
}

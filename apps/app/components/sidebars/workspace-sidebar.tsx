"use client"

import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/sidebars/app-sidebar"
import { OrganizationSettingsSidebar } from "@/components/sidebars/organization-settings-sidebar"
import { ProjectSidebar } from "@/components/sidebars/project-sidebar"
import {
  organizationSlugFromPathname,
  workspaceProjectFromPathname,
  workspaceSettingsPath,
} from "@/lib/workspace-paths"

export function WorkspaceSidebar() {
  const pathname = usePathname()
  const slug = organizationSlugFromPathname(pathname)
  const project = workspaceProjectFromPathname(pathname)
  const settingsPath = slug ? workspaceSettingsPath(slug) : null
  const isOrganizationSettings =
    settingsPath !== null &&
    (pathname === settingsPath || pathname.startsWith(`${settingsPath}/`))

  if (project) {
    return (
      <ProjectSidebar
        organizationSlug={project.organizationSlug}
        projectId={project.projectId}
      />
    )
  }

  return isOrganizationSettings ? (
    <OrganizationSettingsSidebar />
  ) : (
    <AppSidebar />
  )
}

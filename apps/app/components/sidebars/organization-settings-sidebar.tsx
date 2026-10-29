"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { HomeIcon, SettingsIcon } from "lucide-react"

import { NavUser } from "@/components/sidebars/nav-user"
import { OrganizationSwitcher } from "@/components/sidebars/organization-switcher"
import {
  organizationSlugFromPathname,
  workspaceHomePath,
  workspaceOrganizationSettingsPath,
} from "@/lib/workspace-paths"

export function OrganizationSettingsSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const slug = organizationSlugFromPathname(pathname)

  if (!slug) return null

  const homeHref = workspaceHomePath(slug)
  const generalHref = workspaceOrganizationSettingsPath(slug)
  const isGeneralActive =
    pathname === generalHref || pathname.startsWith(`${generalHref}/`)

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-14 justify-center border-b bg-background px-2 py-1">
        <OrganizationSwitcher preserveSettingsPath />
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={homeHref} onClick={() => setOpenMobile(false)}>
                  <HomeIcon className="size-4" aria-hidden />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isGeneralActive}>
                <Link
                  href={generalHref}
                  aria-current={isGeneralActive ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                >
                  <SettingsIcon className="size-4" aria-hidden />
                  <span>General</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t bg-background">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

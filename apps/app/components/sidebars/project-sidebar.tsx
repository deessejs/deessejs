"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeftIcon, HomeIcon } from "lucide-react"
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

import { NavUser } from "@/components/sidebars/nav-user"
import { organizationProjectQueryOptions } from "@/lib/github-projects-query"
import {
  workspaceProjectHomePath,
  workspaceProjectsPath,
} from "@/lib/workspace-paths"

export function ProjectSidebar({
  organizationSlug,
  projectId,
}: {
  organizationSlug: string
  projectId: string
}) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const project = useQuery(
    organizationProjectQueryOptions(organizationSlug, projectId)
  )
  const homeHref = workspaceProjectHomePath(organizationSlug, projectId)
  const isHomeActive =
    pathname === homeHref || pathname.startsWith(`${homeHref}/`)

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-14 justify-center border-b bg-background px-2 py-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link
                href={workspaceProjectsPath(organizationSlug)}
                onClick={() => setOpenMobile(false)}
              >
                <ArrowLeftIcon className="size-4" aria-hidden />
                <span>All projects</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel className="truncate">
            {project.data?.project.repositoryFullName ?? "Project"}
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isHomeActive}>
                <Link
                  href={homeHref}
                  aria-current={isHomeActive ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                >
                  <HomeIcon className="size-4" aria-hidden />
                  <span>Home</span>
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

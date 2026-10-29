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
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { LayoutTemplateIcon } from "lucide-react"

import { NavUser } from "@/components/sidebars/nav-user"

const TEMPLATES_HREF = "/admin/templates"

export function AdminSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const isTemplatesActive =
    pathname === TEMPLATES_HREF || pathname.startsWith(`${TEMPLATES_HREF}/`)

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-14 justify-center border-b bg-background px-4">
        <span className="text-sm font-semibold">Administration</span>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Catalog</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isTemplatesActive}>
                <Link
                  href={TEMPLATES_HREF}
                  aria-current={isTemplatesActive ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                >
                  <LayoutTemplateIcon className="size-4" aria-hidden />
                  <span>Templates</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t bg-background">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

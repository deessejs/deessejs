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
import {
  BlocksIcon,
  ClipboardCheckIcon,
  LayoutTemplateIcon,
} from "lucide-react"

import { NavUser } from "@/components/sidebars/nav-user"

const TEMPLATES_HREF = "/admin/templates"
const SUBMISSIONS_HREF = "/admin/templates/submissions"
const BLOCK_SUBMISSIONS_HREF = "/admin/blocks/submissions"

export function AdminSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const isTemplatesActive =
    pathname === TEMPLATES_HREF ||
    (pathname.startsWith(`${TEMPLATES_HREF}/`) &&
      !pathname.startsWith(SUBMISSIONS_HREF))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b bg-background px-4">
        <span className="text-sm font-semibold">Administration</span>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Catalog</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isTemplatesActive}
                tooltip="Templates"
              >
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
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/admin/blocks")}
                tooltip="Blocks"
              >
                <Link
                  href={BLOCK_SUBMISSIONS_HREF}
                  aria-current={
                    pathname.startsWith("/admin/blocks") ? "page" : undefined
                  }
                  onClick={() => setOpenMobile(false)}
                >
                  <BlocksIcon className="size-4" aria-hidden />
                  <span>Blocks</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === SUBMISSIONS_HREF}
                tooltip="Publication requests"
              >
                <Link
                  href={SUBMISSIONS_HREF}
                  aria-current={
                    pathname === SUBMISSIONS_HREF ? "page" : undefined
                  }
                  onClick={() => setOpenMobile(false)}
                >
                  <ClipboardCheckIcon className="size-4" aria-hidden />
                  <span>Publication requests</span>
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

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgeCheckIcon,
  HomeIcon,
  LinkIcon,
  ShieldIcon,
  SmartphoneIcon,
  UserIcon,
} from "lucide-react"

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

import { NavUser } from "@/components/sidebars/nav-user"
import { APP_CONFIG } from "@/lib/app-config"
import { authClient } from "@/lib/auth-client"
import { SETTINGS_PATHS } from "@/lib/settings-paths"

const MAIN_NAV = [
  { label: "Dashboard", href: APP_CONFIG.links.home, icon: HomeIcon },
]

const SETTINGS_NAV = [
  { label: "Profile", href: SETTINGS_PATHS.profile, icon: UserIcon },
  { label: "Sessions", href: SETTINGS_PATHS.sessions, icon: SmartphoneIcon },
  { label: "Connections", href: SETTINGS_PATHS.connections, icon: LinkIcon },
  { label: "Account", href: SETTINGS_PATHS.account, icon: BadgeCheckIcon },
]

export function SettingsSidebar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { data: session } = authClient.useSession()
  const isAdmin = session?.user?.role === "admin"
  const mainNav = isAdmin
    ? [
        ...MAIN_NAV,
        {
          label: "Administration",
          href: "/admin/templates",
          icon: ShieldIcon,
        },
      ]
    : MAIN_NAV

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-14 justify-center border-b bg-background px-4">
        <span className="text-sm font-semibold">Account settings</span>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Icon className="size-4" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Icon className="size-4" aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t bg-background">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

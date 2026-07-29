"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  BadgeCheckIcon,
  KeyIcon,
  LinkIcon,
  SmartphoneIcon,
  UserIcon,
} from "lucide-react"

type SettingsNavChild = {
  title: string
  href: string
}

type SettingsNavItem = {
  title: string
  href: string
  icon: typeof UserIcon
  children?: SettingsNavChild[]
}

const NAV_ITEMS: SettingsNavItem[] = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: UserIcon,
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: KeyIcon,
    children: [{ title: "Password", href: "/settings/security/password" }],
  },
  {
    title: "Sessions",
    href: "/settings/sessions",
    icon: SmartphoneIcon,
  },
  {
    title: "Connections",
    href: "/settings/connections",
    icon: LinkIcon,
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: BadgeCheckIcon,
    children: [
      { title: "Email", href: "/settings/account/email" },
      { title: "Delete account", href: "/settings/account/delete" },
    ],
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.children && isActive && (
                  <div className="ml-6 flex flex-col gap-1 border-l pl-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
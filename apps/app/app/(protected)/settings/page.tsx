import Link from "next/link"
import { SettingsCard, SettingsPage } from "@/components/settings"
import {
  BadgeCheckIcon,
  KeyIcon,
  LinkIcon,
  SmartphoneIcon,
  UserIcon,
} from "lucide-react"

const SECTIONS = [
  {
    title: "Profile",
    description: "Manage your public profile information.",
    href: "/settings/profile",
    icon: UserIcon,
  },
  {
    title: "Security",
    description: "Manage your password and active sessions.",
    href: "/settings/security",
    icon: KeyIcon,
  },
  {
    title: "Sessions",
    description: "View and manage your active devices.",
    href: "/settings/sessions",
    icon: SmartphoneIcon,
  },
  {
    title: "Connections",
    description: "Manage your linked social accounts.",
    href: "/settings/connections",
    icon: LinkIcon,
  },
  {
    title: "Account",
    description: "Manage your email and delete your account.",
    href: "/settings/account",
    icon: BadgeCheckIcon,
  },
]

export default function Settings() {
  return (
    <SettingsPage title="Settings" description="Manage your account settings.">
      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <SettingsCard title="" description="">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-medium">{section.title}</h2>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </SettingsCard>
            </Link>
          )
        })}
      </div>
    </SettingsPage>
  )
}

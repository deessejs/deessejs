import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CircleHelpIcon,
  LifeBuoyIcon,
  MailIcon,
  MessageCircleIcon,
  type LucideIcon,
} from "lucide-react"

import { SettingsCard, SettingsPage } from "@/components/settings"
import { DOCS_URL, WEB_URL } from "@/lib/app-config"

const SUPPORT_EMAIL = "support@deessejs.com"
const DISCUSSIONS_URL = "https://github.com/deessejs/deessejs/discussions"

function getHttpUrl(base: string | undefined, path?: string): string | undefined {
  if (!base) return undefined
  try {
    const url = path ? new URL(path, base) : new URL(base)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined
  } catch {
    return undefined
  }
}

const HELP_URL = getHttpUrl(WEB_URL, "/help")
const DOCUMENTATION_URL = getHttpUrl(DOCS_URL)

const RESOURCE_LINKS = [
  HELP_URL && {
    title: "In-app help",
    description: "Browse answers and guidance for using DeesseJS.",
    href: HELP_URL,
    label: "Visit help",
    icon: CircleHelpIcon,
    external: true,
  },
  DOCUMENTATION_URL && {
    title: "Documentation",
    description: "Read product guides, setup instructions, and references.",
    href: DOCUMENTATION_URL,
    label: "Browse documentation",
    icon: BookOpenIcon,
    external: true,
  },
].filter((link): link is NonNullable<typeof link> => Boolean(link))

const CONTACT_LINKS = [
  {
    title: "GitHub Discussions",
    description: "Ask the community a question or share an idea.",
    href: DISCUSSIONS_URL,
    label: "Join the discussion",
    icon: MessageCircleIcon,
    external: true,
  },
  {
    title: "Email support",
    description: "Contact the DeesseJS team directly.",
    href: `mailto:${SUPPORT_EMAIL}`,
    label: SUPPORT_EMAIL,
    icon: MailIcon,
    external: false,
  },
]

function SupportLink({
  title,
  description,
  href,
  label,
  icon: Icon,
  external,
}: {
  title: string
  description: string
  href: string
  label: string
  icon: LucideIcon
  external: boolean
}) {
  return (
    <a
      className="group flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 font-medium">
          {title}
          {external && <ArrowUpRightIcon className="size-3.5 text-muted-foreground" aria-hidden />}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
        <span className="mt-2 block text-sm text-primary">{label}</span>
      </span>
    </a>
  )
}

export default function AccountSupportPage() {
  return (
    <SettingsPage
      title="Support"
      description="Find answers, learn about DeesseJS, or get in touch with the team."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard
          title="Help resources"
          description="Start here for answers and product guidance."
        >
          <div className="grid gap-1">
            {RESOURCE_LINKS.map((link) => (
              <SupportLink key={link.title} {...link} />
            ))}
          </div>
        </SettingsCard>
        <SettingsCard
          title="Contact and community"
          description="Choose the best place to ask or share feedback."
        >
          <div className="grid gap-1">
            {CONTACT_LINKS.map((link) => (
              <SupportLink key={link.title} {...link} />
            ))}
          </div>
        </SettingsCard>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LifeBuoyIcon className="size-4" aria-hidden />
        Support requests are handled through these existing channels.
      </p>
    </SettingsPage>
  )
}

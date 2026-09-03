import Image from "next/image"

import { CookiePreferencesButton } from "@workspace/cookies"

import { FooterColumn, type FooterLink } from "./footer-column"

const footerSections: ReadonlyArray<{
  heading: string
  links: ReadonlyArray<FooterLink>
}> = [
  {
    heading: "DeesseJS",
    links: [
      { label: "Errors", href: "https://errors.deessejs.com" },
      { label: "DRPC", href: "https://drpc.deessejs.com" },
      { label: "Collections", href: "https://collections.deessejs.com" },
      { label: "FP", href: "https://fp.deessejs.com" },
      { label: "UI", href: "https://ui.deessejs.com" },
      { label: "Admin", href: "https://admin.deessejs.com" },
      { label: "Cloud", href: "https://cloud.deessejs.com" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Docs", href: "https://docs.deessejs.com" },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      { label: "Knowledge Base", href: "/knowledge-base" },
    ],
  },
  {
    heading: "Use cases",
    links: [
      { label: "SaaS apps", href: "/use-cases/saas-apps" },
      { label: "AI products", href: "/use-cases/ai-products" },
      { label: "Landing pages", href: "/use-cases/landing-pages" },
      { label: "API backends", href: "/use-cases/api-backends" },
      { label: "Internal tools", href: "/use-cases/internal-tools" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Manifesto", href: "/manifesto" },
      { label: "Principles", href: "/principles" },
      { label: "Vision", href: "/vision" },
      { label: "Enterprise", href: "/enterprise" },
      { label: "Help", href: "/help" },
    ],
  },
  {
    heading: "Legal & Trust",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
      { label: "DPA", href: "mailto:support@deessejs.com?subject=DPA%20request" },
      { label: "Security", href: "mailto:support@deessejs.com" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Open Source Program", href: "/oss" },
      { label: "Students", href: "/students" },
      { label: "Github", href: "https://github.com/deessejs" },
      { label: "LinkedIn", href: "#" },
      { label: "X", href: "#" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Customers", href: "/customers" },
      { label: "Templates", href: "/templates" },
      { label: "Ecosystem", href: "/ecosystem" },
      { label: "Stack", href: "/stack" },
    ],
  },
]

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/icon.svg"
                alt="DeesseJS logo"
                width={28}
                height={28}
                className="size-7"
              />
              <span className="text-lg font-semibold text-foreground">
                DeesseJS
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Software engineering as a commodity: agents that code, workflows
              that scale, infrastructure that works. Built with the DeesseJS
              ecosystem.
            </p>
          </div>

          {footerSections.map((section) => (
            <FooterColumn
              key={section.heading}
              heading={section.heading}
              links={section.links}
            />
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DeesseJS. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/deessejs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <CookiePreferencesButton />
          </div>
        </div>
      </div>
    </footer>
  )
}

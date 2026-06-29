import Link from "next/link"
import Image from "next/image"

const footerLinks = {
  deessejs: [
    { label: 'Home', href: 'https://deessejs.com' },
    { label: 'Errors', href: 'https://errors.deessejs.com' },
    { label: 'DRPC', href: 'https://drpc.deessejs.com' },
    { label: 'Collections', href: 'https://collections.deessejs.com' },
    { label: 'FP', href: 'https://fp.deessejs.com' },
    { label: 'Admin', href: 'https://admin.deessejs.com' },
    { label: 'Cloud', href: 'https://deessejs.com/cloud' },
  ],
  learn: [
    { label: 'Docs', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Academy', href: 'https://academy.nesalia.com' },
    { label: 'Community', href: 'https://community.nesalia.com' },
  ],
  usecases: [
    { label: 'Autonomous Agents', href: '/solution/autonomous-agents' },
    { label: 'Workflows', href: '/solution/workflows' },
    { label: 'Github Bot', href: '/solution/github-bot' },
    { label: 'Content Creation', href: '/solution/content-creation' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Help', href: '/help' },
    { label: 'Legal', href: '/legal' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
  ],
  community: [
    { label: 'Open Source Program', href: '/oss-program' },
    { label: 'Students', href: '/students' },
    { label: 'Github', href: 'https://github.com/nesalia-inc' },
    { label: 'LinkedIn', href: '#' },
    { label: 'X', href: '#' },
  ],
}

export function HomeFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/icon.svg"
                alt="Nesalia"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="text-lg font-bold text-foreground">Nesalia Inc.</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Software engineering as a commodity: agents that code, workflows that scale, infrastructure that works. Built with the DeesseJS ecosystem.
            </p>
          </div>

          {/* DeesseJS */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">DeesseJS</h3>
            <ul className="space-y-2">
              {footerLinks.deessejs.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Learn</h3>
            <ul className="space-y-2">
              {footerLinks.learn.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Use cases */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Use cases</h3>
            <ul className="space-y-2">
              {footerLinks.usecases.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Community</h3>
            <ul className="space-y-2">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Nesalia Inc. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/nesalia-inc"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
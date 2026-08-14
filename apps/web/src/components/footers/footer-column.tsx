import Link from "next/link"

export type FooterLink = {
  label: string
  href: string
}

export function FooterColumn({
  heading,
  links,
}: {
  heading: string
  links: ReadonlyArray<FooterLink>
}) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">{heading}</h3>
      <ul className="space-y-2">
        {links.map((link) => {
          const isExternal = link.href.startsWith("http") ||
            link.href.startsWith("mailto:")
          const className =
            "text-sm text-muted-foreground hover:text-foreground transition-colors"
          return (
            <li key={link.label}>
              {isExternal ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {link.label}
                </a>
              ) : (
                <Link href={link.href} className={className}>
                  {link.label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

import { Separator } from "@workspace/ui/components/ui/separator"

// Footer uses the editorial max-w-7xl + border-x + border-foreground/15
// frame so its left/right edges align with the main content column.
const bodyContainerClass =
  "mx-auto w-full max-w-7xl border-x border-foreground/15 px-4 sm:px-6 lg:px-8"

const footerColumns = [
  { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
  {
    title: "Resources",
    links: ["Documentation", "Templates", "Showcase", "Support"],
  },
  { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "License"] },
]

/**
 * HomeFooter — 4-column link grid + separator + bottom row.
 *
 * Placeholder copy and links. Replace with real data when the marketing
 * site has its content inventory finalized.
 */
export function HomeFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className={bodyContainerClass}>
        <div className="grid gap-8 py-16 sm:grid-cols-2 md:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DeesseJS — All rights reserved
          </p>
          <a
            href="#"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

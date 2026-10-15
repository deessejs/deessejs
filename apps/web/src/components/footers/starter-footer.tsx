import Link from "next/link"
import Image from "next/image"

const docsUrl = "https://docs.deessejs.com/getting-started"
const repoUrl = "https://github.com/deessejs/saas-template"

export function StarterFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
          aria-label="DeesseJS home"
        >
          <Image src="/icon.svg" alt="" width={24} height={24} aria-hidden />
          DeesseJS
        </Link>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground"
        >
          <Link href={docsUrl} className="hover:text-foreground">
            Documentation
          </Link>
          <Link
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            GitHub
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </nav>
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} DeesseJS
        </span>
      </div>
    </footer>
  )
}

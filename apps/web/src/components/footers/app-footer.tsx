import Link from "next/link"
import { APP_NAME } from "@workspace/ui/lib/config"
import { CookiePreferencesButton } from "@workspace/cookies"

export function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <p className="text-muted-foreground text-sm">
          © {year} {APP_NAME}. All rights reserved.
        </p>

        <nav className="flex items-center gap-4">
          <Link
            href="/docs"
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/cookies"
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Cookies
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            Terms
          </Link>
          <CookiePreferencesButton />
        </nav>
      </div>
    </footer>
  )
}

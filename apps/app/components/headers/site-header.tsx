"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { APP_NAME } from "@workspace/ui/lib/config"

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-semibold text-lg">
          {APP_NAME}
        </Link>

        <nav className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

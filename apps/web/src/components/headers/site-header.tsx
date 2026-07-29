"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Sheet, SheetContent, SheetTrigger } from "@workspace/ui/components/sheet"
import { APP_NAME } from "@workspace/ui/lib/config"

const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/docs", label: "Docs" },
]

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  )
}

function DesktopNav() {
  return (
    <nav className="hidden items-center gap-4 sm:flex">
      {NAV_LINKS.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  )
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="sm:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-64 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            {APP_NAME}
          </Link>
        </div>
        <nav className="flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="w-full">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileNav />
          <Link href="/" className="font-semibold text-lg">
            {APP_NAME}
          </Link>
          <DesktopNav />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

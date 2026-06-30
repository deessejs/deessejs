"use client"

import * as React from "react"
import Link from "next/link"
import { Moon, Sun } from "lucide-react"

import { useTheme } from "@workspace/ui/components/theme-provider"
import { SidebarTrigger } from "@workspace/ui/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@workspace/ui/components/ui/avatar"
import { Button } from "@workspace/ui/components/ui/button"
import { Separator } from "@workspace/ui/components/ui/separator"

/**
 * AppHeader — top bar inside the Cloud (protected) shell.
 *
 * Sits at the top of `<SidebarInset />`, above the routed page content.
 * Owns:
 *  - the sidebar collapse trigger (left)
 *  - a brand separator + product label
 *  - a theme toggle button (light/dark), wired through next-themes
 *  - a placeholder user avatar linking to /settings (no auth yet)
 *
 * Theme toggle uses the `mounted` pattern to avoid hydration mismatch —
 * resolvedTheme is undefined during SSR so we wait for the first effect
 * tick before reading it. Without this, the icon flips on first paint.
 */
export function AppHeader() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-2 h-6" />
      <span className="text-sm font-medium text-muted-foreground">
        DeesseJS Cloud
      </span>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun /> : <Moon />}
      </Button>
      <Link
        href="/settings"
        aria-label="Account settings"
        className="ml-2 flex size-8 items-center justify-center rounded-full ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar className="size-7">
          <AvatarFallback className="text-xs font-medium">SK</AvatarFallback>
        </Avatar>
      </Link>
    </header>
  )
}
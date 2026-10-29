"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { LayoutDashboardIcon, ShieldCheckIcon } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export function DashboardSwitcher({
  currentSurface,
}: {
  currentSurface: "admin" | "workspace"
}) {
  const { data: session } = authClient.useSession()

  if (session?.user.role !== "admin") return null

  const destination =
    currentSurface === "admin"
      ? {
          href: "/home",
          label: "Workspace dashboard",
          shortLabel: "Workspace",
          Icon: LayoutDashboardIcon,
        }
      : {
          href: "/admin/home",
          label: "Admin dashboard",
          shortLabel: "Admin",
          Icon: ShieldCheckIcon,
        }

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
    >
      <Link
        href={destination.href}
        aria-label={destination.label}
        title={destination.label}
      >
        <destination.Icon aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{destination.shortLabel}</span>
      </Link>
    </Button>
  )
}

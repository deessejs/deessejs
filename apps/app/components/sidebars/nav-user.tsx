"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { BadgeCheckIcon, ChevronsUpDownIcon, LogOutIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { SETTINGS_PATHS } from "@/lib/settings-paths"

const VERCEL_AVATAR_BASE = "https://vercel.com/api/www/avatar"

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts.at(0)
  if (!first) return "?"
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const last = parts.at(-1) ?? first
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}

function getAvatarUrl(email: string, image?: string | null): string {
  if (image) return image
  return `${VERCEL_AVATAR_BASE}?s=40&u=${encodeURIComponent(email)}&dpl=dpl_AS99V7XmtTzE4xdb72tYFtNTVV48`
}

/**
 * The account menu.
 *
 * The trigger names the account: the avatar, the name and the email,
 * and the chevron that opens the menu. The menu repeats the identity
 * at its head, so the caller knows whose account the entries below
 * belong to, and carries the entries that exist: the account
 * settings, and the way out.
 *
 * The menu is mounted in the rail's footer and in the header of the
 * surfaces that have no rail, so the identity is hidden on a narrow
 * viewport, where the header has no room for it. The menu itself
 * always names the account.
 *
 * The sign-out flow is the component's own: the dialog, the
 * `authClient.signOut` call and the redirect to the login page.
 */
export function NavUser() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  // Top-level hook call: component top-level is a valid hook context per
  // React's rules. The audit §3.5 bug was calling useSession() inside an
  // async callback (useCallback body), which IS a violation. Here at
  // top-level, useSession() is correct.
  const { data: session } = authClient.useSession()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const user = session?.user

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutDialogOpen(false)
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          queryClient.clear()
          router.push("/login")
        },
      },
    })
  }

  // No session — render an anonymous "Guest" placeholder
  if (!user) {
    return (
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarFallback className="rounded-lg">?</AvatarFallback>
      </Avatar>
    )
  }

  const avatarUrl = getAvatarUrl(user.email, user.image)
  const initials = getInitials(user.name)

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 flex-1 flex-col text-left text-sm leading-tight sm:flex">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={SETTINGS_PATHS.profile}>
                    <BadgeCheckIcon />
                    Account settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLogoutDialogOpen(true)}
                disabled={loggingOut}
              >
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You will be signed out of your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Signing out…" : "Log out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@deessejs/auth"

import { AppHeader } from "@/components/headers/app-header"

/**
 * Layout for the authenticated app surface. Wraps every route in
 * `app/(app)/*` (dashboard, settings, members, admin, etc.).
 *
 * The (app) route group is a layout boundary but adds no URL segment:
 * `app/(app)/dashboard/page.tsx` → URL is `/dashboard`.
 *
 * Responsibilities:
 *   1. **Auth gate** — read the session server-side, redirect to
 *      `/login?redirect=<current-path>` if no session. This is the
 *      primary auth check (page-level, not middleware) per Better
 *      Auth's recommendation: middleware-based auth is optimistic
 *      and not secure on its own.
 *   2. **AppHeader** — the sticky top nav with brand + (eventually)
 *      org switcher + nav items + user menu. Renders with the
 *      session user.
 *
 * The shared top nav for unauthenticated pages is in
 * `app/(unprotected)/layout.tsx` — different layout, different surface.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    // Always re-read the path from the request — easier in Next 16
    // because `next-url` is on the headers. For now, redirect to a
    // generic /login; the login page can read `?redirect=` from the
    // page-level call sites that know the target.
    redirect("/login?redirect=/dashboard")
  }

  const { user } = session

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        user={{ name: user.name, email: user.email }}
        navItems={[
          { label: "Dashboard", href: "/dashboard", active: true },
        ]}
      />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}

import { headers } from "next/headers"

import { auth } from "@deessejs/auth"

import { SignOutButton } from "@/components/auth/sign-out-button"

/**
 * Dashboard page. URL: /dashboard.
 *
 * Placeholder for M1 — the real dashboard lands in M2 with org
 * switcher, activity feed, and quick actions. For now it just
 * confirms the auth gate works: greeting, session info, sign out.
 *
 * Server component. The (app)/layout already validated the session
 * before we got here, so we can use it directly. We re-read the
 * session in the page to display its fields (the layout doesn't
 * expose them down the tree — could be moved to a React context
 * later, but for a placeholder it's not worth the ceremony).
 */
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  // The layout already redirected if there's no session, but we
  // narrow the type for the template below.
  if (!session) return null

  const { user, session: sess } = session
  const expiresAt = new Date(sess.expiresAt).toLocaleString()

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          You&rsquo;re signed in. This is the M1 dashboard placeholder
          &mdash; the real surface lands in M2.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground">
          Session
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium text-foreground">{user.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium text-foreground">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email verified</dt>
            <dd className="font-medium text-foreground">
              {user.emailVerified ? "Yes" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Session expires</dt>
            <dd className="font-medium text-foreground">{expiresAt}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">What&rsquo;s next</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Org switcher + multi-tenant nav (M2)</li>
          <li>Settings, members, admin (M2 &mdash; routes 404 for now)</li>
          <li>oRPC ping from the frontend (Phase 2 of the API wire-up)</li>
        </ul>
      </section>

      <SignOutButton />
    </div>
  )
}

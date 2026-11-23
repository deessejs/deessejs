import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { resolveAdminAccess } from "./access.js"

type AdminRuntime = {
  auth: {
    api: {
      getSession: (input: {
        headers: Headers
      }) => Promise<{
        user: { role?: unknown; name?: string; email?: string }
      } | null>
    }
  }
}

export type AdminPageProps = {
  runtime: AdminRuntime
  path?: string
  signInPath?: string
}

export async function AdminPage({
  runtime,
  path = "/",
  signInPath = "/",
}: AdminPageProps): Promise<ReactNode> {
  const requestHeaders = await headers()
  const session = await runtime.auth.api.getSession({ headers: requestHeaders })
  const access = resolveAdminAccess(session?.user ?? null)

  if (access === "unauthenticated") redirect(signInPath)
  if (access === "forbidden") return <AccessDenied />

  return (
    <AdminDashboard name={session?.user.name ?? "Administrator"} path={path} />
  )
}

function AdminDashboard({ name, path }: { name: string; path: string }) {
  return (
    <main className="deesse-admin-frame">
      <aside className="deesse-admin-sidebar" aria-label="Admin navigation">
        <a className="deesse-admin-brand" href="/admin">
          DeesseJS Admin
        </a>
        <a
          className="deesse-admin-nav-link"
          aria-current={path === "/" ? "page" : undefined}
          href="/admin"
        >
          Overview
        </a>
      </aside>
      <section className="deesse-admin-content">
        <header className="deesse-admin-header">
          <div>
            <p className="deesse-admin-eyebrow">Dashboard</p>
            <h1>Welcome, {name}</h1>
          </div>
          <span className="deesse-admin-account">
            Signed in as an administrator
          </span>
        </header>
        <div className="deesse-admin-empty-state">
          <p className="deesse-admin-eyebrow">Your workspace</p>
          <h2>Your admin dashboard is ready</h2>
          <p>Admin pages from your Deesse plugins will appear here.</p>
        </div>
      </section>
    </main>
  )
}

function AccessDenied() {
  return (
    <main className="deesse-admin-message">
      <section>
        <p className="deesse-admin-eyebrow">403</p>
        <h1>Admin access required</h1>
        <p>Your account is signed in but does not have the admin role.</p>
        <a href="/">Return to the application</a>
      </section>
    </main>
  )
}

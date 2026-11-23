import Link from "next/link"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import type { ComponentType, ReactNode } from "react"
import { normalizeAdminPath, resolveAdminPage, type AdminConfig, type AdminPageContext } from "./index.js"
import { resolveAdminAccess } from "./access.js"

type AdminSession = {
  session: object
  user: { id: string; email: string; role?: unknown; name?: string }
}

type AdminRuntime = {
  auth: {
    api: {
      getSession: (input: { headers: Headers }) => Promise<AdminSession | null>
    }
  }
}

export type AdminPageProps = {
  runtime: AdminRuntime
  config: AdminConfig
  path?: string
  signInPath?: string
}

export async function AdminPage({
  runtime,
  config,
  path = "/",
  signInPath = "/",
}: AdminPageProps): Promise<ReactNode> {
  const requestHeaders = await headers()
  const session = await runtime.auth.api.getSession({ headers: requestHeaders })
  const access = resolveAdminAccess(session?.user ?? null)

  if (access === "unauthenticated") redirect(signInPath)
  if (access === "forbidden" || !session) return <AccessDenied />

  const currentPath = normalizeAdminPath(path)
  const page = resolveAdminPage(config, currentPath)
  if (!page) notFound()

  if (page.authorize) {
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost"
    const protocol = requestHeaders.get("x-forwarded-proto") ?? "http"
    const context: AdminPageContext = {
      user: session.user,
      session: session.session,
      request: new Request(`${protocol}://${host}/admin/${currentPath}`, { headers: requestHeaders }),
      params: {},
    }
    const pageAccess = await page.authorize(context)
    if (pageAccess === "unauthenticated") redirect(signInPath)
    if (pageAccess === "forbidden") return <AccessDenied />
  }

  return (
    <AdminDashboard
      name={session.user.name ?? "Administrator"}
      path={currentPath}
      pages={config.pages}
      title={page.title}
      component={page.component}
    />
  )
}

function AdminDashboard({
  name,
  path,
  pages,
  title,
  component: PageComponent,
}: {
  name: string
  path: string
  pages: AdminConfig["pages"]
  title: string
  component: unknown
}) {
  const Page = PageComponent as ComponentType
  const orderedPages = pages.toSorted((left, right) => (left.order ?? 0) - (right.order ?? 0))

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col gap-8 border-r border-border bg-card p-5" aria-label="Admin navigation">
        <Link className="text-sm font-semibold tracking-tight text-card-foreground" href="/admin">
          DeesseJS Admin
        </Link>
        <nav className="grid gap-1">
          {orderedPages.map((page) => {
            const href = page.path ? `/admin/${page.path}` : "/admin"
            const active = page.path === path
            return (
              <Link
                key={page.path}
                className={`rounded-md px-3 py-2 text-sm ${active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                aria-current={active ? "page" : undefined}
                href={href}
              >
                {page.title}
              </Link>
            )
          })}
        </nav>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
          <span className="text-sm text-muted-foreground">Signed in as {name}</span>
        </header>
        <Page />
      </section>
    </main>
  )
}

function AccessDenied() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <section className="grid max-w-lg gap-3 rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">403</p>
        <h1 className="text-2xl font-semibold tracking-tight">Admin access required</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Your account is signed in but does not have the admin role.
        </p>
        <Link className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline" href="/">
          Return to the application
        </Link>
      </section>
    </main>
  )
}

import Link from "next/link"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import type { ComponentType, ReactNode } from "react"
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@deessejs/ui"
import { admin, normalizeAdminPath, resolveAdminPage, type AdminPageContext, type AdminPluginOutput } from "./index.js"
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
  plugins: { get(id: typeof admin.definition.id): AdminPluginOutput | undefined }
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
  const adminOutput = runtime.plugins.get(admin.definition.id)
  if (!adminOutput || !Array.isArray(adminOutput.pages)) {
    throw new Error(`AdminPage requires the ${admin.definition.id} plugin in the Deesse runtime.`)
  }

  const requestHeaders = await headers()
  const session = await runtime.auth.api.getSession({ headers: requestHeaders })
  const access = resolveAdminAccess(session?.user ?? null)

  if (access === "unauthenticated") redirect(signInPath)
  if (access === "forbidden" || !session) return <AccessDenied />

  const currentPath = normalizeAdminPath(path)
  const page = resolveAdminPage(adminOutput.pages, currentPath)
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
      pages={adminOutput.pages}
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
  pages: AdminPluginOutput["pages"]
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
            <Badge variant="outline">Dashboard</Badge>
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
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Badge variant="outline" className="w-fit">403</Badge>
          <CardTitle className="text-2xl">Admin access required</CardTitle>
          <CardDescription>Your account is signed in but does not have the admin role.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href="/">
            Return to the application
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}

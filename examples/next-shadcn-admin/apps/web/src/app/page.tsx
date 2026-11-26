import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@deesse-admin-example/ui/components/card"
import { AuthConsole } from "@/components/auth-console"

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl content-start gap-8 px-6 py-16">
      <header className="grid gap-3">
        <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          DeesseJS example
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Next.js host, shared framework runtime
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
          This page calls the same Deesse instance that serves Better Auth and
          the Blog API.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Manage Markdown posts from the administrator dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sign in here, then manage Markdown posts from the administrator dashboard.
          </p>
          <div className="mt-4"><AuthConsole /></div>
          <p className="mt-6 text-sm text-muted-foreground">
            <a href="/admin">Open the admin dashboard</a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

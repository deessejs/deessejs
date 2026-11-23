import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@deesse-admin-example/ui/components/card"
import { PostsConsole } from "@/components/posts-console"

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
          the typed posts API.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Try the runtime</CardTitle>
          <CardDescription>
            Sign up, check a username, inspect your session, and create a post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostsConsole />
          <p className="mt-6 text-sm text-muted-foreground">
            <a href="/admin">Open the admin dashboard</a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

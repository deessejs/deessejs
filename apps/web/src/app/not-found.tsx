import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function NotFound() {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-6xl font-bold text-muted-foreground/30">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Go home</Link>
      </Button>
    </section>
  )
}

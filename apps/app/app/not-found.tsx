/**
 * Root not-found — ADR-031 Decision #3.
 *
 * Self-contained shell because the root level renders when no
 * `[locale]` segment matches the URL. No cross-app chrome; the auth
 * app's full chrome lives under `[locale]/`.
 */
import Link from "next/link"

import "@workspace/ui/globals.css"

import { Geist, Geist_Mono } from "next/font/google"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootNotFound() {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
        <h1 className="text-6xl font-semibold">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          This page doesn't exist.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Back to home</Link>
        </Button>
      </body>
    </html>
  )
}

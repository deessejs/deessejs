import { Geist, Geist_Mono } from "next/font/google"
import { MotionConfig } from "motion/react"

import "@workspace/ui/globals.css"
import { APP_CONFIG } from "@workspace/ui/lib/config"
import { AppProviders } from "@/components/providers"
import { AppFooter } from "@/components/footers/app-footer"
import { SiteHeader } from "@/components/headers/site-header"
import { GlobalSearchDialog } from "@/components/search/global-search-dialog"
import { GlobalSearchShortcut } from "@/components/search/global-search-shortcut"
import { CookieConsent } from "@workspace/cookies"
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  // ADR-028 Decision #6: pin the metadata base to the marketing
  // canonical so OG / canonical URLs resolve against `deessejs.com`
  // on every deployment (including Vercel previews) instead of
  // falling back to Next.js's built-in `VERCEL_URL` heuristic.
  metadataBase: new URL(APP_CONFIG.webURL),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <MotionConfig reducedMotion="user">
          <AppProviders>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <AppFooter />
              <CookieConsent />
              <Toaster />
            </div>
            <GlobalSearchShortcut />
            <GlobalSearchDialog />
          </AppProviders>
        </MotionConfig>
      </body>
    </html>
  )
}

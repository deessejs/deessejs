import { Geist, Geist_Mono } from "next/font/google"
import { MotionConfig } from "motion/react"

import "@workspace/ui/globals.css"
import { APP_CONFIG } from "@/lib/app-config"
import { AppProviders } from "@/components/providers"
import { AppFooter } from "@/components/footers/app-footer"
import { SiteHeaderServer } from "@/components/headers/site-header-server"
import { GlobalSearchDialog } from "@/components/search/global-search-dialog"
import { GlobalSearchShortcut } from "@/components/search/global-search-shortcut"
import { CookieConsent } from "@workspace/cookies"
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from "@/lib/seo/organization"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  // ADR-029 Decision #6: pin the metadata base to the marketing
  // canonical so OG / canonical URLs resolve against `deessejs.com`
  // on every deployment (including Vercel previews) instead of
  // falling back to Next.js's built-in `VERCEL_URL` heuristic.
  metadataBase: new URL(APP_CONFIG.url),
  applicationName: APP_CONFIG.name,
  authors: [{ name: APP_CONFIG.name }],
  generator: "Next.js",
  keywords: [
    "DeesseJS",
    "SaaS templates",
    "Next.js",
    "better-auth",
    "Drizzle",
    "agent stack",
  ],
  openGraph: {
    type: "website",
    siteName: APP_CONFIG.name,
    locale: "en_US",
    url: APP_CONFIG.url,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
  },
  alternates: {
    canonical: APP_CONFIG.url,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    // Multi-resolution coverage. The SVG is the source of truth;
    // the favicon.ico and apple-icon.png are generated from it by
    // apps/web/scripts/generate-favicons.mjs. Next.js auto-injects
    // the right <link rel="..."> tags for each.
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationJsonLd = JSON.stringify(buildOrganizationJsonLd())
  const webSiteJsonLd = JSON.stringify(buildWebSiteJsonLd())

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: webSiteJsonLd }}
        />
        <MotionConfig reducedMotion="user">
          <AppProviders>
            <div className="flex min-h-screen flex-col">
              <SiteHeaderServer />
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

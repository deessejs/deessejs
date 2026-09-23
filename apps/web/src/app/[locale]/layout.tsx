/**
 * Root [locale] layout for apps/web — ADR-031 Decision #3.
 *
 * This is the only place in the app tree that renders `<html>`,
 * `<body>`, and `<NextIntlClientProvider>`. The previous root
 * `layout.tsx` was deleted; per the App Router invariant (Next 15+),
 * a parent layout has no access to a child segment's `params`, so the
 * HTML wrapper must live in the deepest segment that owns the locale
 * param.
 *
 * The layout also hosts:
 *   - The `MotionConfig` provider (apps/web-only)
 *   - The JSON-LD scripts (`buildOrganizationJsonLd`,
 *     `buildWebSiteJsonLd`) — per-locale `inLanguage` is derived
 *     from `locale` via `availableLanguageLabel(locale)` from
 *     `@workspace/i18n`.
 *   - The `SiteHeaderServer`, `AppFooter`, `CookieConsent`,
 *     `Toaster`, `GlobalSearchShortcut`, `GlobalSearchDialog`
 *     mounts that were in the previous root layout.
 *
 * `generateStaticParams` returns the locale list so Next pre-renders
 * a layout instance per locale at build time. Without this, the
 * `[locale]` segment falls back to dynamic rendering, which
 * defeats the existing ISR surface.
 *
 * `await params` is required (Next 15+): `params` is a Promise.
 */
import "@workspace/ui/globals.css"
import { MotionConfig } from "motion/react"

import { headers } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"

import {
  availableLanguageLabel,
  defaultLocale,
  isSupportedLocale,
  routing,
} from "@workspace/i18n"
import type { Bcp47 } from "@workspace/i18n"

import { Geist, Geist_Mono } from "next/font/google"
import { notFound } from "next/navigation"

import { APP_CONFIG } from "@/lib/app-config"
import { AppProviders } from "@/components/providers"
import { GlobalSearchDialog } from "@/components/search/global-search-dialog"
import { GlobalSearchShortcut } from "@/components/search/global-search-shortcut"
import { SiteHeaderServer } from "@/components/headers/site-header-server"
import { AppFooter } from "@/components/footers/app-footer"
import { CookieConsent } from "@workspace/cookies"
import { Toaster } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/organization"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // The root layout metadata is EN-default (legacy stable state) until
  // the per-page metadata in ADR-031 §10 (decision #10) ships. The
  // `metadataBase` is read from the original root layout to keep the
  // OpenGraph behaviour unchanged while pages under `[locale]/` ship
  // their own `alternates.languages` and `openGraph.locale`.
  return {
    metadataBase: new URL(APP_CONFIG.url),
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    alternates: {
      canonical: APP_CONFIG.url,
    },
    openGraph: {
      type: "website",
      siteName: APP_CONFIG.name,
      locale:
        locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : "en_US",
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  // `availableLanguageLabel` maps the BCP-47 code to the JSON-LD
  // display string ("English" / "Français"). The schema.org
  // `availableLanguage` field expects the language name in English.
  const availableLanguage = [
    availableLanguageLabel("en" as Bcp47),
    availableLanguageLabel("fr" as Bcp47),
  ]
  const orgJsonLd = JSON.stringify(
    buildOrganizationJsonLd(availableLanguage),
  )
  const webSiteJsonLd = JSON.stringify(
    buildWebSiteJsonLd(locale as Bcp47, locale),
  )

  const headerStore = headers()
  // Suppress hydration warnings from third-party browser extensions
  // (LastPass, Bitwarden, Grammarly).
  void headerStore

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: orgJsonLd }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: webSiteJsonLd }}
        />
        <MotionConfig reducedMotion="user">
          <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone={defaultLocale() === locale ? "UTC" : undefined}
          >
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
          </NextIntlClientProvider>
        </MotionConfig>
      </body>
    </html>
  )
}

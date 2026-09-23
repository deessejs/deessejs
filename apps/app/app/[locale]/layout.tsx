/**
 * Root [locale] layout for apps/app — ADR-031 Decision #3.
 *
 * Same shape as apps/web/src/app/[locale]/layout.tsx but without the
 * marketing-site chrome (no `SiteHeaderServer`, `AppFooter`,
 * `CookieConsent`, search dialog). The auth-app chrome (the left
 * rail `<SettingsRail>` for `/settings/*`, the `<NavUser>` in the
 * header) is per-route and is wrapped by the `(protected)/layout.tsx`
 * or `(unprotected)/(auth)/layout.tsx` under `[locale]/`.
 *
 * The `<NextIntlClientProvider>` mounts here, exactly once — the
 * canonical stack of providers (QueryClient > TooltipProvider >
 * ThemeProvider > NextIntlClientProvider) lives in
 * `components/providers/index.tsx` per ADR-031 Decision #4.
 */
import "@workspace/ui/globals.css"

import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"

import { isSupportedLocale, routing, type Bcp47 } from "@workspace/i18n"

import { APP_CONFIG, APP_NAME } from "@/lib/app-config"
import { AppProviders } from "@/components/providers"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata() {
  return {
    title: APP_NAME,
    description: APP_CONFIG.description,
    alternates: { canonical: APP_CONFIG.appURL },
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
  setRequestLocale(locale as Bcp47)
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

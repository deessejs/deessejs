"use client"

import { useEffect, type ComponentProps } from "react"
import { usePathname } from "next/navigation"
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next"
import { track } from "@vercel/analytics"
import { SpeedInsights } from "@vercel/speed-insights/react"
import { clientEnv } from "@workspace/env/client"
import {
  CookieConsent,
  CookiePreferencesButton,
  rehydrateCookieConsent,
  useCookieConsentStore,
} from "@workspace/cookies"

const STATIC_APP_ROUTES = new Set([
  "account",
  "admin",
  "api",
  "cookies",
  "device",
  "forgot-password",
  "home",
  "login",
  "no-organization",
  "reset-password",
  "signup",
  "verify-email",
])

type AnalyticsPropertyValue = string | number | boolean
type AnalyticsProperties = Record<string, AnalyticsPropertyValue>
type SpeedInsightsBeforeSend = NonNullable<
  ComponentProps<typeof SpeedInsights>["beforeSend"]
>
type SpeedInsightsEvent = Parameters<SpeedInsightsBeforeSend>[0]

function sanitizePath(pathname: string, isProductApp: boolean) {
  const path = pathname.split(/[?#]/, 1)[0] || "/"
  if (isProductApp && (path === "/device" || path === "/device/")) return null

  const segments = path.split("/")
  const firstSegment = segments[1]
  if (
    isProductApp &&
    firstSegment &&
    !STATIC_APP_ROUTES.has(firstSegment) &&
    segments.length > 1
  ) {
    segments[1] = "[organization_slug]"
  }

  return segments.join("/") || "/"
}

function sanitizeAnalyticsEvent(
  event: BeforeSendEvent,
  isProductApp: boolean
): BeforeSendEvent | null {
  if (!useCookieConsentStore.getState().consent.analytics) return null

  try {
    const url = new URL(event.url, window.location.origin)
    const pathname = sanitizePath(url.pathname, isProductApp)
    if (!pathname) return null
    url.pathname = pathname
    url.search = ""
    url.hash = ""
    return { ...event, url: url.toString() }
  } catch {
    return null
  }
}

function sanitizeSpeedInsightsEvent(
  event: SpeedInsightsEvent,
  isProductApp: boolean
) {
  if (!useCookieConsentStore.getState().consent.analytics) return null

  try {
    const url = new URL(event.url, window.location.origin)
    const pathname = sanitizePath(url.pathname, isProductApp)
    if (!pathname) return null
    url.pathname = pathname
    url.search = ""
    url.hash = ""
    const route = event.route
      ? sanitizePath(event.route, isProductApp)
      : pathname
    if (!route) return null
    return { ...event, url: url.toString(), route }
  } catch {
    return null
  }
}

function sanitizeEventProperties(
  properties: AnalyticsProperties = {}
) {
  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key]) => !/(email|user|organization|token|code|session|identity)/i.test(key)
    )
  )
}

function ConsentGatedVercelScripts({ isProductApp }: { isProductApp: boolean }) {
  const hasHydrated = useCookieConsentStore((state) => state.hasHydrated)
  const analyticsAllowed = useCookieConsentStore((state) => state.consent.analytics)
  const pathname = usePathname()

  useEffect(() => {
    rehydrateCookieConsent()
  }, [])

  if (
    !hasHydrated ||
    !analyticsAllowed ||
    clientEnv.NEXT_PUBLIC_ANALYTICS_PROVIDER !== "vercel"
  ) {
    return null
  }

  const safePath = sanitizePath(pathname ?? "/", isProductApp)
  return (
    <>
      <Analytics
        dsn={clientEnv.NEXT_PUBLIC_VERCEL_ANALYTICS_DSN}
        beforeSend={(event) => sanitizeAnalyticsEvent(event, isProductApp)}
      />
      {safePath ? (
        <SpeedInsights
          framework="next"
          route={safePath}
          beforeSend={(event) =>
            sanitizeSpeedInsightsEvent(event, isProductApp)
          }
        />
      ) : null}
    </>
  )
}

/**
 * Provider-agnostic event API. Vercel Web Analytics currently supports
 * custom capture; page views are automatic and identify/reset intentionally
 * remain no-ops to avoid sending user identifiers.
 */
export const analytics = {
  capture(
    name: string,
    properties?: AnalyticsProperties
  ) {
    if (
      clientEnv.NEXT_PUBLIC_ANALYTICS_PROVIDER !== "vercel" ||
      !useCookieConsentStore.getState().consent.analytics
    ) {
      return
    }

    try {
      void Promise.resolve(track(name, sanitizeEventProperties(properties))).catch(
        () => undefined
      )
    } catch {
      // Analytics is best-effort and must never affect the application.
    }
  },
  identify(_userId: string, _traits?: AnalyticsProperties) {},
  page(_path?: string) {},
  reset() {},
}

export function AnalyticsConsent({
  isProductApp = false,
  showPreferences = false,
}: {
  isProductApp?: boolean
  showPreferences?: boolean
}) {
  return (
    <>
      <ConsentGatedVercelScripts isProductApp={isProductApp} />
      <CookieConsent />
      {showPreferences ? (
        <div className="fixed bottom-4 left-4 z-40 rounded-md border bg-background/90 px-3 py-2 shadow-sm">
          <CookiePreferencesButton />
        </div>
      ) : null}
    </>
  )
}

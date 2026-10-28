"use client"

import { useEffect } from "react"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import {
  CookieConsent,
  CookiePreferencesButton,
  rehydrateCookieConsent,
  useCookieConsentStore,
} from "@workspace/cookies"

function ConsentGatedVercelScripts() {
  const hasHydrated = useCookieConsentStore((state) => state.hasHydrated)
  const analyticsAllowed = useCookieConsentStore((state) => state.consent.analytics)

  useEffect(() => {
    rehydrateCookieConsent()
  }, [])

  if (!hasHydrated || !analyticsAllowed) return null
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}

/** Mount once in each app's root provider/layout. */
export function AnalyticsConsent({ showPreferences = false }: { showPreferences?: boolean }) {
  return (
    <>
      <ConsentGatedVercelScripts />
      <CookieConsent />
      {showPreferences ? (
        <div className="fixed bottom-4 left-4 z-40 rounded-md border bg-background/90 px-3 py-2 shadow-sm">
          <CookiePreferencesButton />
        </div>
      ) : null}
    </>
  )
}

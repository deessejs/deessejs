"use client"

import { useCookieConsentStore } from "../store/cookie-consent"

export function CookiePreferencesButton() {
  const openPreferences = useCookieConsentStore((s) => s.openPreferences)

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Cookie Preferences
    </button>
  )
}

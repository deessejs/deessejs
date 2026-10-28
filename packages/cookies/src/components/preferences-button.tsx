"use client"

import { useCookieConsentStore } from "../store/cookie-consent"
import { Button } from "@workspace/ui/components/button"

export function CookiePreferencesButton() {
  const openPreferences = useCookieConsentStore((s) => s.openPreferences)

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={openPreferences}
      className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Cookie Preferences
    </Button>
  )
}

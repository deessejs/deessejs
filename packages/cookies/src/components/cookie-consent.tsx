"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Cookie, Settings, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Switch } from "@workspace/ui/components/switch"
import { useCookieConsentStore, rehydrateCookieConsent } from "../store/cookie-consent"

export function CookieConsent() {
  const {
    consent,
    hasDecided,
    hasHydrated,
    acceptAll,
    declineAll,
    setCategory,
    preferencesOpen,
    setPreferencesOpen,
  } = useCookieConsentStore()

  // Rehydrate from localStorage on mount — prevents SSR/CSR mismatch
  useEffect(() => {
    rehydrateCookieConsent()
  }, [])

  // Don't render until hydrated
  if (!hasHydrated) return null

  // Preferences modal — can be opened from the footer even after initial decision
  if (preferencesOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className="absolute inset-0 cursor-pointer bg-background/80 backdrop-blur-sm"
          onClick={() => setPreferencesOpen(false)}
          aria-hidden="true"
        />
        <Card className="relative z-10 w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Settings className="size-4 text-muted-foreground" />
              <CardTitle className="text-lg">Cookie Preferences</CardTitle>
            </div>
            <button
              onClick={() => setPreferencesOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Close preferences"
            >
              <X className="size-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription>
              Manage your cookie preferences. Strictly necessary cookies cannot be disabled.{" "}
              <Link href="/cookies" className="underline underline-offset-2 hover:text-foreground">
                Learn more
              </Link>
            </CardDescription>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Strictly Necessary</p>
                  <p className="text-xs text-muted-foreground">
                    Required for the website to function properly.
                  </p>
                </div>
                <Switch checked disabled />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                <Switch
                  checked={consent.analytics}
                  onCheckedChange={(checked) => setCategory("analytics", checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Marketing</p>
                  <p className="text-xs text-muted-foreground">
                    Used to deliver personalized advertisements.
                  </p>
                </div>
                <Switch
                  checked={consent.marketing}
                  onCheckedChange={(checked) => setCategory("marketing", checked)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={declineAll} className="flex-1">
                Decline All
              </Button>
              <Button size="sm" onClick={acceptAll} className="flex-1">
                Accept All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Banner — only shown on first visit (hasDecided is false)
  if (!hasDecided) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Cookie className="size-5" />
              <CardTitle className="text-lg">We use cookies</CardTitle>
            </div>
            <CardDescription>
              We use cookies to enhance your browsing experience and analyze our traffic.{" "}
              <Link href="/cookies" className="underline underline-offset-2 hover:text-foreground">
                Learn more
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="sm" onClick={declineAll} className="flex-1">
              Decline
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreferencesOpen(true)}
              className="flex-1"
            >
              Customize
            </Button>
            <Button size="sm" onClick={acceptAll} className="flex-1">
              Accept All
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

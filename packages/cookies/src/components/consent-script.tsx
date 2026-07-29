"use client"

import Script from "next/script"
import type { ScriptProps } from "next/script"
import { useCookieConsentStore } from "../store/cookie-consent"
import type { ConsentCategory } from "../types"

interface ConsentScriptProps extends Omit<ScriptProps, "strategy"> {
  category: ConsentCategory
}

export function ConsentScript({ category, ...props }: ConsentScriptProps) {
  const hasConsent = useCookieConsentStore((s) => s.consent[category])

  if (!hasConsent) return null

  return <Script {...props} strategy="lazyOnload" />
}

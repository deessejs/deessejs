/** Categories of cookies that require user consent under GDPR/ePrivacy. */
export type ConsentCategory = "functional" | "analytics" | "marketing"

export interface CookieConsentData {
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export interface CookieConsentState {
  consent: CookieConsentData
  hasDecided: boolean
  hasHydrated: boolean
  preferencesOpen: boolean
}

export interface CookieConsentActions {
  acceptAll: () => void
  declineAll: () => void
  setCategory: (cat: ConsentCategory, value: boolean) => void
  setPreferencesOpen: (open: boolean) => void
  openPreferences: () => void
  setHasHydrated: (value: boolean) => void
}

export type CookieConsentStore = CookieConsentState & CookieConsentActions

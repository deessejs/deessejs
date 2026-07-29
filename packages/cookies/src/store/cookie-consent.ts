import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CookieConsentData } from "../types"

const STORAGE_KEY = "cookie_consent"
const CONSENT_VERSION = 1

const DEFAULT_CONSENT: CookieConsentData = {
  functional: true,
  analytics: false,
  marketing: false,
}

export const useCookieConsentStore = create<import("../types").CookieConsentStore>()(
  persist(
    (set, get) => ({
      consent: DEFAULT_CONSENT,
      hasDecided: false,
      hasHydrated: false,
      preferencesOpen: false,

      acceptAll: () => {
        const full: CookieConsentData = { functional: true, analytics: true, marketing: true }
        set({ consent: full, hasDecided: true })
      },

      declineAll: () => {
        const minimal: CookieConsentData = { functional: true, analytics: false, marketing: false }
        set({ consent: minimal, hasDecided: true })
      },

      setCategory: (cat, value) => {
        const updated = { ...get().consent, [cat]: value }
        set({ consent: updated, hasDecided: true })
      },

      setPreferencesOpen: (open) => set({ preferencesOpen: open }),

      openPreferences: () => set({ preferencesOpen: true }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        consent: state.consent,
        hasDecided: state.hasDecided,
        version: CONSENT_VERSION,
      }),
    }
  )
)

export function rehydrateCookieConsent() {
  useCookieConsentStore.persist.rehydrate()
}

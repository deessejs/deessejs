"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

/**
 * The two billing cadences offered for Professional and Agency.
 * Community is free and Enterprise is custom; neither is affected by
 * the cadence state.
 */
export type PricingCadence = "monthly" | "annual"

type PricingCadenceContextValue = {
  cadence: PricingCadence
  setCadence: (c: PricingCadence) => void
}

const PricingCadenceContext = createContext<PricingCadenceContextValue | null>(
  null
)

export function PricingCadenceProvider({ children }: { children: ReactNode }) {
  const [cadence, setCadence] = useState<PricingCadence>("monthly")
  const value = useMemo(() => ({ cadence, setCadence }), [cadence])
  return (
    <PricingCadenceContext.Provider value={value}>
      {children}
    </PricingCadenceContext.Provider>
  )
}

export function usePricingCadence(): PricingCadenceContextValue {
  const ctx = useContext(PricingCadenceContext)
  if (!ctx) {
    throw new Error(
      "usePricingCadence must be used inside <PricingCadenceProvider>"
    )
  }
  return ctx
}

"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type PricingCadence = "lifetime" | "subscription"

type PricingCadenceContextValue = {
  cadence: PricingCadence
  setCadence: (c: PricingCadence) => void
}

const PricingCadenceContext = createContext<PricingCadenceContextValue | null>(
  null
)

export function PricingCadenceProvider({ children }: { children: ReactNode }) {
  const [cadence, setCadence] = useState<PricingCadence>("lifetime")
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

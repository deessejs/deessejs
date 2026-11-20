"use client"

import { useEffect, useState } from "react"

export type AuthPhase = "form" | "loading" | "success"

export function useAuthFlowPhase(formHoldMs: number, loadingMs: number) {
  const [phase, setPhase] = useState<AuthPhase>("form")
  useEffect(() => {
    const formTimer = window.setTimeout(() => setPhase("loading"), formHoldMs)
    const loadingTimer = window.setTimeout(() => setPhase("success"), formHoldMs + loadingMs)
    return () => { window.clearTimeout(formTimer); window.clearTimeout(loadingTimer) }
  }, [formHoldMs, loadingMs])
  return phase
}

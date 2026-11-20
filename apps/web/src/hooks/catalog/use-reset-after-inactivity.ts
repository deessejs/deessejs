"use client"

import { useCallback, useEffect, useRef } from "react"

export function useResetAfterInactivity(reset: () => void, delay: number) {
  const timeout = useRef<number | null>(null)
  useEffect(() => () => {
    if (timeout.current !== null) window.clearTimeout(timeout.current)
  }, [])

  return useCallback(() => {
    if (timeout.current !== null) window.clearTimeout(timeout.current)
    timeout.current = window.setTimeout(reset, delay)
  }, [delay, reset])
}

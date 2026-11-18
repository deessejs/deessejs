"use client"

import { useEffect } from "react"

export function useReportError(error: Error & { digest?: string }) {
  useEffect(() => {
    console.error(error)
  }, [error])
}

"use client"

import * as React from "react"
import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query"

/**
 * App-wide React Query provider.
 *
 * The browser reuses one QueryClient across route changes, while each server
 * render gets its own client. Query behavior remains configurable per query
 * because authenticated requests can have different cache and retry needs.
 */
function makeQueryClient() {
  return new QueryClient()
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client so each
    // request does not share state.
    return makeQueryClient()
  }
  // Browser: make once and reuse across re-renders.
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  )
}

export { QueryClientProvider }

"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from "@tanstack/react-query"

/**
 * App-wide React Query provider (ADR-020).
 *
 * The QueryClient is created once per browser context (the
 * lazy initializer passed to `useState`) so a re-render of
 * the root layout does not invalidate the cache. The default
 * options match TanStack Query 5.x defaults; tighter settings
 * (staleTime, refetchOnWindowFocus off) are not enforced here
 * so a future consumer can opt in per-query without bumping
 * the global default.
 */
function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// Default retry=false on the device claim query
				// (in device-form.tsx) overrides this for the
				// device flow; everything else keeps the
				// library default.
			},
		},
	})
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

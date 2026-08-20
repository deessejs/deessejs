"use client"

import type { ReactNode } from "react"
import { QueryClientProvider } from "./query-client-provider"
import { ThemeProvider } from "./theme-provider"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

/**
 * Root provider stack for `apps/app`.
 *
 * Order matters:
 *   1. QueryClientProvider is outermost so every other
 *      provider and every consumer can read from the cache.
 *   2. ThemeProvider then owns the document-level class
 *      that ThemeHotkey toggles, and the rest of the tree
 *      can read useTheme().
 *   3. TooltipProvider last — tooltips are leaf-level; a
 *      tooltip inside the theme provider still resolves
 *      the theme via context.
 *
 * Adding a new root provider (e.g. a future i18n provider,
 * or an ErrorBoundary) goes in this file, not in
 * `app/layout.tsx`. Layout stays a Server Component that
 * renders one client island.
 */
export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider>
			<ThemeProvider>
				<TooltipProvider>{children}</TooltipProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}

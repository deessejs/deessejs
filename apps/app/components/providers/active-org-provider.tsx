"use client"

import { createContext, useContext } from "react"

export type ActiveOrg = {
	id: string
	slug: string
	name: string
	logo?: string | null
	role: "owner" | "admin" | "member"
}

const ActiveOrgContext = createContext<ActiveOrg | null>(null)

type ActiveOrgProviderProps = {
	/** Active org resolved server-side. The (protected) layout
	 *  rebuilds the Provider with `key={pathname}` so a navigation
	 *  resets the state without any useEffect dance. */
	initialActiveOrg: ActiveOrg | null
	children: React.ReactNode
}

/**
 * Provider for the active organization. The Server Component
 * layout fetches the current org via auth.api.getActiveOrganization
 * and hands the result here. Consumers (TeamSwitcher, breadcrumbs)
 * read it through `useActiveOrg()`.
 *
 * The `key={pathname}` trick in the layout guarantees the state
 * resets on every navigation — the Provider remounts, so we
 * never read a stale value from a previous route.
 */
export function ActiveOrgProvider({
	initialActiveOrg,
	children,
}: ActiveOrgProviderProps) {
	return (
		<ActiveOrgContext.Provider value={initialActiveOrg}>
			{children}
		</ActiveOrgContext.Provider>
	)
}

/**
 * Read the active organization from the surrounding Provider.
 * Returns null when no org is active (e.g. mid-onboarding) so the
 * caller can render a placeholder.
 */
export function useActiveOrg(): ActiveOrg | null {
	return useContext(ActiveOrgContext)
}

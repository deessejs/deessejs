/**
 * Top-level protected layout. RFC-001 §8 moved the chrome to the
 * per-organization layout at `app/(protected)/[organization_slug]/
 * layout.tsx`. Account-scoped routes under `/account/*` keep this
 * minimal wrapper for now (a future PR can introduce an
 * account-scoped layout if/when the account settings need their
 * own chrome).
 */
export default function ProtectedLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <>{children}</>
}

import { AuthContainer } from "@/components/auth"
import { DeviceForm } from "@/components/auth/device-form"
import { userCodeSchema } from "@/components/auth/schemas"

/**
 * Device authorization verification page (ADR-020).
 *
 * The CLI's `deesse auth login` opens the browser to this
 * page with the issued `user_code` in the query string. The
 * page is reachable without a session (a fresh CLI user may
 * have never signed in to the web app), and the device flow
 * is itself a sign-in flow — the user lands here, signs in
 * via the existing flow, claims the code, approves or denies.
 *
 * This page is a thin Server Component:
 *   1. Read `searchParams.user_code` (Next 16 async prop).
 *   2. Validate the shape with `userCodeSchema`. An invalid
 *      or missing code is treated the same as an expired
 *      code: the user sees the same "Expired" panel as for a
 *      legitimately-expired device-code record. There is no
 *      point telling an unauthenticated visitor that the URL
 *      was bad — they cannot act on the information.
 *   3. Render the DeviceForm component, which owns the
 *      4-state machine (TanStack Query: useQuery for the read
 *      of `authClient.device(...)`, useMutation for approve /
 *      deny).
 *
 * The page is added to the (unprotected) (auth) sub-group
 * alongside login, signup, forgot-password, reset-password,
 * and verify-email. It inherits the centered single-column
 * `AuthContainer` layout from `(auth)/layout.tsx`.
 *
 * Per ADR-020, this page does NOT gate on `emailVerified`.
 * The verification gate that protects `/home` and `/settings`
 * (`docs/guides/better-auth/pitfalls.md` §3) is unchanged; the
 * device page is not a protected prefix.
 */
export default async function DevicePage({
	searchParams,
}: {
	// The page reads exactly one query param, `user_code`. The
	// Next.js type for searchParams is a generic Record; we
	// narrow it here to the precise shape the page accepts, so
	// future readers see the contract without having to read
	// the body. The runtime shape is still string | string[] |
	// undefined (a query string can appear twice); the
	// userCodeSchema.safeParse below handles all three cases.
	searchParams: Promise<{ user_code: string | string[] | undefined }>
}) {
	const params = await searchParams
	const rawCode = Array.isArray(params.user_code)
		? params.user_code[0]
		: params.user_code
	const parsed = userCodeSchema.safeParse(rawCode)

	// Narrow the type: when `success` is true, `data` is a string
	// (the validated user_code). When false, we render the
	// "Expired" panel and never hand a value to DeviceForm.
	const userCode = parsed.success ? parsed.data : null

	return (
		<AuthContainer.Root>
			<AuthContainer.Header
				title="Authorize your device"
				description="The DeesseJS CLI is requesting permission to act on your behalf. Approve to continue, or deny to cancel."
			/>
			<AuthContainer.Content>
				<DeviceForm userCode={userCode} />
			</AuthContainer.Content>
		</AuthContainer.Root>
	)
}

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"

/**
 * Device-flow hooks (ADR-020).
 *
 * `useDeviceClaim` — read the current claim status of a user_code
 *   (useQuery against authClient.device) plus the two mutations
 *   (approve, deny) that resolve a pending code. The component
 *   consumes the returned state and renders the right panel; all
 *   async state lives in the React Query cache.
 *
 * `useDeviceErrorMessage` — pure helper that maps the Better Auth
 *   error envelope ({ error: "invalid_request" | "expired_token" | ...,
 *   error_description: string }) to a user-facing string. The codes
 *   are stable per Better Auth 1.6.x (this plugin's
 *   `error-codes.mjs`). The function is not a hook in the sense of
 *   React hooks (no state), but it lives in the hooks folder
 *   because it is conceptually part of the device-flow surface
 *   and only meaningful inside a hook consumer (the form's
 *   onError callbacks).
 *
 * The hooks folder is at the same level as `components/` and
 * `lib/` per the repo's folder layout. Co-locating the
 * orchestration with the call site (rather than in `lib/`)
 * keeps the dependency surface tight: `lib/` stays free of
 * `@tanstack/react-query` and `better-auth/react`, and the
 * pages/components consumers do not have to thread the
 * provider tree through `lib/`.
 */

type DeviceClaimStatus = "pending" | "approved" | "denied"

interface DeviceClaim {
	user_code: string
	status: DeviceClaimStatus
}

function getErrorDescription(
	error: { error_description?: string } | null | undefined,
	fallback: string,
): string {
	return error?.error_description ?? fallback
}

export function useDeviceClaim(userCode: string | null) {
	const queryClient = useQueryClient()

	const claim = useQuery({
		queryKey: ["device", "claim", userCode],
		queryFn: async (): Promise<DeviceClaim> => {
			if (!userCode) throw new Error("missing user_code")
			const res = await authClient.device({
				query: { user_code: userCode },
			})
			if (res.error) {
				throw new Error(getErrorDescription(res.error, "device claim failed"))
			}
			return res.data as DeviceClaim
		},
		enabled: userCode !== null,
		retry: false,
	})

	const approve = useMutation({
		mutationFn: async () => {
			if (!userCode) throw new Error("missing user_code")
			const res = await authClient.device.approve({
				userCode,
			})
			if (res.error) {
				throw new Error(getErrorDescription(res.error, "approve failed"))
			}
			return res.data
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ["device", "claim", userCode],
			})
		},
	})

	const deny = useMutation({
		mutationFn: async () => {
			if (!userCode) throw new Error("missing user_code")
			const res = await authClient.device.deny({
				userCode,
			})
			if (res.error) {
				throw new Error(getErrorDescription(res.error, "deny failed"))
			}
			return res.data
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ["device", "claim", userCode],
			})
		},
	})

	return {
		status: claim.data?.status,
		isLoading: claim.isLoading,
		isError: claim.isError,
		error: claim.error,
		approve,
		deny,
	}
}

/**
 * Map a Better Auth device-flow error code to a user-facing
 * fallback message. The wire enum (per the plugin's
 * `error-codes.mjs`) is stable across Better Auth 1.6.x but
 * the precise description string is localisable; we pin the
 * enum-to-message table here so a future translation pass
 * touches one file.
 */
const DEVICE_ERROR_MESSAGES: Record<string, string> = {
	invalid_request: "The device request was malformed. Try again.",
	expired_token: "This device code has expired. Run `deesse auth login` again.",
	authorization_pending:
		"The user has not yet approved the request. Keep waiting.",
	slow_down:
		"You are polling too quickly. Slow down and try again in a few seconds.",
	access_denied: "The user denied the device request.",
	device_code_already_processed:
		"This device code has already been approved or denied.",
	unauthorized: "You are not signed in.",
	invalid_grant:
		"The device code is invalid or has already been used.",
	invalid_client:
		"The CLI is not a registered device client. Check the install.",
	server_error:
		"The device-flow server encountered an internal error. Try again later.",
}

export function useDeviceErrorMessage(code: string | undefined | null) {
	if (!code) return null
	return DEVICE_ERROR_MESSAGES[code] ?? null
}

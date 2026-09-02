import http from "node:http"
import type { AddressInfo } from "node:net"

/**
 * Fake Better Auth server for CLI integration tests (ADR-020).
 *
 * Mirrors the 5 device-flow endpoints plus /get-session and
 * /sign-out, with controllable behaviour via a `behaviour`
 * object passed to the constructor. The handler state lives on
 * a single shared `state` record that tests can mutate
 * between calls.
 *
 * Endpoints:
 *   POST /api/v1/auth/device/code
 *   POST /api/v1/auth/device/token
 *   GET  /api/v1/auth/device?user_code=X
 *   POST /api/v1/auth/device/approve
 *   POST /api/v1/auth/device/deny
 *   POST /api/v1/auth/sign-out
 *   GET  /api/v1/auth/get-session
 *
 * The base path /api/v1/auth/ matches the real Better Auth
 * mount (see packages/auth/src/auth.ts AUTH_BASE_PATH). The
 * CLI's createCliAuthClient reads baseURL from the
 * DEESSEJS_API_URL env var; tests set it to
 * `http://localhost:${port}` before launching the commands.
 */

type Behaviour = {
	/**
	 * When 'approve' (default), the first /device/token poll
	 * returns the fake session token. When 'slow_down', every
	 * poll returns slow_down until the test flips state.next
	 * to 'approve'. When 'expire', every poll returns
	 * expired_token. When 'deny', every poll returns
	 * access_denied.
	 */
	deviceCode?: "approve" | "slow_down" | "expire" | "deny"
	/**
	 * When set, the fake returns 401 from /get-session and
	 * 500 from /sign-out. Used to test the "session invalid"
	 * branch in status.
	 */
	serverErrors?: boolean
}

type State = {
	deviceCode: string | null
	userCode: string | null
	accessToken: string | null
	issuedAt: number | null
	behaviour: Required<Behaviour>
	/**
	 * Counters used by tests to assert on wire traffic.
	 */
	counters: {
		deviceCodeRequests: number
		deviceTokenRequests: number
		getSessionRequests: number
		signOutRequests: number
	}
	/**
	 * Last Authorization header seen on /get-session, used by
	 * the CLI login test to assert the CLI sent the Bearer
	 * token it received from /device/token (ADR-022 §"Test
	 * strategy / CLI side"). Null until the first /get-session
	 * call arrives.
	 */
	lastGetSessionAuthHeader: string | null
}

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // base32 sans I, O, 0, 1

function randomUserCode(): string {
	let out = ""
	for (let i = 0; i < 8; i++) {
		out += CHARSET[Math.floor(Math.random() * CHARSET.length)]
	}
	return out
}

function randomDeviceCode(): string {
	return `dev_${Math.random().toString(36).slice(2)}`
}

function jsonResponse(
	res: http.ServerResponse,
	status: number,
	body: unknown,
): void {
	res.writeHead(status, { "content-type": "application/json" })
	res.end(JSON.stringify(body))
}

function readBody(req: http.IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		req.on("data", (chunk: Buffer) => chunks.push(chunk))
		req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
		req.on("error", reject)
	})
}

export type FakeAuthServer = {
	url: string
	state: State
	close: () => Promise<void>
	setBehaviour: (next: Partial<Behaviour>) => void
}

/**
 * Start a minimal Better Auth-compatible HTTP server on a
 * random port. The returned object exposes the baseURL and
 * a shared `state` that tests can read or mutate.
 */
export async function startFakeAuthServer(
	initial: Behaviour = {},
): Promise<FakeAuthServer> {
	const state: State = {
		deviceCode: null,
		userCode: null,
		accessToken: null,
		issuedAt: null,
		behaviour: {
			deviceCode: initial.deviceCode ?? "approve",
			serverErrors: initial.serverErrors ?? false,
		},
		counters: {
			deviceCodeRequests: 0,
			deviceTokenRequests: 0,
			getSessionRequests: 0,
			signOutRequests: 0,
		},
		lastGetSessionAuthHeader: null,
	}

	const server = http.createServer(async (req, res) => {
		const url = new URL(req.url ?? "/", "http://localhost")
		const path = url.pathname
		const method = req.method ?? "GET"

		// POST /api/v1/auth/device/code
		if (method === "POST" && path === "/api/v1/auth/device/code") {
			state.counters.deviceCodeRequests += 1
			if (state.behaviour.serverErrors) {
				return jsonResponse(res, 500, { error: "server_error" })
			}
			state.deviceCode = randomDeviceCode()
			state.userCode = randomUserCode()
			state.accessToken = null
			state.issuedAt = Date.now()
			return jsonResponse(res, 200, {
				device_code: state.deviceCode,
				user_code: state.userCode,
				verification_uri: "/device",
				verification_uri_complete: `/device?user_code=${state.userCode}`,
				expires_in: 1800,
				interval: 5,
			})
		}

		// POST /api/v1/auth/device/token
		if (method === "POST" && path === "/api/v1/auth/device/token") {
			state.counters.deviceTokenRequests += 1
			if (!state.deviceCode) {
				return jsonResponse(res, 400, {
					error: "invalid_grant",
					error_description: "no device code issued",
				})
			}
			const body = (await readBody(req)) as string
			let payload: { device_code?: string } = {}
			try {
				payload = JSON.parse(body)
			} catch {
				// ignore parse errors: treat as missing device_code
			}
			if (payload.device_code !== state.deviceCode) {
				return jsonResponse(res, 400, { error: "invalid_grant" })
			}
			switch (state.behaviour.deviceCode) {
				case "slow_down":
					return jsonResponse(res, 400, { error: "slow_down" })
				case "expire":
					return jsonResponse(res, 400, { error: "expired_token" })
				case "deny":
					return jsonResponse(res, 400, { error: "access_denied" })
				case "approve":
				default: {
					state.accessToken = `tok_${Math.random().toString(36).slice(2)}`
					return jsonResponse(res, 200, {
						access_token: state.accessToken,
						token_type: "Bearer",
						expires_in: 604800,
						userId: null,
					})
				}
			}
		}

		// GET /api/v1/auth/device?user_code=X
		if (method === "GET" && path === "/api/v1/auth/device") {
			const userCode = url.searchParams.get("user_code")
			if (!userCode) {
				return jsonResponse(res, 400, {
					error: "invalid_request",
					error_description: "user_code required",
				})
			}
			return jsonResponse(res, 200, {
				user_code: userCode,
				status: "pending",
			})
		}

		// POST /api/v1/auth/sign-out
		if (method === "POST" && path === "/api/v1/auth/sign-out") {
			state.counters.signOutRequests += 1
			if (state.behaviour.serverErrors) {
				return jsonResponse(res, 500, { error: "server_error" })
			}
			state.accessToken = null
			return jsonResponse(res, 200, { success: true })
		}

		// GET /api/v1/auth/get-session
		//
		// ADR-022: the real Better Auth `bearer()` plugin resolves
		// the session from an `Authorization: Bearer <token>` header
		// (or a cookie). The fake used to accept any request that
		// arrived after a /device/token success — which let the CLI
		// bug (no Authorization header) pass through the test
		// undetected. The fake now honours the same contract:
		//   - No Bearer header OR wrong token → 401 (matches the
		//     real `bearer()` plugin's silent rejection).
		//   - Bearer token matches `state.accessToken` → 200 with
		//     the test user.
		// The header is also captured into
		// `state.lastGetSessionAuthHeader` so the CLI test can
		// assert the CLI actually sent a Bearer header.
		if (method === "GET" && path === "/api/v1/auth/get-session") {
			state.counters.getSessionRequests += 1
			const authHeader = req.headers.authorization ?? null
			state.lastGetSessionAuthHeader = authHeader
			if (
				state.behaviour.serverErrors ||
				!state.accessToken ||
				authHeader !== `Bearer ${state.accessToken}`
			) {
				// Better Auth returns 401 when there is no valid
				// session. The body shape is null on this path.
				res.writeHead(401, { "content-type": "application/json" })
				res.end("null")
				return
			}
			return jsonResponse(res, 200, {
				user: {
					id: "user_test_1",
					email: "[email protected]",
					name: "Test User",
				},
				session: {
					token: state.accessToken,
					expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
				},
			})
		}

		// /device/approve and /device/deny are present but
		// the CLI tests do not exercise the web side; we
		// accept and return 200 so the server matches the
		// documented envelope shape if a test ever probes them.
		if (method === "POST" && path === "/api/v1/auth/device/approve") {
			return jsonResponse(res, 200, { success: true })
		}
		if (method === "POST" && path === "/api/v1/auth/device/deny") {
			return jsonResponse(res, 200, { success: true })
		}

		jsonResponse(res, 404, { error: "not_found" })
	})

	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
	const { port } = server.address() as AddressInfo
	const url = `http://127.0.0.1:${port}`

	return {
		url,
		state,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((err) => (err ? reject(err) : resolve()))
			}),
		setBehaviour: (next) => {
			state.behaviour = {
				...state.behaviour,
				...next,
			}
		},
	}
}

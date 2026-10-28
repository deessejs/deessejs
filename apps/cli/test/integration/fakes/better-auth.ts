import http from "node:http"
import type { AddressInfo } from "node:net"

/**
 * Fake Better Auth server for CLI integration tests.
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
   * token it received from /device/token. Null until the
   * first /get-session call arrives.
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
  body: unknown
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

const AUTH_PATH = "/api/v1/auth/"

async function handleFakeAuthRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  state: State
): Promise<void> {
  const method = req.method ?? "GET"
  const endpoint = `${method} ${url.pathname}`
  switch (endpoint) {
    case `POST ${AUTH_PATH}device/code`:
      return handleDeviceCode(res, state)
    case `POST ${AUTH_PATH}device/token`:
      return handleDeviceToken(req, res, state)
    case `GET ${AUTH_PATH}device`:
      return handleDeviceStatus(res, url)
    case `POST ${AUTH_PATH}sign-out`:
      return handleSignOut(res, state)
    case `GET ${AUTH_PATH}get-session`:
      return handleGetSession(req, res, state)
    case `POST ${AUTH_PATH}device/approve`:
    case `POST ${AUTH_PATH}device/deny`:
      jsonResponse(res, 200, { success: true })
      return
    default:
      jsonResponse(res, 404, { error: "not_found" })
  }
}

function handleDeviceCode(res: http.ServerResponse, state: State): void {
  state.counters.deviceCodeRequests += 1
  if (state.behaviour.serverErrors) {
    jsonResponse(res, 500, { error: "server_error" })
    return
  }
  state.deviceCode = randomDeviceCode()
  state.userCode = randomUserCode()
  state.accessToken = null
  state.issuedAt = Date.now()
  jsonResponse(res, 200, {
    device_code: state.deviceCode,
    user_code: state.userCode,
    verification_uri: "/device",
    verification_uri_complete: `/device?user_code=${state.userCode}`,
    expires_in: 1800,
    interval: 5,
  })
}

async function handleDeviceToken(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  state: State
): Promise<void> {
  state.counters.deviceTokenRequests += 1
  if (!state.deviceCode) {
    jsonResponse(res, 400, {
      error: "invalid_grant",
      error_description: "no device code issued",
    })
    return
  }
  const body = await readBody(req)
  const payload = parseDeviceTokenPayload(body)
  if (payload.device_code !== state.deviceCode) {
    jsonResponse(res, 400, { error: "invalid_grant" })
    return
  }
  const response = deviceTokenResponse(state)
  jsonResponse(res, response.status, response.body)
}

function parseDeviceTokenPayload(body: string): { device_code?: string } {
  try {
    const parsed: unknown = JSON.parse(body)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "device_code" in parsed &&
      typeof parsed.device_code === "string"
    ) {
      return { device_code: parsed.device_code }
    }
  } catch {
    // Treat malformed JSON as a missing device code.
  }
  return {}
}

function deviceTokenResponse(state: State): { status: number; body: unknown } {
  switch (state.behaviour.deviceCode) {
    case "slow_down":
      return { status: 400, body: { error: "slow_down" } }
    case "expire":
      return { status: 400, body: { error: "expired_token" } }
    case "deny":
      return { status: 400, body: { error: "access_denied" } }
    default:
      state.accessToken = `tok_${Math.random().toString(36).slice(2)}`
      return {
        status: 200,
        body: {
          access_token: state.accessToken,
          token_type: "Bearer",
          expires_in: 604800,
          userId: null,
        },
      }
  }
}

function handleDeviceStatus(res: http.ServerResponse, url: URL): void {
  const userCode = url.searchParams.get("user_code")
  if (!userCode) {
    jsonResponse(res, 400, {
      error: "invalid_request",
      error_description: "user_code required",
    })
    return
  }
  jsonResponse(res, 200, { user_code: userCode, status: "pending" })
}

function handleSignOut(res: http.ServerResponse, state: State): void {
  state.counters.signOutRequests += 1
  if (state.behaviour.serverErrors) {
    jsonResponse(res, 500, { error: "server_error" })
    return
  }
  state.accessToken = null
  jsonResponse(res, 200, { success: true })
}

function handleGetSession(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  state: State
): void {
  state.counters.getSessionRequests += 1
  const authHeader = req.headers.authorization ?? null
  state.lastGetSessionAuthHeader = authHeader
  if (
    state.behaviour.serverErrors ||
    !state.accessToken ||
    authHeader !== `Bearer ${state.accessToken}`
  ) {
    res.writeHead(401, { "content-type": "application/json" })
    res.end("null")
    return
  }
  jsonResponse(res, 200, {
    user: { id: "user_test_1", email: "[email protected]", name: "Test User" },
    session: {
      token: state.accessToken,
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    },
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
  initial: Behaviour = {}
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

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost")
    void handleFakeAuthRequest(req, res, url, state).catch(() => {
      jsonResponse(res, 500, { error: "server_error" })
    })
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

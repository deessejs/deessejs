/**
 * Integration smoke test for the Better Auth mount.
 *
 * Per ADR-016, this asserts the Hono↔Better Auth boundary in
 * real conditions: the Hono mount catches the URL, the
 * handler returns the documented envelope. Better Auth's
 * own behaviour is tested in `packages/auth`.
 *
 * The Better Auth handler reaches Postgres via the session
 * middleware and the drizzle-backed user lookup, so the test
 * is DB-gated via `inject('postgres:ready')`. The test runs
 * in the CI `test-integration` job where Postgres is up; in
 * the `test-unit` job it skips loudly (the test name carries
 * a `[skip-postgres]` annotation and `globalSetup` emits a
 * WARN so the skip is visible in the log aggregator).
 *
 * Per the Better Auth Hono integration docs, an
 * unauthenticated request to `/api/v1/auth/get-session`
 * returns 200 with the literal body `null` (JSON). Verified
 * against the CI integration job output (2026-08-18): the
 * response body for an unauthenticated `/get-session` call
 * is `null`. If Better Auth changes the envelope shape, this
 * test fails and surfaces the change immediately.
 */
import { describe, expect, it } from "vitest"
import { inject } from "vitest"

import { api } from "../../../src/index.js"

const POSTGRES_READY = inject("postgres:ready") === true

describe("GET /api/v1/auth/get-session", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] Better Auth handler requires a reachable Postgres", () => {
      // Loud skip: the test name carries the [skip-postgres] annotation
      // and the global setup emits a WARN. A misconfigured CI is visible.
    })
  } else {
    it("is mounted and returns 200 with body null for an unauthenticated request", async () => {
      const res = await api.request("/api/v1/auth/get-session")
      expect(res.status).toBe(200)
      const body = await res.json()
      // Pin the envelope. The literal `null` body is what
      // Better Auth returns for an unauthenticated request
      // when the Hono↔Better Auth boundary is wired correctly
      // (verified against the pinned `basePath: "/api/v1/auth"`
      // in `packages/auth/src/auth.ts`). A different envelope
      // (e.g. `{ session: null, user: null }`) is a regression.
      expect(body).toBeNull()
    })
  }
})

/**
 * Device authorization flow (ADR-020). The Better Auth
 * `deviceAuthorization` plugin adds five endpoints under the
 * existing /api/v1/auth mount. The CLI consumes /device/code
 * and /device/token; the web page consumes /device, /device/approve,
 * /device/deny. This test asserts the mount and the request-time
 * envelopes; the polling-loop state transitions are exercised
 * manually against a local Better Auth instance (the device-code
 * TTL is 30 minutes, longer than the integration-test timeout).
 *
 * The shape assertions pin the wire format. A change in the
 * upstream Better Auth response envelope is a breaking change
 * for the CLI and the web page; this test surfaces the change
 * the first time it lands.
 */
describe("POST /api/v1/auth/device/code", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] device/code requires a reachable Postgres", () => {})
  } else {
    it("issues a device and user code with the documented envelope", async () => {
      const res = await api.request("/api/v1/auth/device/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: "test-client" }),
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as {
        device_code: string
        user_code: string
        verification_uri: string
        verification_uri_complete: string
        expires_in: number
        interval: number
      }
      // The user_code is 8 chars from the device-flow charset
      // (base32 sans I, O, 0, 1). The verification_uri is the
      // pinned relative path from the plugin config.
      expect(body.user_code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/)
      expect(body.device_code).toBeTypeOf("string")
      expect(body.verification_uri).toBe("/device")
      expect(body.verification_uri_complete).toBe(`/device?user_code=${body.user_code}`)
      // Better Auth default interval is 5 seconds (number, not string,
      // in the response envelope). expires_in is the device-code TTL
      // in seconds (1800 = 30 minutes by default).
      expect(body.interval).toBe(5)
      expect(body.expires_in).toBe(1800)
    })

    it("returns the same user_code is not guaranteed (regenerate on each call)", async () => {
      const first = await api.request("/api/v1/auth/device/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: "test-client" }),
      })
      const second = await api.request("/api/v1/auth/device/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: "test-client" }),
      })
      const a = ((await first.json()) as { user_code: string }).user_code
      const b = ((await second.json()) as { user_code: string }).user_code
      // Two independent /device/code calls produce two independent codes.
      // The plugin uses collision-retry; the chance of collision is the
      // 8-char base32 space (~1e12), so a duplicate is a regression.
      expect(a).not.toBe(b)
    })

    it("rejects a missing client_id with 400 invalid_request", async () => {
      const res = await api.request("/api/v1/auth/device/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
      // The plugin's body schema requires client_id; without it
      // the request fails Zod validation and returns 400 with
      // error: "invalid_request".
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error?: string }
      expect(body.error).toBe("invalid_request")
    })
  }
})

describe("POST /api/v1/auth/device/token", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] device/token requires a reachable Postgres", () => {})
  } else {
    it("rejects an unknown device code with the polling-protocol error envelope", async () => {
      const res = await api.request("/api/v1/auth/device/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: "unknown-device-code",
          client_id: "unknown-client",
        }),
      })
      // Better Auth returns the OAuth-style error envelope with HTTP 400
      // and a body like { error: "invalid_grant", error_description: "..." }.
      // The CLI's mapPollingError handles this on the client side; the
      // envelope shape is the wire contract (ADR-020).
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error?: string }
      expect(body.error).toBe("invalid_grant")
    })
  }
})

describe("GET /api/v1/auth/device", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] device requires a reachable Postgres", () => {})
  } else {
    it("returns 401 for an unauthenticated request to a pending code", async () => {
      const issued = await api.request("/api/v1/auth/device/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: "test-client" }),
      })
      const { user_code } = (await issued.json()) as { user_code: string }
      const res = await api.request(`/api/v1/auth/device?user_code=${user_code}`)
      // The endpoint requires an authenticated session. Without a cookie,
      // Better Auth returns 401 (verified against Better Auth 1.6.x docs).
      // The web page handles the 401 by rendering the "sign in" panel.
      expect(res.status).toBe(401)
    })
  }
})

describe("POST /api/v1/auth/device/approve", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] device/approve requires a reachable Postgres", () => {})
  } else {
    it("rejects an unauthenticated approve with 401", async () => {
      const issued = await api.request("/api/v1/auth/device/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: "test-client" }),
      })
      const { user_code } = (await issued.json()) as { user_code: string }
      const res = await api.request("/api/v1/auth/device/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userCode: user_code }),
      })
      expect(res.status).toBe(401)
    })
  }
})

describe("POST /api/v1/auth/device/deny", () => {
  if (!POSTGRES_READY) {
    it.skip("[skip-postgres] device/deny requires a reachable Postgres", () => {})
  } else {
    it("rejects an unauthenticated deny with 401", async () => {
      const issued = await api.request("/api/v1/auth/device/code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: "test-client" }),
      })
      const { user_code } = (await issued.json()) as { user_code: string }
      const res = await api.request("/api/v1/auth/device/deny", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userCode: user_code }),
      })
      expect(res.status).toBe(401)
    })
  }
})

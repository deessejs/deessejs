import { describe, expect, it } from "vitest"

import { OPTIONS } from "../app/api/[[...route]]/route"

/**
 * CORS preflight on the API catch-all.
 *
 * A browser sends an OPTIONS request before any cross-origin call
 * whose content type is not "simple", so every JSON POST from the
 * marketing site to the API is preceded by a preflight. That
 * preflight has to come back with `Access-Control-Allow-Origin`, or
 * the browser blocks the POST and reports a CORS error.
 *
 * Next.js auto-implements OPTIONS on a route handler that does not
 * export one. The auto-implementation answers 204 with an `Allow`
 * header and no CORS headers, and it runs before the request reaches
 * the Hono app. The CORS middleware in `packages/api` never sees the
 * preflight, so the browser rejects the call.
 *
 * These assertions go through the exported handler rather than
 * through `api.request()` directly, because the interception happens
 * in the Next.js layer, one level above Hono.
 */
describe("CORS preflight on the API catch-all", () => {
  it("exports an OPTIONS handler", () => {
    // Without this export, Next.js answers the preflight on its own
    // and the CORS middleware is never reached.
    expect(typeof OPTIONS).toBe("function")
  })

  const preflight = (origin: string) =>
    OPTIONS(
      new Request("https://app.deessejs.com/api/v1/rpc/playbook/signup", {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      }),
    )

  it("answers a preflight with the requesting origin", async () => {
    const response = await preflight("https://deessejs.com")

    expect(response.status).toBe(204)
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://deessejs.com",
    )
  })

  it("allows the POST method and the content type header", async () => {
    const response = await preflight("https://deessejs.com")

    expect(response.headers.get("Access-Control-Allow-Methods")).toContain(
      "POST",
    )
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
      "content-type",
    )
  })

  it("echoes the credentials mode the API is configured with", async () => {
    const response = await preflight("https://deessejs.com")

    // The CORS middleware runs with `credentials: true`, so the
    // origin is echoed instead of being replaced by a wildcard.
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe(
      "true",
    )
  })

  it("withholds the allow-origin header from an origin outside the allowlist", async () => {
    const response = await preflight("https://not-deessejs.example")

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull()
  })
})

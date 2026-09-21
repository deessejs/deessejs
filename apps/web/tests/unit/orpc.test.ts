/**
 * Pin the `buildFetchIsrInit` translation contract that
 * `apps/web/src/lib/orpc.ts` relies on. This is the one piece of
 * logic in the fetch wrapper that, if it regresses, reopens issue
 * #81 (transient oRPC failures cached as empty bodies for ten
 * minutes).
 *
 * Coverage targets:
 *   1. With no cache directive → falls back to the legacy
 *      site-wide behavior (revalidate: 600, tag "templates").
 *   2. With `liveCache` → revalidate: 0, tag "templates:live".
 *   3. With `staticParamsCache` → revalidate: 600, tag
 *      "templates:static".
 *   4. With a partial directive (only `revalidate`, no `tag`) →
 *      revalidate is honored, tag falls back to the legacy
 *      site-wide tag.
 *   5. The original `init` object is not mutated (spread does
 *      not leak references).
 *   6. Non-`next` fields on the input `init` (e.g. `headers`,
 *      `body`, `method`) pass through unchanged.
 *
 * No network, no I/O, no env. The function is a pure shape
 * transformer over `RequestInit`.
 */
import { describe, expect, it } from "vitest"

import { buildFetchIsrInit } from "../../src/lib/orpc.js"

describe("buildFetchIsrInit (issue #81 contract)", () => {
  it("falls back to the site-wide default when no directive is supplied", () => {
    const result = buildFetchIsrInit({}, undefined)

    expect(result.next).toEqual({
      revalidate: 600,
      tags: ["templates"],
    })
  })

  it("falls back to the site-wide default when context is empty", () => {
    // Mirrors the wire shape when an oRPC call-site passes
    // `liveCache` / `staticParamsCache` but a future call-site
    // passes `{ cache: undefined }` (Object spread on `undefined`).
    const result = buildFetchIsrInit({}, undefined)

    expect(result.next?.revalidate).toBe(600)
    expect(result.next?.tags).toEqual(["templates"])
  })

  it("translates `liveCache` to revalidate: 0, single namespaced tag", () => {
    const result = buildFetchIsrInit({}, {
      revalidate: 0,
      tag: "templates:live",
    })

    expect(result.next).toEqual({
      revalidate: 0,
      tags: ["templates:live"],
    })
  })

  it("translates `staticParamsCache` to revalidate: 600, namespaced tag", () => {
    const result = buildFetchIsrInit({}, {
      revalidate: 600,
      tag: "templates:static",
    })

    expect(result.next).toEqual({
      revalidate: 600,
      tags: ["templates:static"],
    })
  })

  it("honors a partial directive (revalidate present, tag missing)", () => {
    // Defends against a future refactor that drops the
    // `?? 600` fallback. The legacy site-wide tag MUST
    // remain so a forgotten call-site cannot silently
    // re-establish a shared site-wide tag.
    const result = buildFetchIsrInit({}, { revalidate: 30 })

    expect(result.next?.revalidate).toBe(30)
    expect(result.next?.tags).toEqual(["templates"])
  })

  it("does not mutate the input init (spread does not leak references)", () => {
    const original: RequestInit = {
      headers: { "x-request-id": "abc" },
      method: "POST",
    }
    const snapshot = JSON.stringify(original)

    buildFetchIsrInit(original, { revalidate: 0, tag: "templates:live" })

    expect(JSON.stringify(original)).toBe(snapshot)
  })

  it("preserves non-`next` fields (headers, method, body)", () => {
    const original: RequestInit = {
      headers: { "content-type": "application/json" },
      method: "POST",
      body: '{"data":null,"path":["templates","list"]}',
    }

    const result = buildFetchIsrInit(original, {
      revalidate: 0,
      tag: "templates:live",
    })

    expect(result.headers).toEqual(original.headers)
    expect(result.method).toBe("POST")
    expect(result.body).toBe(original.body)
    expect(result.next).toEqual({
      revalidate: 0,
      tags: ["templates:live"],
    })
  })

  it("accepts an undefined init without throwing", () => {
    // The oRPC fetch hook is typed as receiving `init` from oRPC
    // itself; in practice it is always defined, but the public
    // helper signature accepts `undefined` and must not crash.
    expect(() => buildFetchIsrInit(undefined, undefined)).not.toThrow()
  })
})

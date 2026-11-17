import { describe, expect, it } from "vitest"

import { buildFetchIsrInit } from "@/lib/orpc"

describe("web oRPC fetch cache configuration", () => {
  it("uses the default templates ISR directive when call context is absent", () => {
    expect(buildFetchIsrInit({ method: "POST" }, undefined)).toEqual({
      method: "POST",
      next: { revalidate: 600, tags: ["templates"] },
    })
  })

  it("maps per-call cache context to Next fetch options", () => {
    expect(buildFetchIsrInit({ method: "POST" }, { revalidate: 0, tag: "templates:live" })).toEqual({
      method: "POST",
      next: { revalidate: 0, tags: ["templates:live"] },
    })
  })
})

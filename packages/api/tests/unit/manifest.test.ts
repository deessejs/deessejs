/**
 * Unit tests for the template manifest contract.
 *
 * The manifest, `deesse-template.json`, is the single source of the
 * catalogue fields. These tests pin three things:
 *
 *   1. the parse never throws on a malformed file, it returns
 *      `undefined` so the catalogue skips the template
 *   2. the merge takes the product fields from the manifest and the
 *      technical fields from the live repository
 *   3. a template with no catalogue row, meaning no slug or no
 *      product category, is not published
 */
import { describe, expect, it } from "vitest"

import {
  mergeManifest,
  parseManifest,
  type LiveRepoFacts,
} from "../../src/core/templates/manifest.js"

const POINTER = { owner: "deessejs", repo: "saas-template" }

const LIVE: LiveRepoFacts = {
  name: "saas-template",
  description: "The GitHub description",
  license: "MIT",
  topics: ["drizzle", "monorepo", "nextjs"],
  pushedAt: "2026-10-20T12:00:00Z",
  stars: 42,
  htmlUrl: "https://github.com/deessejs/saas-template",
}

const MANIFEST = {
  name: "saas-template",
  slug: "saas-starter",
  title: "SaaS Starter",
  description: "A Next.js monorepo with authentication and billing wired.",
  version: "0.0.1",
  type: "template:starter",
  license: "MIT",
  product: {
    layer: "open-community",
    category: "saas",
    labels: ["nextjs", "drizzle", "postgres"],
    image: "/ship-your-saas.png",
  },
}

describe("parseManifest", () => {
  it("reads the product and the technical fields", () => {
    const manifest = parseManifest(JSON.stringify(MANIFEST))
    expect(manifest?.slug).toBe("saas-starter")
    expect(manifest?.title).toBe("SaaS Starter")
    expect(manifest?.license).toBe("MIT")
    expect(manifest?.product?.category).toBe("saas")
    expect(manifest?.product?.labels).toEqual(["nextjs", "drizzle", "postgres"])
  })

  it("returns undefined for a malformed file", () => {
    expect(parseManifest("{ not json")).toBeUndefined()
  })

  it("returns undefined when the payload is not an object", () => {
    expect(parseManifest("[]")).toBeUndefined()
    expect(parseManifest("null")).toBeUndefined()
    expect(parseManifest('"saas"')).toBeUndefined()
  })

  it("ignores the fields of an unknown type", () => {
    const manifest = parseManifest(
      JSON.stringify({ ...MANIFEST, futureField: { nested: true } }),
    )
    expect(manifest?.slug).toBe("saas-starter")
  })

  it("drops the fields that carry the wrong type", () => {
    const manifest = parseManifest(
      JSON.stringify({ ...MANIFEST, slug: 42, product: { category: 7 } }),
    )
    expect(manifest?.slug).toBeUndefined()
    expect(manifest?.product?.category).toBeUndefined()
  })
})

describe("mergeManifest", () => {
  it("takes the product fields from the manifest", () => {
    const merged = mergeManifest(
      POINTER,
      parseManifest(JSON.stringify(MANIFEST))!,
      LIVE,
    )
    expect(merged).toMatchObject({
      slug: "saas-starter",
      name: "SaaS Starter",
      description: "A Next.js monorepo with authentication and billing wired.",
      owner: "deessejs",
      repo: "saas-template",
      license: "MIT",
      category: "saas",
      image: "/ship-your-saas.png",
      layer: "open-community",
    })
  })

  it("takes the live facts from the repository", () => {
    const merged = mergeManifest(
      POINTER,
      parseManifest(JSON.stringify(MANIFEST))!,
      LIVE,
    )
    expect(merged?.cloneUrl).toBe(LIVE.htmlUrl)
    expect(merged?.updatedAt).toBe(LIVE.pushedAt)
    expect(merged?.stars).toBe(42)
  })

  it("prefers the manifest labels over the repository topics", () => {
    const merged = mergeManifest(
      POINTER,
      parseManifest(JSON.stringify(MANIFEST))!,
      LIVE,
    )
    expect(merged?.labels).toEqual(["nextjs", "drizzle", "postgres"])
  })

  it("falls back to the repository topics when the manifest has no labels", () => {
    const raw = JSON.stringify({
      ...MANIFEST,
      product: { ...MANIFEST.product, labels: [] },
    })
    const merged = mergeManifest(POINTER, parseManifest(raw)!, LIVE)
    expect(merged?.labels).toEqual(LIVE.topics)
  })

  it("falls back to the repository licence when the manifest has none", () => {
    const raw = JSON.stringify({ ...MANIFEST, license: undefined })
    const merged = mergeManifest(POINTER, parseManifest(raw)!, LIVE)
    expect(merged?.license).toBe("MIT")
  })

  it("does not publish a template with no slug", () => {
    const raw = JSON.stringify({ ...MANIFEST, slug: undefined })
    expect(mergeManifest(POINTER, parseManifest(raw)!, LIVE)).toBeUndefined()
  })

  it("does not publish a template with no product category", () => {
    const raw = JSON.stringify({
      ...MANIFEST,
      product: { layer: "open-community" },
    })
    expect(mergeManifest(POINTER, parseManifest(raw)!, LIVE)).toBeUndefined()
  })

  it("ignores a layer that is not a known layer", () => {
    const raw = JSON.stringify({
      ...MANIFEST,
      product: { ...MANIFEST.product, layer: "platinum" },
    })
    const merged = mergeManifest(POINTER, parseManifest(raw)!, LIVE)
    expect(merged?.layer).toBeUndefined()
  })
})

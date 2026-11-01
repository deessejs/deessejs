import { describe, expect, it } from "vitest"

import {
  ORGANIZATION_SLUG_CANDIDATE_LIMIT,
  organizationSlugCandidates,
  organizationSlugCandidatesFromSlug,
  slugifyOrganizationName,
} from "../../src/organization/policy.js"
import { RESERVED_SLUGS } from "../../src/organization/reserved-slugs.js"

/**
 * The format the slug has to satisfy. It is the policy's own rule, and
 * the generator's result is checked against it on every case: a slug
 * the policy would refuse is a slug the server would never store.
 */
const SLUG_FORMAT = /^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$/

describe("slugifyOrganizationName", () => {
  it("normalizes a name to what the format accepts", () => {
    expect(slugifyOrganizationName("Acme")).toBe("acme")
    expect(slugifyOrganizationName("Acme Corp")).toBe("acme-corp")
    expect(slugifyOrganizationName("  Acme  ".trim())).toBe("acme")
    expect(slugifyOrganizationName("ACME")).toBe("acme")
    expect(slugifyOrganizationName("Acme & Co.")).toBe("acme-co")
  })

  it("keeps the letters a name has in another script", () => {
    // The diacritics go, the letters stay: the slug is still the
    // name, in the shape the format accepts.
    expect(slugifyOrganizationName("Société Générale")).toBe("societe-generale")
  })

  it("falls back to a token when the name normalizes to nothing", () => {
    const slug = slugifyOrganizationName("日本語")
    expect(slug).toMatch(/^org-[0-9a-f]{8}$/)
  })

  it("falls back to a token when the name is one character", () => {
    // The format needs two characters, and a one-character name is
    // a name the policy accepts.
    const slug = slugifyOrganizationName("A")
    expect(slug).toMatch(/^org-[0-9a-f]{8}$/)
  })

  it("is deterministic", () => {
    expect(slugifyOrganizationName("A")).toBe(slugifyOrganizationName("A"))
    expect(slugifyOrganizationName("日本語")).toBe(
      slugifyOrganizationName("日本語")
    )
  })

  it("truncates to the length the format allows", () => {
    const slug = slugifyOrganizationName("a".repeat(80))
    expect(slug).toHaveLength(38)
    expect(SLUG_FORMAT.test(slug)).toBe(true)
  })

  it("never ends with a hyphen, even when it is truncated there", () => {
    const slug = slugifyOrganizationName(`${"a".repeat(37)} corp`)
    expect(slug.endsWith("-")).toBe(false)
    expect(SLUG_FORMAT.test(slug)).toBe(true)
  })

  it("always produces a slug the format accepts", () => {
    for (const name of [
      "Acme",
      "A",
      "a",
      "日本語",
      "🚀 Studio",
      "  ",
      "a".repeat(200),
      "---",
      "Société Générale",
    ]) {
      expect(SLUG_FORMAT.test(slugifyOrganizationName(name))).toBe(true)
    }
  })
})

describe("organizationSlugCandidates", () => {
  it("proposes the base and its numbered forms", () => {
    expect(organizationSlugCandidates("Acme")).toEqual([
      "acme",
      "acme-2",
      "acme-3",
      "acme-4",
      "acme-5",
      "acme-6",
      "acme-7",
      "acme-8",
      "acme-9",
      "acme-10",
    ])
  })

  it("skips a candidate the application reserves", () => {
    const candidates = organizationSlugCandidates("Admin")
    expect(candidates).not.toContain("admin")
    expect(candidates[0]).toBe("admin-2")
  })

  it("never proposes a reserved slug", () => {
    for (const reserved of RESERVED_SLUGS) {
      const candidates = organizationSlugCandidates(reserved)
      for (const candidate of candidates) {
        expect(RESERVED_SLUGS.has(candidate)).toBe(false)
      }
    }
  })

  it("is bounded", () => {
    for (const name of ["Acme", "Admin", "日本語", "A"]) {
      expect(organizationSlugCandidates(name).length).toBeLessThanOrEqual(
        ORGANIZATION_SLUG_CANDIDATE_LIMIT
      )
    }
  })

  it("proposes candidates the format accepts", () => {
    for (const name of ["Acme", "Admin", "日本語", "A", "a".repeat(80)]) {
      for (const candidate of organizationSlugCandidates(name)) {
        expect(SLUG_FORMAT.test(candidate)).toBe(true)
      }
    }
  })

  it("keeps every candidate within the length the format allows", () => {
    const candidates = organizationSlugCandidates("a".repeat(80))
    for (const candidate of candidates) {
      expect(candidate.length).toBeLessThanOrEqual(38)
    }
  })
})

describe("organizationSlugCandidatesFromSlug", () => {
  it("tries the proposed slug before numbered collision forms", () => {
    expect(organizationSlugCandidatesFromSlug("acme-studio")).toEqual([
      "acme-studio",
      "acme-studio-2",
      "acme-studio-3",
      "acme-studio-4",
      "acme-studio-5",
      "acme-studio-6",
      "acme-studio-7",
      "acme-studio-8",
      "acme-studio-9",
      "acme-studio-10",
    ])
  })

  it("moves past a reserved proposal", () => {
    expect(organizationSlugCandidatesFromSlug("admin")[0]).toBe("admin-2")
  })

  it("rejects proposals that do not satisfy the slug format", () => {
    expect(organizationSlugCandidatesFromSlug("A slug")).toEqual([])
    expect(organizationSlugCandidatesFromSlug("a")).toEqual([])
  })
})

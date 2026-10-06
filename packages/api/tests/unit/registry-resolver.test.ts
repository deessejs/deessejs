/**
 * Unit tests for `registry-resolver.ts`.
 *
 * The resolver is the gate between the user's slug input and the
 * fetch step. Each test pins one branch of `resolveSource` so a
 * future refactor cannot accidentally widen the accepted shapes
 * (or shrink them).
 *
 * Coverage:
 *   - Catalogue shorthand (`saas-starter` → catalog match)
 *   - `owner/repo` shorthand (vercel/next.commerce)
 *   - HTTPS GitHub URL (with/without `.git`, with extra path)
 *   - SSH GitHub URL
 *   - Non-github HTTPS URL (gitlab, bitbucket) → unsupported_host
 *   - Malformed slug → invalid_slug
 *   - Whitespace handling
 *   - Edge cases: empty string, three segments, leading slash, etc.
 */
import { describe, expect, it } from "vitest"

import {
  parseOwnerRepo,
  resolveSource,
} from "../../src/http/routes/registry-resolver.js"

describe("resolveSource — catalogue shorthand", () => {
  it("resolves a known catalogue slug to a catalog source", () => {
    const result = resolveSource("saas-starter")
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "catalog") {
      expect(result.source.entry.owner).toBe("deessejs")
      expect(result.source.entry.repo).toBe("saas-template")
    } else {
      throw new Error("expected catalog source")
    }
  })

  it("resolves all 8 catalogue entries", () => {
    const slugs = [
      "saas-starter",
      "saas-starter-multi-tenant",
      "electron-starter",
      "docs-starter",
      "landing-starter",
      "blog-starter",
      "package-starter",
      "eve-starter",
    ]
    for (const slug of slugs) {
      const result = resolveSource(slug)
      expect(result.ok, slug).toBe(true)
      if (result.ok) {
        expect(result.source.kind, slug).toBe("catalog")
      }
    }
  })
})

describe("resolveSource — owner/repo shorthand", () => {
  it("resolves a valid owner/repo to a github source", () => {
    const result = resolveSource("vercel/next.commerce")
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "github") {
      expect(result.source.repo).toEqual({
        owner: "vercel",
        repo: "next.commerce",
      })
    } else {
      throw new Error("expected github source")
    }
  })

  it("accepts underscores and dashes", () => {
    expect(resolveSource("my-org/my_repo-js")).toMatchObject({
      ok: true,
      source: { kind: "github", repo: { owner: "my-org", repo: "my_repo-js" } },
    })
  })

  it("accepts uppercase (case-insensitive GitHub)", () => {
    const result = resolveSource("Vercel/Next-Commerce")
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "github") {
      expect(result.source.repo.owner).toBe("Vercel")
      expect(result.source.repo.repo).toBe("Next-Commerce")
    }
  })

  it("rejects three-segment paths", () => {
    const result = resolveSource("foo/bar/baz")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error._tag).toBe("invalid_slug")
    }
  })

  it("rejects leading slash", () => {
    expect(resolveSource("/vercel/next").ok).toBe(false)
  })

  it("rejects trailing slash", () => {
    expect(resolveSource("vercel/next/").ok).toBe(false)
  })

  it("rejects whitespace inside", () => {
    expect(resolveSource("vercel/next commerce").ok).toBe(false)
  })
})

describe("resolveSource — HTTPS GitHub URL", () => {
  it("resolves a plain https URL", () => {
    const result = resolveSource("https://github.com/deessejs/blog-template")
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "github") {
      expect(result.source.repo).toEqual({
        owner: "deessejs",
        repo: "blog-template",
      })
    } else {
      throw new Error("expected github source")
    }
  })

  it("strips the .git suffix", () => {
    const result = resolveSource(
      "https://github.com/deessejs/blog-template.git",
    )
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "github") {
      expect(result.source.repo.repo).toBe("blog-template")
    }
  })

  it("ignores extra path segments (tree/blob)", () => {
    const result = resolveSource(
      "https://github.com/deessejs/blog-template/tree/main/src",
    )
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "github") {
      expect(result.source.repo.owner).toBe("deessejs")
      expect(result.source.repo.repo).toBe("blog-template")
    }
  })

  it("rejects http (non-TLS) URLs to github.com", () => {
    // http is plain HTTP — for github we always require https.
    const result = resolveSource("http://github.com/deessejs/blog-template")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error._tag).toBe("invalid_slug")
    }
  })

  it("rejects non-github hosts with unsupported_host", () => {
    const result = resolveSource("https://gitlab.com/foo/bar")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error._tag).toBe("unsupported_host")
      if (result.error._tag === "unsupported_host") {
        expect(result.error.host).toBe("gitlab.com")
      }
    }
  })

  it("rejects bitbucket URLs", () => {
    const result = resolveSource("https://bitbucket.org/foo/bar")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error._tag).toBe("unsupported_host")
    }
  })
})

describe("resolveSource — SSH GitHub URL", () => {
  it("resolves the canonical ssh form", () => {
    const result = resolveSource("git@github.com:deessejs/blog-template.git")
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "github") {
      expect(result.source.repo).toEqual({
        owner: "deessejs",
        repo: "blog-template",
      })
    } else {
      throw new Error("expected github source")
    }
  })

  it("strips the .git suffix from ssh URLs", () => {
    const result = resolveSource("git@github.com:deessejs/blog-template")
    expect(result.ok).toBe(true)
    if (result.ok && result.source.kind === "github") {
      expect(result.source.repo.repo).toBe("blog-template")
    }
  })

  it("accepts ssh:// scheme", () => {
    const result = resolveSource("ssh://git@github.com/deessejs/blog-template.git")
    expect(result.ok).toBe(true)
  })

  it("rejects ssh URLs to other hosts", () => {
    const result = resolveSource("git@gitlab.com:foo/bar.git")
    expect(result.ok).toBe(false)
  })
})

describe("resolveSource — malformed inputs", () => {
  it("rejects empty string", () => {
    const result = resolveSource("")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error._tag).toBe("invalid_slug")
    }
  })

  it("rejects whitespace-only string", () => {
    const result = resolveSource("   ")
    expect(result.ok).toBe(false)
  })

  it("trims surrounding whitespace then parses", () => {
    const result = resolveSource("  vercel/next.commerce  ")
    expect(result.ok).toBe(true)
  })

  it("rejects a slug with no slash and not in catalogue", () => {
    const result = resolveSource("not-a-real-slug-without-slash")
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error._tag).toBe("invalid_slug")
    }
  })

  it("rejects a slug with two slashes (looks like URL but isn't)", () => {
    // 'foo/bar/baz' is 3 segments — see test above.
    // Here we test a malformed string that contains slashes but
    // doesn't match the regex (e.g. starts with hyphen).
    const result = resolveSource("-invalid/-repo")
    expect(result.ok).toBe(false)
  })

  it("rejects an owner that's too long (>40 chars)", () => {
    const longOwner = "a".repeat(41)
    const result = resolveSource(`${longOwner}/foo`)
    expect(result.ok).toBe(false)
  })

  it("rejects a repo that's too long (>101 chars)", () => {
    const longRepo = "a".repeat(102)
    const result = resolveSource(`owner/${longRepo}`)
    expect(result.ok).toBe(false)
  })
})

describe("parseOwnerRepo", () => {
  it("parses valid shorthand", () => {
    expect(parseOwnerRepo("vercel/next.commerce")).toEqual({
      owner: "vercel",
      repo: "next.commerce",
    })
  })

  it("returns null for invalid shorthand", () => {
    expect(parseOwnerRepo("not valid")).toBeNull()
    expect(parseOwnerRepo("foo/bar/baz")).toBeNull()
    expect(parseOwnerRepo("")).toBeNull()
  })

  it("returns null for inputs that the full resolveSource would accept via catalogue", () => {
    // parseOwnerRepo is intentionally narrow: it never consults
    // the catalogue. A catalogue slug like "saas-starter" must NOT
    // be parseable as owner/repo.
    expect(parseOwnerRepo("saas-starter")).toBeNull()
  })
})
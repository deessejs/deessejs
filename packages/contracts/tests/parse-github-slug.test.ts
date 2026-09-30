/**
 * Unit tests for `parseGitHubSlug`.
 *
 * The parser is a pure function over strings, with no catalogue
 * dependency. Every branch is pinned: changing the regex, the URL
 * parser, or the SSH normaliser must update these tests.
 *
 * Coverage targets:
 *   - HTTPS GitHub URL (with and without `.git`, with `/tree/...`)
 *   - SSH GitHub URL (SCP-like and `ssh://` URI)
 *   - `owner/repo` shorthand (case, special chars, length bounds)
 *   - Non-GitHub HTTPS URL → `unsupported_host`
 *   - Malformed / empty / whitespace input → `not_github`
 *   - Case preservation in the returned pair
 */
import { describe, expect, it } from "vitest"

import { parseGitHubSlug } from "../src/shared/slug.js"

describe("parseGitHubSlug — HTTPS GitHub URL", () => {
  it("parses a plain HTTPS URL", () => {
    expect(parseGitHubSlug("https://github.com/deessejs/blog-template")).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
  })

  it("strips the .git suffix", () => {
    const result = parseGitHubSlug(
      "https://github.com/deessejs/blog-template.git",
    )
    expect(result).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
  })

  it("ignores extra path segments (tree, blob)", () => {
    expect(
      parseGitHubSlug(
        "https://github.com/deessejs/blog-template/tree/main/src",
      ),
    ).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
    expect(
      parseGitHubSlug(
        "https://github.com/deessejs/blog-template/blob/main/README.md",
      ),
    ).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
  })

  it("rejects http (non-TLS) URLs to github.com", () => {
    // http is plain HTTP — for github we always require https
    // when given an explicit URL. The shorthand path stays
    // transport-agnostic.
    expect(parseGitHubSlug("http://github.com/deessejs/blog-template")).toEqual({
      kind: "not_github",
    })
  })
})

describe("parseGitHubSlug — unsupported hosts", () => {
  it("returns unsupported_host for gitlab.com", () => {
    expect(parseGitHubSlug("https://gitlab.com/foo/bar")).toEqual({
      kind: "unsupported_host",
      host: "gitlab.com",
    })
  })

  it("returns unsupported_host for bitbucket.org", () => {
    expect(parseGitHubSlug("https://bitbucket.org/foo/bar")).toEqual({
      kind: "unsupported_host",
      host: "bitbucket.org",
    })
  })

  it("returns unsupported_host for self-hosted Gitea", () => {
    expect(parseGitHubSlug("https://git.example.com/foo/bar")).toEqual({
      kind: "unsupported_host",
      host: "git.example.com",
    })
  })
})

describe("parseGitHubSlug — SSH GitHub URL", () => {
  it("parses the canonical SCP-like form", () => {
    expect(
      parseGitHubSlug("git@github.com:deessejs/blog-template.git"),
    ).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
  })

  it("strips the .git suffix from SCP-like URLs", () => {
    expect(parseGitHubSlug("git@github.com:deessejs/blog-template")).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
  })

  it("parses ssh:// URI form", () => {
    expect(
      parseGitHubSlug("ssh://git@github.com/deessejs/blog-template.git"),
    ).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
  })

  it("rejects SSH URLs to other hosts", () => {
    expect(parseGitHubSlug("git@gitlab.com:foo/bar.git")).toEqual({
      kind: "not_github",
    })
  })

  it("ignores the leading user (deploy keys, etc.)", () => {
    expect(
      parseGitHubSlug("deploy-key@github.com:deessejs/blog-template.git"),
    ).toEqual({
      kind: "ok",
      repo: { owner: "deessejs", repo: "blog-template" },
    })
  })
})

describe("parseGitHubSlug — owner/repo shorthand", () => {
  it("parses a valid shorthand", () => {
    expect(parseGitHubSlug("vercel/next.commerce")).toEqual({
      kind: "ok",
      repo: { owner: "vercel", repo: "next.commerce" },
    })
  })

  it("accepts underscores and dashes", () => {
    expect(parseGitHubSlug("my-org/my_repo-js")).toEqual({
      kind: "ok",
      repo: { owner: "my-org", repo: "my_repo-js" },
    })
  })

  it("preserves the original case", () => {
    expect(parseGitHubSlug("Vercel/Next-Commerce")).toEqual({
      kind: "ok",
      repo: { owner: "Vercel", repo: "Next-Commerce" },
    })
  })

  it("rejects three-segment paths", () => {
    expect(parseGitHubSlug("foo/bar/baz")).toEqual({ kind: "not_github" })
  })

  it("rejects leading slash", () => {
    expect(parseGitHubSlug("/vercel/next")).toEqual({ kind: "not_github" })
  })

  it("rejects trailing slash", () => {
    expect(parseGitHubSlug("vercel/next/")).toEqual({ kind: "not_github" })
  })

  it("rejects whitespace inside", () => {
    expect(parseGitHubSlug("vercel/next commerce")).toEqual({
      kind: "not_github",
    })
  })

  it("rejects an owner that's too long (>39 chars)", () => {
    const longOwner = "a".repeat(40)
    expect(parseGitHubSlug(`${longOwner}/foo`)).toEqual({ kind: "not_github" })
  })

  it("rejects a repo that's too long (>100 chars)", () => {
    const longRepo = "a".repeat(101)
    expect(parseGitHubSlug(`owner/${longRepo}`)).toEqual({ kind: "not_github" })
  })

  it("rejects bare slug without slash (catalogue territory)", () => {
    // Catalogue slugs like `saas-starter` are not GitHub-shaped;
    // the parser returns `not_github` so the caller can consult
    // its slug catalogue.
    expect(parseGitHubSlug("saas-starter")).toEqual({ kind: "not_github" })
  })
})

describe("parseGitHubSlug — malformed input", () => {
  it("rejects empty string", () => {
    expect(parseGitHubSlug("")).toEqual({ kind: "not_github" })
  })

  it("rejects whitespace-only string", () => {
    expect(parseGitHubSlug("   ")).toEqual({ kind: "not_github" })
  })

  it("trims surrounding whitespace then parses", () => {
    expect(parseGitHubSlug("  vercel/next.commerce  ")).toEqual({
      kind: "ok",
      repo: { owner: "vercel", repo: "next.commerce" },
    })
  })

  it("rejects a malformed URL with not_github", () => {
    expect(parseGitHubSlug("https://")).toEqual({ kind: "not_github" })
  })
})
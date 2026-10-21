/**
 * Unit tests for the registry-owned display name invariant in
 * `packages/api/src/core/templates/enrich.ts`.
 *
 * Why: the cards on `/templates` were rendering slugified GitHub repo
 * names (`saas-template`, `complete-electron-template`, …) instead of
 * the registry's editorial names (`SaaS Starter`, `Electron Starter`,
 * …). Cause: `enrich()` was overwriting `template.name` with
 * `repo.name` on every successful GitHub fetch. The registry is the
 * editorial source of truth for the display name; GitHub provides
 * only live metadata (stars, updatedAt, readme, license, topics).
 *
 * This file pins the invariant: when `fetchRepo` returns a `name`
 * different from the registry's `name`, the enriched payload MUST
 * keep the registry's name.
 */
import { describe, expect, it, vi } from "vitest"

import { TEMPLATES } from "../../src/templates.js"
import { enrich } from "../../src/core/templates/enrich.js"

vi.mock(import("../../src/core/github/client.js"), () => ({
  fetchRepo: vi.fn(async (owner: string, repo: string) => ({
    // Intentionally diverge from the registry name to expose the
    // bug if someone reintroduces `name: repo.name` in enrich().
    name: `${repo}-from-github`,
    full_name: `${owner}/${repo}`,
    description: null,
    license: null,
    stargazers_count: 0,
    pushed_at: "2026-01-01T00:00:00Z",
    topics: [],
    html_url: `https://github.com/${owner}/${repo}`,
  })),
  fetchReadme: vi.fn(async () => undefined),
}))

describe("enrich — registry-owned display name", () => {
  it("keeps the registry's editorial name when GitHub returns a different repo.name", async () => {
    const enriched = await enrich(TEMPLATES)

    // Every entry must round-trip its registry name intact, regardless
    // of what `repo.name` says. The mock above forces divergence on
    // every entry, so any `name: repo.name` in enrich() would surface
    // here.
    for (const entry of TEMPLATES) {
      const found = enriched.find((e) => e.slug === entry.slug)
      expect(found, `template ${entry.slug} not in enriched output`).toBeDefined()
      expect(found!.name).toBe(entry.name)
      expect(found!.name).not.toContain("-from-github")
    }
  })

  it("preserves the display name for every shipped registry entry", async () => {
    const enriched = await enrich(TEMPLATES)
    const names = enriched.map((e) => e.name).sort()
    const expected = TEMPLATES.map((e) => e.name).sort()
    expect(names).toEqual(expected)
  })

  it("uses the registry's description when GitHub returns null", async () => {
    // The mock returns `description: null` for every repo. The enrich
    // step must fall back to the registry description, not the wire
    // shape's `null`. This guards the symmetric case for the `name`
    // invariant: registry text fields are canonical when GitHub
    // provides nothing.
    const enriched = await enrich(TEMPLATES)
    for (const entry of TEMPLATES) {
      const found = enriched.find((e) => e.slug === entry.slug)
      expect(found!.description).toBe(entry.description)
    }
  })
})

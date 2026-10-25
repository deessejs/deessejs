/**
 * Drift guards for the registry's two hand-maintained maps.
 *
 * `CATEGORY_LABELS` and `TEMPLATES` are two halves of the same fact: the
 * first says which category slugs have a display label, the second says
 * which category each template belongs to. When they drift apart, the
 * Type filter on `/templates` silently returns nothing for a category
 * that exists in the catalog, and the sidebar shows options at zero.
 *
 * That is not hypothetical. The map shipped with three keys while the
 * catalog used seven, so six of seven templates could not be reached
 * through any type filter.
 *
 * The image allowlist is pinned against the files actually deployed in
 * `apps/web/public`, so a name that is listed but not published cannot
 * become a broken image on a template card.
 */
import { existsSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { CATEGORY_LABELS } from "../../src/templates-labels.js"
import { TEMPLATE_IMAGE_FILENAMES } from "../../src/templates-images.js"
import { TEMPLATES } from "../../src/templates.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * The deployed images live in the marketing app, not in this package.
 * The path is resolved from this file so the test fails loudly if the
 * file moves, rather than silently checking nothing.
 */
const PUBLIC_DIR = join(__dirname, "..", "..", "..", "..", "apps", "web", "public")

const LABEL_CATEGORIES = Object.keys(CATEGORY_LABELS)
const CATALOG_CATEGORIES = [...new Set(TEMPLATES.map((entry) => entry.category))]

describe("CATEGORY_LABELS", () => {
  it("labels every category the catalog uses", () => {
    const unlabelled = CATALOG_CATEGORIES.filter(
      (category) => !LABEL_CATEGORIES.includes(category),
    )
    expect(unlabelled).toEqual([])
  })

  it("lists the categories no template uses", () => {
    // `ai` and `landing` are the public slugs of two type filters that
    // no template belongs to. Pinning them means a new orphan has to be
    // a deliberate decision rather than an accident.
    const orphans = LABEL_CATEGORIES.filter(
      (category) => !CATALOG_CATEGORIES.includes(category),
    )
    expect(orphans.sort()).toEqual(["ai", "landing"])
  })
})

describe("TEMPLATE_IMAGE_FILENAMES", () => {
  it("names only bare filenames", () => {
    for (const name of TEMPLATE_IMAGE_FILENAMES) {
      expect(name).not.toContain("/")
      expect(name).not.toContain("\\")
      expect(name).not.toContain("..")
      expect(name.startsWith("/")).toBe(false)
    }
  })

  it("lists files that are deployed in apps/web/public", () => {
    const deployed = new Set(
      readdirSync(PUBLIC_DIR).filter((entry) => entry.endsWith(".png")),
    )
    const missing = TEMPLATE_IMAGE_FILENAMES.filter(
      (name) => !deployed.has(name),
    )
    expect(missing).toEqual([])
  })

  it("covers every image the registry declares", () => {
    const declared = TEMPLATES.flatMap((entry) =>
      entry.image ? [entry.image.replace(/^\//, "")] : [],
    )
    const unlisted = declared.filter(
      (name) =>
        !TEMPLATE_IMAGE_FILENAMES.some((allowed) => allowed === name),
    )
    expect(unlisted).toEqual([])
  })

  it("names files that exist", () => {
    for (const name of TEMPLATE_IMAGE_FILENAMES) {
      expect(existsSync(join(PUBLIC_DIR, name))).toBe(true)
    }
  })
})

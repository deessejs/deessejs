/**
 * Build-artifact tests for /templates.
 *
 * Why these tests exist:
 *   A run-time unit test can prove that the index/detail logic is
 *   internally consistent, but it cannot prove that the production
 *   artifact ships the right pages. The previous fix for the
 *   catalog-empty incident relied on a page-level behavior test
 *   ("x-nextjs-cache never says HIT"); that pinned a wrong
 *   invariant under the old dynamic render path. After moving to
 *   a static render, a page-level cache header test is meaningless.
 *   What IS meaningful: confirming the prerendered HTML and RSC
 *   files exist for every catalog slug, that the index page
 *   carries the full catalog in its HTML, and that none of those
 *   artifacts contains a stub `templates: []` body.
 *
 *   These tests inspect `.next/prerender-manifest.json` and the
 *   actual built `.html` / `.rsc` files to prove the artifact is
 *   the artifact. They run after `next build` via the test runner;
 *   the assumption is that the developer ran `next build` (or the
 *   pipeline did) before the suite.
 *
 * Skipped when the build artifact is absent — the test does not
 * itself run `next build` because that would inflate the test
 * duration for every PR by tens of seconds. The integration test
 * pipeline builds first, then runs.
 */
import { describe, expect, it } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { TEMPLATES_WITH_READMES } from "@workspace/api/templates-catalog-with-readmes"

const PROJECT_ROOT = join(process.cwd())
const NEXT_DIR = join(PROJECT_ROOT, ".next")
const PRERENDER_MANIFEST = join(NEXT_DIR, "prerender-manifest.json")
const APP_DIR = join(NEXT_DIR, "server", "app")

describe("build artifacts — /templates", () => {
  it("TEMPLATES_WITH_READMES is non-empty and every entry has a non-empty readme", () => {
    // Always-on guard. The build-artifact tests below are
    // conditional on `next build` having run; this one ensures
    // the catalog itself is never empty and each entry has a
    // snapshot shipped in the package, regardless of CI setup.
    expect(TEMPLATES_WITH_READMES.length).toBeGreaterThan(0)
    for (const template of TEMPLATES_WITH_READMES) {
      expect(template.slug.length).toBeGreaterThan(0)
      expect(template.name.length).toBeGreaterThan(0)
      const readme = template.readme ?? ""
      expect(
        readme.length,
        `template ${template.slug}: readme snapshot is empty or missing`,
      ).toBeGreaterThan(0)
    }
  })

  it.skipIf(!existsSync(NEXT_DIR))(
    "prerender-manifest.json exists after build",
    () => {
      expect(existsSync(PRERENDER_MANIFEST)).toBe(true)
    },
  )

  it.skipIf(!existsSync(PRERENDER_MANIFEST))(
    "prerender-manifest.json enumerates every catalog slug",
    () => {
      const manifest = JSON.parse(
        readFileSync(PRERENDER_MANIFEST, "utf8"),
      ) as { routes: Record<string, unknown> }

      const routes = Object.keys(manifest.routes)
      for (const template of TEMPLATES_WITH_READMES) {
        const path = `/templates/${template.slug}`
        // prerender-manifest.json keys include both `.html` and
        // `.rsc` forms; the `routes` map normalises to the
        // route path. Either form counts as prerendered.
        const matched = routes.some(
          (r) => r === path || r === `${path}.html` || r === `${path}.rsc`,
        )
        expect(
          matched,
          `prerender-manifest.json is missing ${path}. Routes: ${routes.join(", ")}`,
        ).toBe(true)
      }
    },
  )

  it.skipIf(!existsSync(join(APP_DIR, "templates")))(
    "every catalog slug has a built .html file",
    () => {
      for (const template of TEMPLATES_WITH_READMES) {
        const path = join(APP_DIR, "templates", `${template.slug}.html`)
        expect(
          existsSync(path),
          `expected ${path} to exist after build`,
        ).toBe(true)
      }
    },
  )

  it.skipIf(!existsSync(join(APP_DIR, "templates")))(
    "every catalog slug's .html contains the README snapshot heading",
    () => {
      for (const template of TEMPLATES_WITH_READMES) {
        const path = join(APP_DIR, "templates", `${template.slug}.html`)
        if (!existsSync(path)) continue
        const html = readFileSync(path, "utf8")
        // The README rendering goes through react-markdown with
        // rehype. The first H1 line from each snapshot MUST be
        // present in the HTML — if the loader is broken or the
        // snapshot is missing, the page would render with no
        // README at all and the snapshot title would not appear.
        const firstHeading = (template.readme ?? "")
          .split("\n")
          .map((l) => l.replace(/^#\s+/, ""))
          .find((l) => l.length > 0)
        if (!firstHeading) continue
        expect(
          html.includes(firstHeading),
          `template ${template.slug}: expected to find '${firstHeading}' in ${path}`,
        ).toBe(true)
      }
    },
  )

  it.skipIf(!existsSync(join(APP_DIR, "templates.rsc")))(
    "the /templates index RSC payload contains every catalog slug",
    () => {
      // The /templates HTML is a streaming shell; the card data
      // lives in the .rsc payload. We assert every slug's name
      // AND slug string appears in the RSC stream — proving the
      // catalog was shipped in the static artifact.
      const path = join(APP_DIR, "templates.rsc")
      if (!existsSync(path)) return
      const rsc = readFileSync(path, "utf8")
      for (const template of TEMPLATES_WITH_READMES) {
        expect(
          rsc.includes(template.slug),
          `RSC payload missing slug ${template.slug}`,
        ).toBe(true)
        expect(
          rsc.includes(template.name),
          `RSC payload missing name "${template.name}"`,
        ).toBe(true)
      }
    },
  )

  it.skipIf(!existsSync(APP_DIR))(
    "no built HTML for a catalog slug contains a hidden empty catalog",
    () => {
      // Defense-in-depth: even if the prerender-manifest looks
      // OK, the HTML body must not be a `templates: []` stub.
      // The registry is shipped as literal strings inside the
      // page payload.
      for (const template of TEMPLATES_WITH_READMES) {
        const path = join(APP_DIR, "templates", `${template.slug}.html`)
        if (!existsSync(path)) continue
        const html = readFileSync(path, "utf8")
        expect(
          html.includes(template.slug),
          `template ${template.slug}: slug absent from HTML`,
        ).toBe(true)
        // The README render goes through react-markdown. The
        // first heading from the snapshot must reach the HTML;
        // if it does not, the loader is broken or the snapshot
        // is missing entirely. We split on newlines and accept
        // the first non-empty `H1` line as the marker.
        const headings = (template.readme ?? "")
          .split("\n")
          .map((l) => l.replace(/^#\s+/, ""))
          .filter((l) => l.length > 0)
        const firstHeading = headings[0]
        if (firstHeading) {
          expect(
            html.includes(firstHeading),
            `template ${template.slug}: README H1 "${firstHeading}" missing from HTML`,
          ).toBe(true)
        }
      }
    },
  )
})

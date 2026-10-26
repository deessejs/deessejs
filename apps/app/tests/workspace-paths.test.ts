import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { RESERVED_SLUGS } from "@workspace/auth/organization/reserved-slugs"

import {
  ORGANIZATIONS_PATH,
  organizationSlugFromPathname,
  workspaceHomePath,
  workspaceOrganizationSettingsPath,
  workspacePath,
  workspaceSettingsPath,
} from "../lib/workspace-paths"

/**
 * The application's own top-level URL segments.
 *
 * A route group is transparent, so a directory's name is a URL segment
 * only when the directory is not a group. The walk collects the first
 * segment of every page the application serves, and a dynamic segment
 * is left out: it is a slug, and slugs are the reserved set's
 * business, not a fixed name.
 */
const applicationSegments = (): string[] => {
  const appDir = fileURLToPath(new URL("../app", import.meta.url))
  const found = new Set<string>()

  const walk = (directory: string, prefix: string[]): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile()) {
        if (entry.name === "page.tsx") {
          const segment = prefix[0]
          if (segment !== undefined && !segment.startsWith("[")) {
            found.add(segment)
          }
        }
        continue
      }
      if (!entry.isDirectory()) continue
      // A parallel route is a slot, not a segment.
      if (entry.name.startsWith("@")) continue
      const next = entry.name.startsWith("(") ? prefix : [...prefix, entry.name]
      walk(join(directory, entry.name), next)
    }
  }

  walk(appDir, [])
  return [...found].sort()
}

describe("the workspace paths", () => {
  it("names the organizations page", () => {
    expect(ORGANIZATIONS_PATH).toBe("/organizations")
  })

  it("builds the workspace of an organization", () => {
    expect(workspacePath("acme")).toBe("/acme")
    expect(workspaceHomePath("acme")).toBe("/acme/home")
  })

  it("builds the organization's settings", () => {
    expect(workspaceSettingsPath("acme")).toBe("/acme/settings")
    expect(workspaceOrganizationSettingsPath("acme")).toBe(
      "/acme/settings/organization",
    )
  })
})

describe("the slug in a pathname", () => {
  it("reads the first segment of a workspace path", () => {
    expect(organizationSlugFromPathname("/acme/home")).toBe("acme")
    expect(organizationSlugFromPathname("/acme/settings/organization")).toBe(
      "acme",
    )
  })

  it("reads nothing from a path without a segment", () => {
    expect(organizationSlugFromPathname("/")).toBeNull()
  })
})

describe("the reserved slug set", () => {
  it("covers every top-level segment the application owns", () => {
    const segments = applicationSegments()
    expect(segments.length).toBeGreaterThan(0)
    for (const segment of segments) {
      expect(RESERVED_SLUGS.has(segment)).toBe(true)
    }
  })

  it("holds the segments the workspace introduced", () => {
    expect(RESERVED_SLUGS.has("home")).toBe(true)
    expect(RESERVED_SLUGS.has("organizations")).toBe(true)
  })

  it("holds the segments the application already owned", () => {
    for (const segment of [
      "account",
      "admin",
      "login",
      "signup",
      "forgot-password",
      "reset-password",
      "verify-email",
      "device",
      "api",
    ]) {
      expect(RESERVED_SLUGS.has(segment)).toBe(true)
    }
  })
})

describe("the application route tree", () => {
  it("serves the account settings under their own segment", () => {
    // The account settings are account-scoped, and the segment that
    // says so is a directory, not a group: a group is transparent and
    // would move them to `/settings/*`.
    const settings = fileURLToPath(
      new URL("../app/(protected)/account/settings/profile/page.tsx", import.meta.url),
    )
    expect(existsSync(settings)).toBe(true)
  })

  it("serves the organization's general page under its slug", () => {
    // The organization's settings live under the organization they
    // belong to, and the shell's navigation links to that one page.
    const page = fileURLToPath(
      new URL(
        "../app/(protected)/(workspace)/[organization_slug]/settings/organization/page.tsx",
        import.meta.url,
      ),
    )
    expect(existsSync(page)).toBe(true)
  })
})

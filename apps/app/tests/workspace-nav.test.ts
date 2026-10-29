import { existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { FilesIcon, FolderGit2Icon, HomeIcon } from "lucide-react"

import {
  activeWorkspaceHref,
  workspaceNavEntries,
  workspaceNavGroups,
  type WorkspaceNavEntry,
} from "../lib/workspace-nav"

/** The root of the application's own directory. */
const appDir = fileURLToPath(new URL("..", import.meta.url))

/** The route segment the organization tree lives under. */
const WORKSPACE_ROUTE_ROOT = "app/(protected)/(workspace)/[organization_slug]"

/**
 * The file that serves an entry's path.
 *
 * The navigation's promise is that every entry points at a page this
 * repository serves. The test resolves the path to the file that
 * serves it and checks that the file is there: an entry whose page
 * does not exist would 404, and the rail would offer it.
 */
const routeFileOf = (href: string): string => {
  const segments = href.split("/").filter((segment) => segment.length > 0)
  const rest = segments.slice(1)
  return join(appDir, WORKSPACE_ROUTE_ROOT, ...rest, "page.tsx")
}

describe("the workspace navigation", () => {
  it("holds the groups the shell shows today", () => {
    expect(workspaceNavGroups("acme").map((group) => group.label)).toEqual([
      "Workspace",
      "Settings",
    ])
  })

  it("holds the entries of an organization", () => {
    expect(workspaceNavEntries("acme").map((entry) => entry.label)).toEqual([
      "Home",
      "Templates",
      "Projects",
      "General",
    ])
    expect(workspaceNavEntries("acme")[1]?.icon).toBe(FilesIcon)
    expect(workspaceNavEntries("acme")[2]?.icon).toBe(FolderGit2Icon)
  })

  it("builds every path from the slug", () => {
    expect(workspaceNavEntries("acme").map((entry) => entry.href)).toEqual([
      "/acme/home",
      "/acme/templates",
      "/acme/projects",
      "/acme/settings/organization",
    ])
  })

  it("points at a page the application serves", () => {
    for (const entry of workspaceNavEntries("acme")) {
      expect(existsSync(routeFileOf(entry.href))).toBe(true)
    }
  })
})

describe("the active entry", () => {
  const entries = workspaceNavEntries("acme")

  it("marks the entry the pathname names", () => {
    expect(activeWorkspaceHref("/acme/home", entries)).toBe("/acme/home")
  })

  it("marks nothing when the path matches no entry", () => {
    expect(activeWorkspaceHref("/acme/unknown", entries)).toBe("")
  })

  it("marks nothing for another organization's path", () => {
    expect(activeWorkspaceHref("/beta/home", entries)).toBe("")
  })

  it("marks the longest matching prefix", () => {
    // Two entries match the same pathname, and the shorter one must
    // not win: the page under the deeper path belongs to the deeper
    // entry.
    const candidates: WorkspaceNavEntry[] = [
      { label: "Acme", href: "/acme", icon: HomeIcon },
      { label: "Settings", href: "/acme/settings", icon: HomeIcon },
    ]
    expect(activeWorkspaceHref("/acme/settings/organization", candidates)).toBe(
      "/acme/settings"
    )
  })
})

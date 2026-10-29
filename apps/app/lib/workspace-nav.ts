import type { ComponentType } from "react"
import { HomeIcon, SettingsIcon, FilesIcon } from "lucide-react"

import {
  workspaceHomePath,
  workspaceOrganizationSettingsPath,
  workspaceTemplatesPath,
} from "@/lib/workspace-paths"

/**
 * The organization's own navigation.
 *
 * The entries live in a module rather than in the component that
 * renders them, so the next increment adds its entries here and the
 * rail grows without a conditional per feature.
 *
 * An entry points at a page this repository serves. The entries arrive
 * with the routes they point at, because a rail that links to a 404 is
 * worse than a rail with two entries.
 */

/** One entry of the organization's navigation. */
export type WorkspaceNavEntry = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

/** A group of entries, under a heading. */
export type WorkspaceNavGroup = {
  label: string
  entries: WorkspaceNavEntry[]
}

/**
 * The navigation of the organization with this slug.
 *
 * The paths come from the path module, which owns them: no file
 * hardcodes a workspace path.
 */
export const workspaceNavGroups = (slug: string): WorkspaceNavGroup[] => [
  {
    label: "Workspace",
    entries: [
      { label: "Home", href: workspaceHomePath(slug), icon: HomeIcon },
      {
        label: "Templates",
        href: workspaceTemplatesPath(slug),
        icon: FilesIcon,
      },
    ],
  },
  {
    label: "Settings",
    entries: [
      {
        label: "General",
        href: workspaceOrganizationSettingsPath(slug),
        icon: SettingsIcon,
      },
    ],
  },
]

/** Every entry of the organization's navigation, whatever its group. */
export const workspaceNavEntries = (slug: string): WorkspaceNavEntry[] =>
  workspaceNavGroups(slug).flatMap((group) => group.entries)

/**
 * The href of the active entry for the given pathname.
 *
 * The active entry is the one whose href is the longest prefix of the
 * pathname, so a page under a deeper path is not outranked by a
 * shorter prefix that also matches. The entries are passed in because
 * the caller holds them, and the rule is about paths rather than about
 * this navigation.
 */
export const activeWorkspaceHref = (
  pathname: string,
  entries: WorkspaceNavEntry[]
): string => {
  let best = ""
  for (const entry of entries) {
    if (
      (pathname === entry.href || pathname.startsWith(`${entry.href}/`)) &&
      entry.href.length > best.length
    ) {
      best = entry.href
    }
  }
  return best
}

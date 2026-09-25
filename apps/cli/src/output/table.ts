import pc from "picocolors"

import type { CatalogEntry } from "@workspace/registry-client"

export const printTemplatesTable = (templates: CatalogEntry[]): void => {
  if (templates.length === 0) {
    process.stdout.write(pc.dim("No templates available.\n"))
    return
  }
  const headers = ["slug", "title", "layer", "latestVersion"]
  const rows = templates.map((t) => [
    t.slug,
    t.title,
    t.layer,
    t.latestVersion,
  ])
  printAlignedTable([headers, ...rows])
}

export const printTemplateInfo = (info: {
  slug: string
  title: string
  description?: string
  layer: "open-community" | "pro" | "enterprise"
  latestVersion: string
  versions: readonly string[]
  category?: string
  labels?: readonly string[]
}): void => {
  const lines: Array<[string, string]> = [
    ["slug", info.slug],
    ["title", info.title],
    ["layer", info.layer],
    ["latestVersion", info.latestVersion],
    ["versions", info.versions.join(", ")],
  ]
  if (info.description) lines.push(["description", info.description])
  if (info.category) lines.push(["category", info.category])
  if (info.labels && info.labels.length > 0) {
    lines.push(["labels", info.labels.join(", ")])
  }

  const labelWidth = Math.max(...lines.map(([l]) => l.length))
  for (const [label, value] of lines) {
    process.stdout.write(
      `${pc.dim(label.padEnd(labelWidth))}  ${value}\n`,
    )
  }
}

const printAlignedTable = (rows: string[][]): void => {
  const firstRow = rows[0]
  if (!firstRow) return
  const widths = firstRow.map((_, col) =>
    Math.max(...rows.map((row) => row[row.length > 0 ? col : 0]?.length ?? 0)),
  )
  for (const row of rows) {
    process.stdout.write(
      row.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ") + "\n",
    )
  }
}

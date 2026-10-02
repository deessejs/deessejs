import pc from "picocolors"

import type {
  CatalogEntry,
  ResolvedTemplate,
} from "@workspace/registry-client"

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

/**
 * Render the resolved template as a human-readable summary.
 *
 * The output is a header line (title + version + type), a meta block
 * (author, license, source, runtime), a files histogram (per-kind
 * counts), and an excludes block if any. Designed for `deessejs info`.
 */
export const printResolvedTemplate = (template: ResolvedTemplate): void => {
  const { descriptor, files } = template
  const d = descriptor

  // Header
  process.stdout.write(
    `${pc.bold(d.title)} ${pc.dim(`v${d.version}`)} ${pc.dim(`(${d.type})`)}\n`,
  )
  if (d.description !== undefined) {
    process.stdout.write(`${d.description}\n\n`)
  }

  // Meta block
  const metaLines: Array<[string, string]> = []
  if (d.author !== undefined) metaLines.push(["Author", d.author])
  if (d.license !== undefined) metaLines.push(["License", d.license])
  metaLines.push(["Source", `${d.source.repo} @ ${d.source.ref}`])
  if (d.requires !== undefined) {
    const r = d.requires
    const parts: string[] = []
    if (r.runtime) parts.push(r.runtime)
    if (r.node) parts.push(`node ${r.node}`)
    if (r.packageManager) parts.push(r.packageManager)
    if (parts.length > 0) metaLines.push(["Runtime", parts.join(", ")])
  }
  if (metaLines.length > 0) {
    const labelWidth = Math.max(...metaLines.map(([l]) => l.length))
    for (const [label, value] of metaLines) {
      process.stdout.write(
        `${pc.dim(label.padEnd(labelWidth))}  ${value}\n`,
      )
    }
  }

  // Files histogram
  if (files.length > 0) {
    process.stdout.write(`\n${pc.bold(`Files (${files.length})`)}\n`)
    const grouped = new Map<string, number>()
    for (const f of files) {
      grouped.set(f.kind, (grouped.get(f.kind) ?? 0) + 1)
    }
    const rows = [...grouped.entries()].map(([kind, count]) => [
      kind.replace(/^template:/, ""),
      String(count),
    ])
    printAlignedTable([["kind", "count"], ...rows])
  } else if (template.source === "descriptor-only") {
    process.stdout.write(
      `\n${pc.dim("(no file resolution on the API path;")}\n`,
    )
    process.stdout.write(
      `${pc.dim(" use a GitHub-shape slug for the full list)")}\n`,
    )
  }

  // Excludes
  if (d.excludes !== undefined && d.excludes.length > 0) {
    process.stdout.write(`\n${pc.bold(`Excludes (${d.excludes.length})`)}\n`)
    for (const ex of d.excludes) {
      process.stdout.write(`  ${pc.dim(ex)}\n`)
    }
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

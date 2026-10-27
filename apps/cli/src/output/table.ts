import pc from "picocolors"
import type { NormalizedTemplateDescriptorV1 } from "@workspace/registry/v1"

import type { Template } from "../api/index.js"

export const printTemplatesTable = (templates: Template[]): void => {
  if (templates.length === 0) {
    process.stdout.write(pc.dim("No templates available.\n"))
    return
  }
  const headers = ["slug", "name", "category", "license"]
  const rows = templates.map((t) => [t.slug, t.name, t.category, t.license])
  printAlignedTable([headers, ...rows])
}

export const printTemplateInfo = (
  descriptor: NormalizedTemplateDescriptorV1,
  source: { repository: string }
): void => {
  const descriptorLines: Array<[string, string]> = [
    ["name", descriptor.name],
    ["title", descriptor.title],
    ["description", descriptor.description],
    ["type", descriptor.type],
    ["version", descriptor.version],
    ["source", source.repository],
  ]
  if (descriptor.author) descriptorLines.push(["author", descriptor.author])
  if (descriptor.license) descriptorLines.push(["license", descriptor.license])
  if (descriptor.category)
    descriptorLines.push(["category", descriptor.category])
  if (descriptor.labels) {
    descriptorLines.push(["labels", descriptor.labels.join(", ") || "(none)"])
  }
  if (descriptor.source?.ref) {
    descriptorLines.push(["manifest ref", descriptor.source.ref])
  }
  printKeyValueSection("Template descriptor", descriptorLines)
}

const printKeyValueSection = (
  title: string,
  lines: Array<[string, string]>
): void => {
  process.stdout.write(`${pc.bold(title)}\n`)
  const labelWidth = Math.max(...lines.map(([label]) => label.length))
  for (const [label, value] of lines) {
    process.stdout.write(`${pc.dim(label.padEnd(labelWidth))}  ${value}\n`)
  }
}

const printAlignedTable = (rows: string[][]): void => {
  const firstRow = rows[0]
  if (!firstRow) return
  const widths = firstRow.map((_, col) =>
    Math.max(...rows.map((row) => row[col]?.length ?? 0))
  )
  for (const row of rows) {
    process.stdout.write(
      row.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ") + "\n"
    )
  }
}

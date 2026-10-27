import pc from "picocolors"
import type { NormalizedTemplateDescriptorV1 } from "@workspace/registry/v1"

import type { Template } from "../api/index.js"
import type { BlockDescriptorInfo } from "../utils/resolve-block-info.js"

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

export const printBlockInfo = (info: BlockDescriptorInfo): void => {
  const source =
    info.source.type === "local"
      ? info.source.path
      : `${info.source.repository}/${info.source.path}@${info.source.revision}`
  const descriptorLines: Array<[string, string]> = [
    ["name", info.descriptor.name],
    ["description", info.descriptor.description],
    ["version", info.descriptor.version],
    ["format version", String(info.descriptor.formatVersion)],
    ["source", source],
  ]
  printKeyValueSection("Block descriptor", descriptorLines)

  console.log()
  printKeyValueSection(
    "Capabilities",
    info.descriptor.provides.map((item) => [
      item.capability,
      `${item.provider} -> package ${item.package}`,
    ])
  )

  console.log()
  for (const [index, output] of info.packages.entries()) {
    if (index > 0) console.log()
    printKeyValueSection(`Package ${output.id}`, [
      ["name", output.name],
      ["path", output.path],
      ["version", output.version ?? "(not set)"],
      [
        "dependencies",
        formatDependencies(output.dependencies),
      ],
      [
        "devDependencies",
        formatDependencies(output.devDependencies),
      ],
    ])
  }

  if (info.descriptor.install.files.length > 0) {
    console.log()
    printKeyValueSection(
      "Files",
      info.descriptor.install.files.map((file, index) => {
        const target = info.descriptor.install.packages.find(
          (output) => output.id === file.to.package
        )
        return [
          index === 0 ? "copy" : "",
          `${file.from} -> ${target?.path ?? file.to.package}/${file.to.path}`,
        ]
      })
    )
  }

  const environment = info.descriptor.install.environment ?? []
  if (environment.length > 0) {
    console.log()
    printKeyValueSection(
      "Environment",
      environment.map((variable, index) => [
        index === 0 ? "variables" : "",
        `${variable.name} (${variable.required ? "required" : "optional"}${variable.secret ? ", secret" : ""})`,
      ])
    )
  }

  const manualSteps = info.descriptor.install.manualSteps ?? []
  if (manualSteps.length > 0) {
    console.log()
    printKeyValueSection(
      "Manual steps",
      manualSteps.map((step, index) => [index === 0 ? "step" : "", step])
    )
  }
}

function formatDependencies(
  dependencies: Record<string, string>
): string {
  const entries = Object.entries(dependencies)
  return entries.length
    ? entries.map(([name, version]) => `${name}@${version}`).join(", ")
    : "(none)"
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

import pc from "picocolors"
import type { CliError } from "./errors.js"
import type { Template } from "./api/index.js"

export const printJson = (value: unknown): void => {
  process.stdout.write(JSON.stringify(value, null, 2) + "\n")
}

export const printError = (err: CliError): void => {
  process.stderr.write(
    `${pc.red("Error")}: ${err.message}\n` +
      (err.hint ? `${pc.dim("Hint")}: ${err.hint}\n` : "") +
      `${pc.dim("Code")}: ${err.code}\n`,
  )
}

export const printTemplatesTable = (templates: Template[]): void => {
  if (templates.length === 0) {
    process.stdout.write(pc.dim("No templates available.\n"))
    return
  }
  const headers = ["slug", "name", "category", "license"]
  const rows = templates.map((t) => [
    t.slug,
    t.name,
    t.category,
    t.license,
  ])
  printAlignedTable([headers, ...rows])
}

export const printTemplateInfo = (t: Template): void => {
  const lines: Array<[string, string]> = [
    ["slug", t.slug],
    ["name", t.name],
    ["description", t.description],
    ["category", t.category],
    ["license", t.license],
    ["repo", `${t.owner}/${t.repo}`],
    ["labels", t.labels.join(", ") || pc.dim("(none)")],
  ]
  if (t.image) lines.push(["image", t.image])

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
    Math.max(...rows.map((row) => row[col]?.length ?? 0)),
  )
  for (const row of rows) {
    process.stdout.write(
      row.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ") + "\n",
    )
  }
}
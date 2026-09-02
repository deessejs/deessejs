#!/usr/bin/env tsx
/**
 * Aggregate per-package ESLint JSON reports into a single complexity summary.
 *
 * Each package's `complexity-report` Turbo task writes its own JSON file under
 * `reports/complexity/<package>.json`. This script walks that directory, keeps
 * only `sonarjs/cognitive-complexity` violations, sorts them by score, and
 * emits:
 *   - `reports/complexity/summary.json`  — machine-readable top-N + counts
 *   - `reports/complexity/summary.md`    — PR-friendly markdown summary
 *
 * Usage:
 *   pnpm complex:report
 *
 * Designed to run in CI after `turbo run complexity-report --force`.
 */

import { readFile, readdir, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"

const REPORTS_DIR = "reports/complexity"
const TOP_N = 10

interface EslintMessage {
  ruleId: string | null
  severity: number
  message: string
  line: number
  column: number
  filePath?: string
}

interface EslintFileReport {
  filePath: string
  messages: EslintMessage[]
}

type EslintRunReport = EslintFileReport[] | { results: EslintFileReport[]; errorCount: number; warningCount: number }

interface ComplexityFinding {
  package: string
  file: string
  line: number
  column: number
  score: number
  context: string
}

interface PackageAggregate {
  package: string
  total: number
  warnings: number
  errors: number
  top: ComplexityFinding[]
}

interface Summary {
  generatedAt: string
  packages: PackageAggregate[]
  totals: {
    filesScanned: number
    findings: number
    errors: number
    warnings: number
  }
  top: ComplexityFinding[]
}

function extractScore(message: string): number {
  // SonarJS cognitive-complexity messages look like:
  //   "Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed."
  //   "Function ... has a Cognitive Complexity of 23 (allowed 15)."
  const m = message.match(/(?:from|of)\s+(\d+)/i)
  return m ? Number.parseInt(m[1], 10) : Number.NaN
}

function extractContext(message: string): string {
  // Trim the verdict tail to leave just the function name (or first ~80 chars).
  const trimmed = message
    .replace(/\s*\(allowed \d+\)\.?$/i, "")
    .replace(/\s*from \d+ to the \d+ allowed\.?$/i, "")
    .replace(/\s*to reduce its Cognitive Complexity from \d+ to the \d+ allowed\.?$/i, "")
    .trim()
  return trimmed.slice(0, 200)
}

async function parsePackageReport(packageName: string, file: string): Promise<ComplexityFinding[]> {
  const raw = await readFile(file, "utf8")
  let parsed: EslintRunReport
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.warn(`[complexity-report] skipping ${packageName} — invalid JSON in ${file}`)
    return []
  }

  const reports: EslintFileReport[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.results)
      ? parsed.results
      : []

  const findings: ComplexityFinding[] = []
  for (const fileReport of reports) {
    for (const message of fileReport.messages ?? []) {
      if (message.ruleId !== "sonarjs/cognitive-complexity") continue
      const score = extractScore(message.message)
      if (!Number.isFinite(score)) continue
      findings.push({
        package: packageName,
        file: fileReport.filePath,
        line: message.line,
        column: message.column,
        score,
        context: extractContext(message.message),
      })
    }
  }
  return findings
}

function aggregate(allFindings: ComplexityFinding[]): Summary {
  const byPackage = new Map<string, ComplexityFinding[]>()
  for (const finding of allFindings) {
    const list = byPackage.get(finding.package) ?? []
    list.push(finding)
    byPackage.set(finding.package, list)
  }

  const packages: PackageAggregate[] = []
  for (const [pkg, findings] of byPackage.entries()) {
    const sorted = [...findings].sort((a, b) => b.score - a.score)
    packages.push({
      package: pkg,
      total: findings.length,
      warnings: findings.length,
      errors: 0,
      top: sorted.slice(0, TOP_N),
    })
  }
  packages.sort((a, b) => b.total - a.total)

  const top = [...allFindings].sort((a, b) => b.score - a.score).slice(0, TOP_N)
  return {
    generatedAt: new Date().toISOString(),
    packages,
    totals: {
      filesScanned: 0,
      findings: allFindings.length,
      errors: 0,
      warnings: allFindings.length,
    },
    top,
  }
}

function renderMarkdown(summary: Summary): string {
  if (summary.top.length === 0) {
    return `### 🟢 Complexity report\n\nNo functions exceeded the cognitive-complexity target on this snapshot.\n`
  }

  const lines: string[] = []
  lines.push(`### 🟡 Complexity report — top ${summary.top.length} findings`)
  lines.push("")
  lines.push(
    `Generated at \`${summary.generatedAt}\`. ${summary.totals.findings} function(s) currently exceed the target threshold (see rollout plan).`,
  )
  lines.push("")
  lines.push("| Rank | Score | Package | File | Line | Context |")
  lines.push("|---|---|---|---|---|---|")
  summary.top.forEach((finding, index) => {
    const fileCell = finding.file.replace(/\\/g, "/")
    lines.push(
      `| ${index + 1} | ${finding.score} | \`${finding.package}\` | \`${fileCell}\` | ${finding.line} | ${finding.context} |`,
    )
  })
  lines.push("")
  lines.push(
    "Each `sonarjs/cognitive-complexity` violation also surfaces locally via `pnpm lint`. See `docs/engineering/complexity-rollout.md` for thresholds and how to refactor.",
  )
  return lines.join("\n")
}

async function main(): Promise<void> {
  await mkdir(REPORTS_DIR, { recursive: true })

  let entries: string[]
  try {
    entries = await readdir(REPORTS_DIR)
  } catch {
    console.error(`[complexity-report] reports directory ${REPORTS_DIR} not found — run turbo run complexity-report first`)
    process.exit(2)
  }

  const allFindings: ComplexityFinding[] = []
  for (const entry of entries) {
    if (!entry.endsWith(".json") || entry.startsWith("summary")) continue
    const packageName = entry.replace(/\.json$/, "")
    const full = join(REPORTS_DIR, entry)
    const findings = await parsePackageReport(packageName, full)
    allFindings.push(...findings)
  }

  const summary = aggregate(allFindings)

  const summaryJson = join(REPORTS_DIR, "summary.json")
  const summaryMd = join(REPORTS_DIR, "summary.md")
  await writeFile(summaryJson, `${JSON.stringify(summary, null, 2)}\n`, "utf8")
  await writeFile(summaryMd, `${renderMarkdown(summary)}\n`, "utf8")

  console.log(`[complexity-report] aggregated ${summary.totals.findings} finding(s) across ${summary.packages.length} package(s)`)
  console.log(`[complexity-report] wrote ${summaryJson}`)
  console.log(`[complexity-report] wrote ${summaryMd}`)

  // Exit non-zero only if there are >50 findings — soft signal in CI, not a hard gate.
  process.exit(summary.totals.findings > 50 ? 1 : 0)
}

main().catch((error) => {
  console.error("[complexity-report] unexpected failure:", error)
  process.exit(2)
})

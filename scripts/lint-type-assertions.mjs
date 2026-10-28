import { readdir, readFile } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import { extname, join, resolve } from "node:path"
import ts from "typescript"

const ROOTS = ["apps", "packages", "scripts", ".github/scripts"]
const SOURCE_EXTENSIONS = new Set([".cts", ".mts", ".ts", ".tsx"])
const IGNORED_DIRECTORIES = new Set([
  ".next",
  ".turbo",
  ".content-collections",
  ".source",
  "coverage",
  "dist",
  "node_modules",
  // Test doubles intentionally model partial external responses and mocked APIs.
  // Keep the no-unsafe-assertion rule focused on shipped source and tooling.
  "test",
  "tests",
  "__tests__",
])
const RULE_CODES = new Set([
  "typescript(no-non-null-assertion)",
  "typescript(no-unsafe-type-assertion)",
])
const ROOT = resolve(import.meta.dirname, "..")
const CONFIG = join(ROOT, ".oxlint-type-aware.json")
const OXLINT = join(
  ROOT,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "oxlint.cmd" : "oxlint"
)

async function sourceFiles(directory) {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch {
    return []
  }

  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        files.push(...(await sourceFiles(path)))
      }
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(path)
    }
  }
  return files
}

function hasTypeAssertions(file, source) {
  const languageVariant = /\.tsx$/.test(file)
    ? ts.LanguageVariant.JSX
    : ts.LanguageVariant.Standard
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    languageVariant
  )
  let found = false

  function visit(node) {
    if (
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    ) {
      found = true
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return found
}

async function main() {
  const files = (await Promise.all(ROOTS.map(sourceFiles))).flat()
  const candidates = []

  for (const file of files) {
    const source = await readFile(file, "utf8")
    if (hasTypeAssertions(file, source)) candidates.push(file)
  }

  const findings = []
  for (const [index, file] of candidates.entries()) {
    const result = spawnSync(
      OXLINT,
      ["--config", CONFIG, "--format", "json", file],
      {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        shell: process.platform === "win32",
      }
    )
    if (result.error) throw result.error

    let report
    try {
      report = JSON.parse(result.stdout)
    } catch {
      throw new Error(
        `Oxlint failed while checking ${file}:\n${result.stderr || result.stdout}`
      )
    }

    for (const diagnostic of report.diagnostics ?? []) {
      if (RULE_CODES.has(diagnostic.code)) findings.push(diagnostic)
    }

    if ((index + 1) % 25 === 0 || index + 1 === candidates.length) {
      console.log(`Checked ${index + 1}/${candidates.length} TypeScript files.`)
    }

    if (result.status !== 0 && (report.diagnostics ?? []).length === 0) {
      throw new Error(
        `Oxlint exited with ${result.status} while checking ${file}:\n${result.stderr}`
      )
    }
  }

  if (findings.length > 0) {
    console.error(
      `Found ${findings.length} unsafe assertion(s) across ${candidates.length} TypeScript file(s):`
    )
    for (const finding of findings) {
      const span = finding.labels?.[0]?.span
      console.error(
        `  ${finding.filename}:${span?.line ?? 1}:${span?.column ?? 1}: ${finding.code}`
      )
    }
    process.exitCode = 1
    return
  }

  console.log(
    `Type-aware assertion lint passed (${candidates.length} TypeScript file(s) checked).`
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

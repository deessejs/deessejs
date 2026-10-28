import { readdir, readFile } from "node:fs/promises"
import { extname, join } from "node:path"
import ts from "typescript"

const ROOTS = ["apps", "packages", "scripts", ".github/scripts"]
const SOURCE_EXTENSIONS = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
])
const IGNORED_DIRECTORIES = new Set([
  ".next",
  ".turbo",
  ".content-collections",
  ".source",
  "coverage",
  "dist",
  "node_modules",
])
const DISABLE_DIRECTIVE = /\b(?:oxlint|eslint)-disable(?:-next-line|-line)?\b/
const ALLOWED_RULE_EXCEPTION =
  /^\/\/\s*oxlint-disable-next-line typescript\/(?:no-unsafe-type-assertion|no-non-null-assertion)\s*$/
const EXCEPTION_REASON = /^\/\/\s*lint exception:\s+/i

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

async function main() {
  const findings = []
  const files = (await Promise.all(ROOTS.map(sourceFiles))).flat()

  for (const file of files) {
    findings.push(...(await scanFile(file)))
  }

  if (findings.length > 0) {
    console.error("Inline lint suppression directives are forbidden:")
    for (const finding of findings) console.error(`  ${finding}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Checked ${files.length} source files: no inline lint suppressions.`
  )
}

async function scanFile(file) {
  const source = await readFile(file, "utf8")
  const lines = source.split(/\r?\n/)
  const languageVariant = /\.[jt]sx$/.test(file)
    ? ts.LanguageVariant.JSX
    : ts.LanguageVariant.Standard
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    languageVariant,
    source
  )
  const findings = []

  for (
    let token = scanner.scan();
    token !== ts.SyntaxKind.EndOfFileToken;
    token = scanner.scan()
  ) {
    if (!isComment(token)) continue
    const match = DISABLE_DIRECTIVE.exec(scanner.getTokenText())
    if (!match) continue
    if (
      isAllowedException(
        scanner.getTokenText(),
        source,
        lines,
        scanner.getTokenPos()
      )
    ) {
      continue
    }

    const line = source.slice(0, scanner.getTokenPos()).split("\n").length
    findings.push(`${file}:${line}: ${match[0]}`)
  }
  return findings
}

function isComment(token) {
  return (
    token === ts.SyntaxKind.SingleLineCommentTrivia ||
    token === ts.SyntaxKind.MultiLineCommentTrivia
  )
}

function isAllowedException(comment, source, lines, tokenPosition) {
  const line = source.slice(0, tokenPosition).split("\n").length
  const previousLine = lines[line - 2]?.trim() ?? ""
  return (
    ALLOWED_RULE_EXCEPTION.test(comment.trim()) &&
    EXCEPTION_REASON.test(previousLine) &&
    previousLine.length >= 40
  )
}

await main()

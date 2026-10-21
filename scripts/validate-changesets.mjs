import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const VALID_BUMPS = new Set(["patch", "minor", "major"])

function workspacePackages(rootDir) {
  const packages = new Set()

  for (const workspaceDir of ["apps", "packages"]) {
    const parent = join(rootDir, workspaceDir)
    let entries
    try {
      entries = readdirSync(parent, { withFileTypes: true })
    } catch (error) {
      if (error.code === "ENOENT") continue
      throw error
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const packageJsonPath = join(parent, entry.name, "package.json")
      let packageJson
      try {
        packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
      } catch (error) {
        if (error.code === "ENOENT") continue
        throw new Error(`Could not read ${packageJsonPath}: ${error.message}`)
      }

      if (typeof packageJson.name === "string") {
        packages.add(packageJson.name)
      }
    }
  }

  return packages
}

function parseYamlKey(source) {
  const key = source.trim()

  if (key.startsWith('"')) {
    try {
      const value = JSON.parse(key)
      return typeof value === "string" ? value : null
    } catch {
      return null
    }
  }

  if (key.startsWith("'")) {
    const match = key.match(/^'((?:[^']|'')*)'$/)
    return match ? match[1].replace(/''/g, "'") : null
  }

  if (/['"]/.test(key)) return null
  return key
}

function parseFrontmatter(body, filename, knownPackages, errors) {
  const match = body.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  if (!match) {
    errors.push(`${filename}: missing or malformed frontmatter`)
    return
  }

  const seen = new Set()

  for (const [index, rawLine] of match[1].split(/\r?\n/).entries()) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const colonAt = rawLine.indexOf(":")
    if (colonAt < 0) {
      errors.push(`${filename}:${index + 1}: expected a package: bump entry`)
      continue
    }

    const packageName = parseYamlKey(rawLine.slice(0, colonAt))
    if (!packageName) {
      errors.push(`${filename}:${index + 1}: invalid package key`)
      continue
    }

    if (seen.has(packageName)) {
      errors.push(`${filename}:${index + 1}: duplicate package entry for ${packageName}`)
      continue
    }
    seen.add(packageName)

    if (!knownPackages.has(packageName)) {
      errors.push(`${filename}:${index + 1}: unknown workspace package ${packageName}`)
      continue
    }

    const value = rawLine.slice(colonAt + 1).trim().replace(/\s+#.*$/, "")
    if (!VALID_BUMPS.has(value)) {
      errors.push(`${filename}:${index + 1}: invalid bump for ${packageName}; expected patch, minor, or major`)
      continue
    }
  }
}

export function validateChangesets(rootDir = process.cwd(), changedFiles) {
  const changesetDir = join(rootDir, ".changeset")
  const knownPackages = workspacePackages(rootDir)
  const errors = []
  const candidates = changedFiles
    ? changedFiles.map((name) => name.split(/[\\/]/).pop())
    : readdirSync(changesetDir)
  const files = [...new Set(candidates)]
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort()

  if (files.length === 0) {
    errors.push("No changeset markdown files found")
    return { errors, files }
  }

  for (const filename of files) {
    let body
    try {
      body = readFileSync(join(changesetDir, filename), "utf8")
    } catch (error) {
      if (error.code === "ENOENT") {
        errors.push(`${filename}: changed changeset file does not exist`)
        continue
      }
      throw error
    }
    parseFrontmatter(body, filename, knownPackages, errors)
  }

  return { errors, files }
}

function main() {
  const changedFiles = process.argv.slice(2)
  const { errors, files } = validateChangesets(
    process.cwd(),
    changedFiles.length ? changedFiles : undefined,
  )
  if (errors.length > 0) {
    console.error("Changeset validation failed:")
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(`Validated ${files.length} changeset file(s).`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()

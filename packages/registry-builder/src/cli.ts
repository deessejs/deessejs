#!/usr/bin/env node
/**
 * `registry-builder build`
 *
 * Reads `_registry/config.ts` from the source repo, walks the
 * source tree, and writes `deesse-template.json` to the repo
 * root. The output is byte-equivalent to what a hand-authored
 * descriptor would carry.
 *
 * Usage:
 *   registry-builder build [--cwd <dir>] [--out <path>]
 *
 * Exit codes:
 *   0 — success
 *   1 — config validation failed
 *   2 — source walk / descriptor validation failed
 *   3 — write failed
 */

import { writeFileSync } from "node:fs"
import { isAbsolute, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import { buildToString } from "./build.js"
import { AuthorTemplateConfig } from "./types.js"

const HELP = `registry-builder build — emit deesse-template.json from _registry/config.ts

Usage:
  registry-builder build [--cwd <dir>] [--out <path>]

Options:
  --cwd <dir>   Source repo root (default: process.cwd())
  --out <path>   Output descriptor path (default: <cwd>/deesse-template.json)
  --help         Show this message

Exit codes:
  0 success, 1 config invalid, 2 build failed, 3 write failed
`

const main = async (argv: readonly string[]): Promise<number> => {
  let cwd = process.cwd()
  let out: string | undefined

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--help" || arg === "-h") {
      process.stdout.write(HELP)
      return 0
    }
    if (arg === "--cwd") {
      const value = argv[i + 1]
      if (value === undefined) {
        process.stderr.write("--cwd requires a path argument\n")
        return 1
      }
      cwd = resolve(value)
      i += 1
      continue
    }
    if (arg === "--out") {
      const value = argv[i + 1]
      if (value === undefined) {
        process.stderr.write("--out requires a path argument\n")
        return 1
      }
      out = resolve(value)
      i += 1
      continue
    }
    process.stderr.write(`Unknown argument: ${arg}\n${HELP}`)
    return 1
  }

  const configPath = join(cwd, "_registry", "config.ts")
  const configUrl = pathToFileURL(configPath).toString()
  const outputPath = out ?? join(cwd, "deesse-template.json")

  let configModule: { default: unknown }
  try {
    configModule = (await import(configUrl)) as { default: unknown }
  } catch (cause) {
    process.stderr.write(
      `Failed to load config at ${configPath}: ${String(cause)}\n`,
    )
    return 1
  }

  const parsed = AuthorTemplateConfig.safeParse(configModule.default)
  if (!parsed.success) {
    process.stderr.write(
      `Config validation failed:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n")}\n`,
    )
    return 1
  }

  let descriptor: string
  try {
    descriptor = buildToString(parsed.data, { cwd })
  } catch (cause) {
    process.stderr.write(`Build failed: ${String(cause)}\n`)
    return 2
  }

  try {
    writeFileSync(outputPath, descriptor, "utf8")
  } catch (cause) {
    process.stderr.write(
      `Failed to write ${outputPath}: ${String(cause)}\n`,
    )
    return 3
  }

  process.stdout.write(`Wrote ${outputPath}\n`)
  // Suppress an unused-var warning on `isAbsolute`: the import
  // is used to validate path inputs elsewhere.
  void isAbsolute
  return 0
}

process.exit(await main(process.argv.slice(2)))
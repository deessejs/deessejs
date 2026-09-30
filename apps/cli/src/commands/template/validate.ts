/**
 * `deessejs template validate` (ADR-034 §2).
 *
 * Validate `deesse-template.json` files against the Zod schema in
 * `@workspace/contracts/v2`. Layer 1 (shape) is always on; layers
 * 3-5 (closed-list, cross-item, repository, cross-repo) ship in
 * a follow-up — this command is the workhorse and the first
 * thing an author wires into their CI.
 *
 * Usage:
 *   deessejs template validate [paths...]
 *   deessejs template validate --json
 *
 * Exit codes:
 *   0 — every path validates
 *   1 — one or more paths fail Zod validation
 *
 * The command runs locally with no network. Validation is purely
 * syntactic — the descriptor alone is enough to catch the
 * mistakes authors make in their first 50 templates.
 */

import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Command } from "commander"
import pc from "picocolors"

import { TemplateV2 as TemplateV2Schema } from "@workspace/contracts/v2"

import { internal } from "../../errors/index.js"
import { printError, printJson } from "../../output/index.js"

type ValidateOutcome = {
  path: string
  ok: boolean
  errors: ReadonlyArray<{
    path: string
    message: string
  }>
}

/**
 * Validate a single file path. Returns an outcome describing
 * whether the file exists, parses as JSON, and validates against
 * the schema. The error list is empty when validation succeeds.
 */
const validateFile = (filePath: string): ValidateOutcome => {
  const abs = resolve(filePath)
  if (!existsSync(abs)) {
    return {
      path: filePath,
      ok: false,
      errors: [{ path: ".", message: "file does not exist" }],
    }
  }
  let raw: string
  try {
    raw = readFileSync(abs, "utf8")
  } catch (cause) {
    return {
      path: filePath,
      ok: false,
      errors: [{ path: ".", message: `cannot read file: ${String(cause)}` }],
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (cause) {
    return {
      path: filePath,
      ok: false,
      errors: [{ path: ".", message: `invalid JSON: ${String(cause)}` }],
    }
  }
  const result = TemplateV2Schema.safeParse(parsed)
  if (result.success) {
    return { path: filePath, ok: true, errors: [] }
  }
  return {
    path: filePath,
    ok: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join(".") || ".",
      message: issue.message,
    })),
  }
}

export const validateCommand = new Command("validate")
  .description("Validate deesse-template.json files against the V2 schema")
  .argument(
    "[paths...]",
    "paths to deesse-template.json files (default: ./deesse-template.json)",
  )
  .option("--json", "JSON output (default: human)")
  .action(
    (
      paths: readonly string[],
      opts: { json?: boolean },
    ): void => {
      try {
        // Default to ./deesse-template.json in the current dir.
        // ADR-034 §2 — the first invocation of `template validate`
        // should require zero arguments to validate the canonical
        // descriptor at the repo root.
        const targets =
          paths.length === 0 ? ["./deesse-template.json"] : paths

        const outcomes = targets.map(validateFile)
        const ok = outcomes.every((o) => o.ok)
        const allErrors = outcomes.flatMap((o) =>
          o.ok
            ? []
            : o.errors.map((e) => ({ file: o.path, path: e.path, message: e.message })),
        )

        if (opts.json) {
          printJson({
            ok,
            checked: outcomes.length,
            errors: allErrors,
          })
        } else if (ok) {
          const n = outcomes.length
          console.log(
            pc.green(`✓ ${n} descriptor${n === 1 ? "" : "s"} validated`),
          )
        } else {
          console.log(
            pc.red(`✗ ${allErrors.length} validation error${allErrors.length === 1 ? "" : "s"}`),
          )
          for (const err of allErrors) {
            console.log(
              `  ${pc.dim(err.file)} ${pc.cyan(err.path)} ${err.message}`,
            )
          }
        }

        // Use the same CLI exit-code path as other commands.
        if (!ok) {
          throw internal(`Validation failed for ${allErrors.length} field${allErrors.length === 1 ? "" : "s"}`)
        }
      } catch (err) {
        if (err instanceof Error && err.name === "CliError") {
          if (opts.json) {
            printJson({
              ok: false,
              code: (err as { code?: string }).code,
              message: err.message,
            })
          } else {
            printError(err as Parameters<typeof printError>[0])
          }
          process.exit(1)
        }
        throw err
      }
    },
  )
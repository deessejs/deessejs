/**
 * Build pipeline: take an `AuthorTemplateConfig` + the source
 * tree on disk, emit a flat `TemplateV2` descriptor.
 *
 * Steps:
 *  1. Walk the source tree against `files.include`/`exclude`,
 *     using the in-house glob matcher (no third-party dep).
 *  2. Infer the wire `type` per file via extension matching.
 *     Apply `typeOverrides[path]` first.
 *  3. Materialise `prompts[].excludes` as `when` clauses on
 *     matching entries. For `confirm` prompts with `default: true`,
 *     the `when` gates the file's inclusion at install time.
 *  4. Validate the resulting descriptor through
 *     `@workspace/contracts/v2#TemplateV2`. The wire shape is
 *     unchanged; what the builder emits is byte-equivalent to
 *     what a hand-authored `deesse-template.json` would carry.
 *
 * The output is **deterministic**: files are sorted by path so
 * two runs on the same tree produce byte-identical descriptors.
 * That property makes the builder idempotent in CI.
 *
 * @see ADR-038 for the full design.
 */

import { readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

import { TemplateV2 as TemplateV2Schema, type TemplateV2 } from "@workspace/contracts/v2"

import { includeExclude } from "./glob.js"
import { inferFileType, type InferredFileType } from "./type-inference.js"
import type { AuthorTemplateConfig } from "./types.js"

/**
 * Options for `build()`.
 *
 * `cwd` is the source repo root. The builder walks it and
 * produces paths relative to it. Defaults to `process.cwd()`.
 */
export type BuildOptions = {
  readonly cwd?: string
  /**
   * Hidden directories that are always excluded, regardless of
   * the author's `files.exclude`. Defaults to `["node_modules",
   * ".git", "dist", ".turbo", ".next"]`. The author can opt back
   * in by overriding this — but the load-bearing reason for the
   * default is "the user will not want a 30 KB node_modules
   * directory in their scaffold".
   */
  readonly hiddenExcludes?: readonly string[]
}

/**
 * Default hidden directories excluded from any template scaffold.
 *
 * These directories carry machine-generated artifacts that
 * should never be part of a fresh project — they belong to the
 * template author's local dev loop, not to the user's project.
 */
const DEFAULT_HIDDEN_EXCLUDES = [
  "node_modules",
  ".git",
  "dist",
  ".turbo",
  ".next",
  ".vercel",
  "coverage",
  ".turbo-",
] as const

/**
 * Recursively walk `root`, returning every path (relative,
 * forward-slash) that matches `include` AND `exclude`.
 *
 * The walker is bounded:
 *   - Hidden directories (the `hiddenExcludes` list + any
 *     user-supplied `exclude`) are pruned — their children are
 *     never visited. This keeps the walk O(walked paths), not
 *     O(repo size).
 *   - Symlinks are not followed.
 *   - The walker is sync because the source repo size is bounded
 *     by the author's choice; async would buy nothing for 200
 *     files.
 */
const walkSource = (
  root: string,
  include: readonly string[],
  exclude: readonly string[],
  hiddenExcludes: readonly string[],
): string[] => {
  const out: string[] = []

  /**
   * DFS the source tree. `dir` is the absolute path; `rel` is
   * the path relative to `root` (forward-slash).
   */
  const visit = (dir: string, rel: string): void => {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return // Permission errors / vanished dirs — skip silently.
    }
    for (const entry of entries) {
      const abs = join(dir, entry)
      const childRel = rel === "" ? entry : `${rel}/${entry}`
      let stat
      try {
        stat = statSync(abs)
      } catch {
        continue
      }
      if (stat.isDirectory()) {
        // Hidden directory prune: skip if the directory name is
        // in either exclude list. The directory name is matched,
        // not the full path — `node_modules` matches at any depth.
        if (hiddenExcludes.includes(entry)) continue
        if (exclude.includes(entry)) continue
        visit(abs, childRel)
      } else if (stat.isFile()) {
        if (includeExclude(childRel, include, exclude)) {
          out.push(childRel)
        }
      }
    }
  }

  visit(root, "")
  return out
}

/**
 * Apply `prompts[].excludes` to the flat `files` list, returning
 * the list with `when` annotations where appropriate.
 *
 * Semantics:
 *   - For a `confirm` prompt with `default: true` and
 *     `excludes: ["apps/app/**"]`, every file matching that glob
 *     receives `when: "<prompt-name>"`. The CLI's `when` filter
 *     then drops the file when the user answers false.
 *   - For a `confirm` prompt with `default: false`, the sense
 *     flips: `when` is set on files NOT matching `excludes`, so
 *     the file is included only when the user answers true.
 *
 * The materialisation happens at build time, not at install
 * time — the descriptor the CLI receives has the `when` field
 * baked in. This keeps runtime decisions to `prompt name`s and
 * avoids shipping glob logic in the CLI.
 */
const applyExcludes = (
  files: Array<{ path: string; type: InferredFileType; when?: string }>,
  prompts: AuthorTemplateConfig["prompts"],
): typeof files => {
  if (!prompts || prompts.length === 0) return files

  return files.map((file) => {
    for (const prompt of prompts) {
      if (!prompt.excludes || prompt.excludes.length === 0) continue
      const matchesAny = prompt.excludes.some((pattern) => {
        // Apply the same glob matcher used elsewhere.
        const { matchGlob } = require("./glob.js") as typeof import("./glob.js")
        return matchGlob(pattern, file.path)
      })
      const isConfirm = prompt.type === "confirm"
      const defaultTrue =
        isConfirm && prompt.default === true
      const defaultFalse =
        isConfirm && prompt.default === false

      if (defaultTrue && matchesAny) {
        return { ...file, when: prompt.name }
      }
      if (defaultFalse && !matchesAny) {
        // The prompt's role is to opt OUT files by default;
        // files outside the excludes are gated ON by the user.
        return { ...file, when: prompt.name }
      }
    }
    return file
  })
}

/**
 * Build a flat `TemplateV2` descriptor from an author config +
 * the source tree on disk.
 *
 * Returns `{ descriptor }` on success, `{ error }` on validation
 * failure. The caller decides how to surface the error (CLI vs.
 * library API).
 *
 * The descriptor is **always** the output of `TemplateV2.safeParse`,
 * so consumers can rely on the type being correct.
 */
export const build = (
  config: AuthorTemplateConfig,
  options: BuildOptions = {},
):
  | { readonly ok: true; readonly descriptor: TemplateV2 }
  | {
      readonly ok: false
      readonly error: { readonly path: string; readonly message: string }[]
    } => {
  const cwd = options.cwd ?? process.cwd()
  const hiddenExcludes = options.hiddenExcludes ?? DEFAULT_HIDDEN_EXCLUDES

  // 1. Walk the source tree.
  const paths = walkSource(
    cwd,
    config.files.include,
    config.files.exclude ?? [],
    hiddenExcludes,
  ).sort()

  // 2. Map each path to a `FileSpec` with inferred type.
  let files = paths.map((path): { path: string; type: InferredFileType; when?: string } => {
    const overrideType = config.files.typeOverrides?.[path]
    const type: InferredFileType =
      overrideType !== undefined
        ? (overrideType as InferredFileType)
        : inferFileType(path)
    return { path, type }
  })

  // 3. Materialise prompt-driven gating.
  files = applyExcludes(files, config.prompts) as typeof files

  // 4. Assemble the candidate descriptor. We omit `excludes`
  //    from the wire (it's a build-only concern); the prompts[]
  //    remain so the CLI can ask the user.
  const restConfig: Record<string, unknown> = { ...config }
  delete restConfig["files"]
  delete (restConfig as Record<string, unknown>)["excludes"]
  delete (restConfig as Record<string, unknown>)["typeOverrides"]
  const candidate = {
    ...restConfig,
    files: files.map((f) => {
      const out: Record<string, unknown> = { path: f.path, type: f.type }
      if (f.when !== undefined) out.when = f.when
      return out
    }),
  }

  // 5. Validate. The Zod schema is the wire contract; the
  //    builder's output is byte-equivalent to a hand-authored
  //    descriptor.
  const parsed = TemplateV2Schema.safeParse(candidate)
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }))
    return { ok: false, error: errors }
  }
  return { ok: true, descriptor: parsed.data }
}

/**
 * Convenience: read the source tree and emit the descriptor
 * without writing anything. Tests use this; the CLI writes
 * separately so it can control the destination.
 */
export const buildToString = (
  config: AuthorTemplateConfig,
  options: BuildOptions = {},
): string => {
  const result = build(config, options)
  if (!result.ok) {
    const lines = result.error.map(
      (e) => `  - ${e.path}: ${e.message}`,
    )
    throw new Error(
      `Descriptor validation failed:\n${lines.join("\n")}`,
    )
  }
  return JSON.stringify(result.descriptor, null, 2) + "\n"
}

/**
 * Re-export the type for callers that want to import a single
 * symbol. Pure-namespace tidiness; runtime effect is null.
 */
export type { TemplateV2 }
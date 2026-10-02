/**
 * Pure resolver for `TemplateV2` file selection.
 *
 * Takes a validated descriptor plus a flat list of paths from the
 * template repo's tree and returns the deduped, sorted list of files
 * that `init` would copy, with their resolved `kind` (the closed
 * `FILE_TYPE_TEMPLATE` value the consumer can render or merge).
 *
 * Algorithm:
 *   1. Apply `descriptor.includes[]` (default `["**"]`) to the tree.
 *   2. Subtract `descriptor.excludes[]` (default `[]`).
 *   3. For each surviving path, look up the kind in
 *      `descriptor.fileTypes{}`. Fallback is extension-based.
 *
 * Defaults are applied here (not in Zod). The resolver is the only
 * place that interprets globs; consumers stay agnostic.
 *
 * `@workspace/contracts/tests` exercises the schema. This file's tests
 * live at `tests/resolve.test.ts`.
 *
 * @see ADR-032 §"File selection" amendment in PR-137.
 */

import { FILE_TYPE_TEMPLATE } from "@workspace/contracts/shared"

// picomatch ships its own types via @types/picomatch in the workspace;
// the runtime import uses the default ESM API.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - picomatch has no bundled types at the runtime entry; the
// workspace carries @types/picomatch for editors but the types field is
// not declared in picomatch@4's package.json.
// eslint-disable-next-line import/no-unresolved
import picomatch from "picomatch"

import type { FileKind, ResolvedTemplateFile } from "./types.js"

/**
 * The closed list of valid kinds. Re-imported from the contracts
 * package so the resolver and the schema cannot drift on what counts
 * as a valid kind value.
 */
const FILE_KINDS = FILE_TYPE_TEMPLATE.options

/**
 * Resolve the descriptor's `includes[]` / `excludes[]` / `fileTypes{}`
 * triple against the tree and return the resulting file list.
 *
 * Pure: no I/O, no clock, no random. Same input always yields the
 * same output.
 */
export const resolveFiles = (
  descriptor: Pick<ResolvedTemplateDescriptor, "includes" | "excludes" | "fileTypes" | "files">,
  treePaths: readonly string[],
): readonly ResolvedTemplateFile[] => {
  const includes = descriptor.includes && descriptor.includes.length > 0
    ? descriptor.includes
    : ["**"]

  const includeMatcher = picomatch(includes, {
    dot: true,
    ignore: descriptor.excludes ?? [],
  })

  const surviving: { path: string }[] = []
  for (const path of treePaths) {
    if (!includeMatcher(path)) continue
    surviving.push({ path })
  }

  // Build the kind lookup map (glob pattern → kind) once.
  const fileTypesMatchers: ReadonlyArray<{
    readonly match: (p: string) => boolean
    readonly kind: FileKind
  }> = Object.entries(descriptor.fileTypes ?? {}).map(([glob, kind]) => ({
    match: picomatch(glob, { dot: true }),
    kind: kind as FileKind,
  }))

  // From-tree files with resolved kind.
  const fromTree: ResolvedTemplateFile[] = surviving.map(({ path }) => ({
    path,
    kind: kindFor(path, fileTypesMatchers),
    source: "tree" as const,
  }))

  // Explicit `descriptor.files[]` entries (if any) win on path
  // duplicates — they carry per-file metadata (target, transform,
  // overwrite) that the tree can't know.
  const explicit: ResolvedTemplateFile[] = (descriptor.files ?? []).map((f) => ({
    path: f.path,
    kind: f.type as FileKind,
    ...(f.target !== undefined ? { target: f.target } : {}),
    ...(f.transform !== undefined ? { transform: f.transform } : {}),
    source: "descriptor" as const,
  }))

  // Dedup by path. Explicit entries win over tree entries.
  const byPath = new Map<string, ResolvedTemplateFile>()
  for (const f of fromTree) byPath.set(f.path, f)
  for (const f of explicit) byPath.set(f.path, f)

  const result = [...byPath.values()]
  result.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  return result
}

/**
 * Resolve the kind for a single path. First matcher in
 * `fileTypesMatchers` that matches wins; else extension heuristic;
 * else `template:asset` (binary fallback).
 */
const kindFor = (
  path: string,
  matchers: ReadonlyArray<{
    readonly match: (p: string) => boolean
    readonly kind: FileKind
  }>,
): FileKind => {
  for (const { match, kind } of matchers) {
    if (match(path)) return kind
  }
  const ext = path.slice(path.lastIndexOf("."))
  if (EXTENSION_KIND_DEFAULTS[ext] !== undefined) return EXTENSION_KIND_DEFAULTS[ext]
  return "template:asset"
}

/**
 * Extension → kind default map. Unknown extensions fall through to
 * `template:asset` so binary content never silently becomes `template:source`.
 *
 * The map is keyed on lowercase extensions (the source is whatever
 * the descriptor author wrote). Mixed-case extensions miss the map
 * and fall through to the asset fallback; this is the safe default.
 */
const EXTENSION_KIND_DEFAULTS: Readonly<Record<string, FileKind>> = {
  ".ts": "template:source",
  ".tsx": "template:source",
  ".js": "template:source",
  ".jsx": "template:source",
  ".mjs": "template:source",
  ".cjs": "template:source",
  ".css": "template:style",
  ".scss": "template:style",
  ".md": "template:doc",
  ".mdx": "template:doc",
  ".json": "template:config",
  ".yaml": "template:config",
  ".yml": "template:config",
  ".toml": "template:config",
  ".env": "template:env",
}

/**
 * Subset of `TemplateV2` shape that the resolver consumes.
 *
 * Typed loosely to accept the full `TemplateV2` object (which has
 * `files` typed as `Array<{ ... }> | undefined`, not `ReadonlyArray<...>`).
 * The resolver never mutates the descriptor; it only reads these
 * four fields.
 */
type ResolvedTemplateDescriptor = {
  readonly includes?: readonly string[] | undefined
  readonly excludes?: readonly string[] | undefined
  readonly fileTypes?: Readonly<Record<string, string>> | undefined
  readonly files?:
    | ReadonlyArray<{
        readonly path: string
        readonly type: string
        readonly target?: string | undefined
        readonly transform?: string | undefined
      }>
    | undefined
}

export { FILE_KINDS }
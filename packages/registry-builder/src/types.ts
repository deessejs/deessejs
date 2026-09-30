/**
 * Author-side config shape for `@workspace/registry-builder`.
 *
 * The author writes a `_registry/config.ts` that matches this
 * shape; the builder walks the source tree and emits a flat
 * `deesse-template.json` descriptor.
 *
 * Difference vs. the wire `TemplateV2`:
 *   - `files` is replaced by `{ include, exclude, typeOverrides }`.
 *     The walk produces the flat `files[]` on the wire.
 *   - `prompts[]` may declare `excludes[]` — glob patterns removed
 *     from `files[]` when the prompt's answer is falsy. The builder
 *     materialises this as `when` clauses on the matching files.
 *
 * @see ADR-038 for the full pipeline design.
 */

import { z } from "zod"

/**
 * Source-file globbing. We deliberately avoid a third-party glob
 * library — the patterns we need (`*`, `**`, prefix/path matching)
 * can be expressed with a small finite matcher. The matcher is
 * documented and tested in `glob.ts`.
 */
const IncludeExclude = z.object({
  include: z.array(z.string().min(1)).min(1),
  exclude: z.array(z.string()).optional(),
  /** Per-path override of the extension-inferred `type`. */
  typeOverrides: z.record(z.string(), z.string()).optional(),
})

/** Source for a template descriptor. */
const Source = z.object({
  repo: z.string().min(1),
  ref: z.string().optional(),
})

/** Runtime requirements. */
const Requires = z.object({
  runtime: z.string().min(1),
  packageManager: z.string().optional(),
})

/**
 * A single prompt that the CLI will surface to the user. Mirrors
 * `TemplateV2`'s `prompts[]` shape and adds `excludes[]`.
 */
const Prompt = z.object({
  name: z.string().regex(/^[a-z_][a-z0-9_]*$/),
  type: z.enum(["text", "select", "confirm"]),
  message: z.string().min(1),
  default: z.union([z.string(), z.boolean()]).optional(),
  choices: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .optional(),
  /**
   * Glob patterns removed from the wire `files[]` when the
   * prompt's answer is falsy. For a `confirm` prompt with
   * `default: true`, this gates a default-on feature flag.
   */
  excludes: z.array(z.string()).optional(),
})

/** Top-level author config. */
export const AuthorTemplateConfig = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  type: z.literal("template:app"),
  version: z.string().min(1),
  author: z.string().min(1),
  description: z.string().optional(),
  license: z.string().optional(),
  category: z.string().optional(),
  labels: z.array(z.string()).optional(),
  source: Source,
  requires: Requires,
  prompts: z.array(Prompt).optional(),
  hooks: z
    .object({
      postInit: z.array(z.string()).optional(),
      postInstall: z.array(z.string()).optional(),
    })
    .optional(),
  files: IncludeExclude,
})

export type AuthorTemplateConfig = z.infer<typeof AuthorTemplateConfig>
export type AuthorPrompt = z.infer<typeof Prompt>
export type AuthorFiles = z.infer<typeof IncludeExclude>

/**
 * Identity helper for the builder: returns the same object, but
 * gives authors a typed surface and IDE autocomplete. The runtime
 * effect is null — TypeScript erases this at build time.
 *
 * @example
 *   import { defineTemplate } from "@workspace/registry-builder"
 *   export default defineTemplate({ ... })
 */
export const defineTemplate = <T extends AuthorTemplateConfig>(
  config: T,
): T => config
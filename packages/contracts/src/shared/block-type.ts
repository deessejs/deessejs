import { z } from "zod"

/**
 * Closed-list discriminator for the `deessejs-block.json#type` field
 * (the item-level kind for an overlay block). Mirrors shadcn's
 * per-file taxonomy at the *item level* per RFC-005.
 *
 * The 8 values plus `block:source` (for non-routable source files) cover
 * the foreseeable block surface. Adding a value is a major bump per
 * ADR-036 §2 (closed-enum extension is breaking for clients that map
 * values to fixed routes).
 *
 * The CLI uses the per-item type to decide:
 *   - which registry host URL prefix to query
 *   - which directory in the consumer project the files route into
 *   - which peer dependencies to install
 *
 * Same prefix scheme as {@link TEMPLATE_TYPE} (`<kind>:<value>`), so
 * the two enums are mutually distinguishable in logs and tooling.
 *
 * @see RFC-005 §Decisions 1-3 for the closed-list rationale.
 * @see ADR-036 §5 for the closed-enum procedure.
 */
export const BLOCK_TYPE = z.enum([
  "block:page",
  "block:component",
  "block:hook",
  "block:lib",
  "block:ui",
  "block:file",
  "block:font",
  "block:theme",
])

export type BlockType = z.infer<typeof BLOCK_TYPE>

/**
 * Per-file type for files inside a `deessejs-block.json` or
 * `deesse-template.json#files[]`. Same closed list as {@link BLOCK_TYPE}
 * plus `block:source` for configuration and non-routable source files.
 *
 * Per-file type is **mandatory** per RFC-005 §Decision 3. The CLI uses
 * it to route the file to the canonical directory (`@routes/`,
 * `@components/`, `@lib/`, `@hooks/`, `@ui/`, etc.). A missing or
 * unknown per-file type fails at parse time with `parse_error`,
 * surfacing the typo to the author before any install attempt.
 *
 * @see RFC-005 §Decision 3 for the mandatory-tag rationale.
 */
export const FILE_TYPE = z.enum([
  "block:page",
  "block:component",
  "block:hook",
  "block:lib",
  "block:ui",
  "block:file",
  "block:font",
  "block:theme",
  "block:source",
])

export type FileType = z.infer<typeof FILE_TYPE>

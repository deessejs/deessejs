import { z } from "zod"

/**
 * Closed-list discriminator for the `deessejs-block.json#type` field
 * (the item-level kind for an overlay block). Mirrors shadcn's per-file
 * taxonomy at the *item level* per RFC-005.
 *
 * Per the Q2 arbitration applied in this PR, the enum has 8 values:
 *   - `block:feature`    A multi-file feature overlay (the most common kind)
 *   - `block:page`       A page or file-based route
 *   - `block:component`  A single-file UI component or small component group
 *   - `block:hook`       A React hook or hook group
 *   - `block:lib`        A library module or utility
 *   - `block:ui`         A UI primitive (closest analogue to shadcn's `registry:ui`)
 *   - `block:file`       A miscellaneous file (config, README fragment, env)
 *   - `block:font/theme` A font OR theme bundle; the value discriminates by
 *                        the `target` field (one token, two routings)
 *
 * The 8th value is a tagged union: `block:font/theme` is one token in the
 * enum, but the CLI routes it differently based on the file's `target`
 * (`@assets/fonts/` vs `globals.css`). One enum value, two routings.
 *
 * Earlier draft lists in RFC-005 §32 (no `feature`) and RFC-005 §124
 * (no `font/theme` token) read as inconsistent; this list is the
 * ratified version per the Q2 arbitration. Adding a value is a major
 * bump per ADR-036 §2.
 */
export const BLOCK_TYPE = z.enum([
  "block:feature",
  "block:page",
  "block:component",
  "block:hook",
  "block:lib",
  "block:ui",
  "block:file",
  "block:font/theme",
])

export type BlockType = z.infer<typeof BLOCK_TYPE>

/**
 * Per-file type for files inside a `deessejs-block.json` `files[]`
 * entry. Same closed list as {@link BLOCK_TYPE} (which has 8 values,
 * with `block:font/theme` covering both font and theme routings) plus
 * one extra `block:source` for non-routable source files.
 *
 * Per RFC-005 §"Per-file `files[].type` (mandatory)": per-file `type`
 * is **mandatory**. A missing or unknown per-file `type` fails at parse
 * time with `parse_error`.
 */
export const FILE_TYPE = z.enum([
  "block:feature",
  "block:page",
  "block:component",
  "block:hook",
  "block:lib",
  "block:ui",
  "block:file",
  "block:font/theme",
  "block:source",
])

export type FileType = z.infer<typeof FILE_TYPE>

/**
 * Infer the `FileType` (per ADR-032 §"files") for a given file path.
 *
 * The mapping is closed-list and lives in `@workspace/contracts`.
 * This module is the registry-builder's bridge: it consults the
 * extension, picks a value, and lets the user override per-path
 * via `typeOverrides`.
 *
 * Why extension-based: 99% of the time, `.ts` is a source file,
 * `.json` is config, `.md` is docs. The 1% override is opt-in.
 */

import { z } from "zod"

import { FILE_TYPE_TEMPLATE } from "@workspace/contracts/shared"

/** Type alias mirror of the Zod enum, kept narrow at the consumer. */
export type InferredFileType = z.infer<typeof FILE_TYPE_TEMPLATE>

/** Extension → type lookup. The order is irrelevant; lookup is exact. */
const EXT_TYPE: Record<string, InferredFileType> = {
  // Source code
  ".ts": "template:source",
  ".tsx": "template:source",
  ".js": "template:source",
  ".jsx": "template:source",
  ".mjs": "template:source",
  ".cjs": "template:source",
  ".py": "template:source",

  // Config
  ".json": "template:config",
  ".yaml": "template:config",
  ".yml": "template:config",
  ".toml": "template:config",
  ".lock": "template:config",
  ".npmrc": "template:config",
  ".editorconfig": "template:config",
  ".gitignore": "template:config",
  ".gitattributes": "template:config",
  ".prettierrc": "template:config",
  ".prettierignore": "template:config",
  ".vale.ini": "template:config",

  // Style
  ".css": "template:style",
  ".scss": "template:style",
  ".sass": "template:style",
  ".pcss": "template:style",

  // Test
  ".test.ts": "template:test",
  ".spec.ts": "template:test",
  ".test.tsx": "template:test",
  ".spec.tsx": "template:test",

  // Doc
  ".md": "template:doc",
  ".mdx": "template:doc",
  ".txt": "template:doc",

  // Env
  ".env": "template:env",
  ".env.example": "template:env",
  ".env.local": "template:env",
  ".env.production": "template:env",

  // Assets (rarer; mostly the asset sub-folder)
  ".png": "template:asset",
  ".jpg": "template:asset",
  ".jpeg": "template:asset",
  ".gif": "template:asset",
  ".svg": "template:asset",
  ".woff": "template:asset",
  ".woff2": "template:asset",
}

/**
 * Infer the file type for a given path. Returns `"template:file"`
 * (the ADR fallback) when no extension matches.
 *
 * The match is by suffix. `foo.test.ts` matches `.test.ts` first
 * because of the explicit prefix; `bar.spec.ts` matches `.spec.ts`.
 * Plain `foo.ts` matches `.ts`.
 */
export const inferFileType = (path: string): InferredFileType => {
  // Try the longer extensions first so `.test.ts` matches before
  // `.ts`. The suffix is a substring match against the path end.
  const sorted = Object.entries(EXT_TYPE).sort(
    ([a], [b]) => b.length - a.length,
  )
  for (const [ext, type] of sorted) {
    if (path.endsWith(ext)) return type
  }
  return "template:source"
}
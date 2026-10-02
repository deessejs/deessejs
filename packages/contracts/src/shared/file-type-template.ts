import { z } from "zod"

/**
 * Closed-list per-file `type` for files inside a `deesse-template.json`
 * `files[]` entry (the registry-side starter descriptor).
 *
 * Per the ADR-032 amendment applied in this PR, per-file `type` is
 * **mandatory** in `deesse-template.json`. A missing or unknown value
 * fails at parse time with `parse_error`. The CLI uses `type` to route
 * the file to the right directory in the consumer project and to
 * choose the merge strategy for files of the same logical kind.
 *
 * The 7 values are exhaustive for the foreseeable starter template
 * surface:
 *   - `template:env`     — environment files (.env.example, .env.local)
 *   - `template:doc`     — documentation fragments (README sections, MDX)
 *   - `template:config`  — tool configuration (tsconfig.json, eslint config, biome.json)
 *   - `template:source`  — source code (.ts, .tsx, .js, .jsx); the default kind
 *   - `template:style`   — stylesheets (.css, .scss, globals.css fragments)
 *   - `template:test`    — test files (.test.ts, .spec.ts)
 *   - `template:asset`   — binary assets (images, fonts in the asset sub-folder)
 *
 * The CLI is free to merge `template:source` files into the consumer's
 * `src/` directory by file path; the closed enum is the source of
 * truth for routing, never the file extension. A `.test.ts` file
 * carries `template:test`, not `template:source`, regardless of the
 * extension overlap.
 *
 * Adding a value is a major bump per ADR-036 §"Semver bump rules".
 * Never edit this list in place; the next major version carries a
 * new closed list in `v3/template.ts`.
 *
 * @see ADR-032 §`files` for the per-value documentation and examples.
 * @see ADR-036 §5 for the shared/ directory rationale.
 */
export const FILE_TYPE_TEMPLATE = z.enum([
  "template:env",
  "template:doc",
  "template:config",
  "template:source",
  "template:style",
  "template:test",
  "template:asset",
])

export type FileTypeTemplate = z.infer<typeof FILE_TYPE_TEMPLATE>

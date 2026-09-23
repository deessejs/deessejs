import { z } from "zod"

import {
  LICENSE,
  TEMPLATE_TYPE,
  RUNTIME,
  SEMVER,
  REPO_SLUG,
  SEMVER_RANGE,
  GIT_REF,
  FILE_TYPE_TEMPLATE,
} from "../shared/index.js"

/**
 * TemplateV2 — the registry-side item descriptor co-located at the root of
 * each template repo as `deesse-template.json`.
 *
 * Authoritative reference: ADR-032 (every field documented there). This Zod
 * schema is the executable form of the prose in ADR-032 and adds the
 * invariants that prose can only gesture at (closed enums, per-file type
 * tagging, mandatory runtime).
 *
 * The amendments applied in this PR (per ADR-032 §"Amendments applied during
 * this PR" and ADR-036 §5) are:
 *   1. `requires.runtime` is **mandatory** when `requires` is present
 *      (Q4 — runtime mandatory). The closed-invariant rule of ADR-036 §2.
 *   2. `files[].type` is **mandatory** and drawn from a closed list of 7
 *      `template:*` values (Q1 — files namespace). RFC-005 §Decision 3
 *      proposed an alternative `block:*` namespace; that question is
 *      settled here in favour of `template:*`.
 *   3. The `$schema` URL is version-pinned to `/schema/template/v{n}.json`
 *      (Q3 — schema URL versioning). The immutability policy lives in
 *      ADR-036 §3.
 *
 * Migration note: the pre-existing `packages/contracts/src/v1/template.ts`
 * describes the *API response payload* (`GET /api/v1/templates`), not the
 * descriptor file. That schema is unchanged and remains at
 * `v1/template.ts` under its existing name. The homonym is acknowledged but
 * not resolved here; renaming the legacy schema to `TemplatesListItemV1`
 * is tracked separately to avoid mixing a public-API rename with a
 * descriptor addition in one PR. See ADR-036 §"Rollout" for the policy.
 *
 * Closed-enum invariance: every `z.enum` below is *closed*. Adding a value
 * is a major bump per ADR-036 §2 — never edit this file in place, create a
 * `v3/template.ts` if you need a new value.
 */

// -- $schema ---------------------------------------------------------------

/**
 * Version-pinned per ADR-036 §3. The CDN serves this URL with
 * `Cache-Control: immutable`. Once a TemplateV2 instance is published,
 * this URL never serves a different shape.
 */
const SCHEMA_URL_V2 =
  "https://registry.deessejs.com/schema/template/v2.json" as const

// -- name ------------------------------------------------------------------

const NAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

const Name = z.string().min(1).regex(NAME_REGEX, {
  message:
    "name must match ^[a-z0-9][a-z0-9-]*[a-z0-9]$ (lowercase, digits, hyphens; cannot start or end with a hyphen)",
})

// -- title -----------------------------------------------------------------

const Title = z
  .string()
  .min(3, { message: "title must be at least 3 characters" })
  .max(60, { message: "title must be at most 60 characters" })

// -- author ----------------------------------------------------------------

const Author = z
  .string()
  .regex(/^[^<]+<[^@]+@[^>]+>$/, {
    message: 'author must match the "Name <email>" form (RFC 5322 with display name)',
  })
  .optional()

// -- source ----------------------------------------------------------------

const Source = z.object({
  repo: REPO_SLUG,
  ref: GIT_REF,
  cloneUrl: z.string().url().optional(),
})

// -- requires --------------------------------------------------------------

const PackageManagerSpec = z
  .string()
  .regex(/^[a-z][a-z0-9-]*@[\dvx]+(\.[\dx]+){0,2}$/, {
    message:
      "packageManager must match `^[a-z][a-z0-9-]*@<version>$` (e.g. pnpm@9, bun@1.1, pnpm@9.0.0, npm@10.2)",
  })

/**
 * Per ADR-032 §`requires` amendment: `runtime` is mandatory when this
 * object is present. The object itself remains optional (absent = "no
 * gates"); a non-empty object without `runtime` fails at parse time.
 */
const Requires = z
  .object({
    runtime: RUNTIME,
    node: SEMVER_RANGE.optional(),
    packageManager: PackageManagerSpec.optional(),
    djs: SEMVER_RANGE.optional(),
  })
  .optional()

// -- dependencies / devDependencies ---------------------------------------

const DependencyEntry = z
  .string()
  .regex(/^(@?[a-z0-9][a-z0-9._/-]*)@[^@]+$/, {
    message:
      "each dependency must be `<name>@<version>` — no git URLs, no wildcards, no `*`",
  })

// -- prompts ---------------------------------------------------------------

const PromptType = z.enum(["text", "select", "confirm"])

const PromptChoice = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

const PromptConsume = z.object({
  target: z
    .string()
    .regex(
      /^(project:[a-z_]+|tokens:[A-Z_]+|file:.+|template:[a-z_]+)$/,
      {
        message:
          "consume target must be `project:<key>`, `tokens:<UPPER_SNAKE>`, `file:<glob>`, or `template:<key>`",
      },
    ),
})

const Prompt = z
  .object({
    name: z.string().regex(/^[a-z_][a-z0-9_]*$/, {
      message: "prompt name must match ^[a-z_][a-z0-9_]*$",
    }),
    type: PromptType,
    message: z.string().min(1),
    default: z.union([z.string(), z.boolean()]).optional(),
    choices: z.array(PromptChoice).optional(),
    validate: z.string().optional(),
    when: z.string().optional(),
    consumes: z.array(PromptConsume).optional(),
  })
  .refine(
    (p) => p.type !== "select" || (p.choices && p.choices.length > 0),
    {
      message: "select prompts require choices[] with at least one entry",
      path: ["choices"],
    },
  )

// -- hooks -----------------------------------------------------------------

const HookSection = z.array(z.string().min(1)).optional()

const Hooks = z
  .object({
    preInit: HookSection,
    postInit: HookSection,
    preInstall: HookSection,
    postInstall: HookSection,
  })
  .optional()

// -- files -----------------------------------------------------------------

/**
 * Per ADR-032 §`files` amendment: `type` is mandatory and drawn from the
 * closed 7-value enum `FILE_TYPE_TEMPLATE`. The CLI uses `type` to route
 * the file to the right directory in the consumer project; a missing
 * `type` or a value outside the closed set fails at parse time.
 *
 * Q1 arbitration: the per-file namespace is `template:*`. RFC-005 §Decision 3
 * proposed `block:*` for the block descriptor; the two namespaces remain
 * distinct by file-format per RFC-005 §"Why a file-name split instead of a
 * discriminator".
 */
const FileTransform = z.enum(["rename", "interpolate", "remove", "merge"])

const FileSpec = z.object({
  path: z.string().min(1),
  type: FILE_TYPE_TEMPLATE,
  target: z.string().optional(),
  transform: FileTransform.optional(),
  overwrite: z.boolean().optional(),
})

// -- templateDependencies --------------------------------------------------

const TemplateDependency = z.array(Name)

// -- category --------------------------------------------------------------

/**
 * `category` is an open string (no closed enum). The gallery uses it for
 * filtering; the CLI does not route by it. Promoting to a closed enum is a
 * minor bump per ADR-036 §2.
 */
const Category = z.string().min(1).optional()

// -- description -----------------------------------------------------------

const Description = z
  .string()
  .min(10, { message: "description should be at least 10 characters" })
  .max(2000, { message: "description must be at most 2000 characters" })
  .optional()

// -- docs ------------------------------------------------------------------

const Docs = z.string().min(1).optional()

// -- postinstall (deprecated alias) ----------------------------------------

/**
 * Per ADR-032 §`postinstall`, kept as a back-compat alias for
 * `hooks.postInit`. New templates use `hooks.postInit` directly. The CLI
 * emits a `deprecation_warning` when this is present.
 */
const Postinstall = z.array(z.string().min(1)).optional()

// -- the full schema -------------------------------------------------------

export const TemplateV2 = z
  .object({
    $schema: z.literal(SCHEMA_URL_V2),
    name: Name,
    title: Title,
    description: Description,
    type: TEMPLATE_TYPE,
    version: SEMVER,
    author: Author,
    license: LICENSE.optional(),
    category: Category,
    labels: z.array(z.string()).optional(),
    source: Source,
    requires: Requires,
    dependencies: z.array(DependencyEntry).optional(),
    devDependencies: z.array(DependencyEntry).optional(),
    templateDependencies: TemplateDependency.optional(),
    docs: Docs,
    prompts: z.array(Prompt).optional(),
    hooks: Hooks,
    postinstall: Postinstall,
    files: z.array(FileSpec).optional(),
  })
  .refine(
    (t) =>
      t.type !== "template:app" ||
      !t.templateDependencies ||
      t.templateDependencies.length === 0,
    {
      message:
        "template:app items cannot have templateDependencies[] (an app is the install-graph root)",
      path: ["templateDependencies"],
    },
  )
  .refine(
    (t) => {
      if (!t.prompts) return true
      const seen = new Set<string>()
      for (const p of t.prompts) {
        if (seen.has(p.name)) {
          return false
        }
        seen.add(p.name)
      }
      return true
    },
    {
      message: "prompt `name` must be unique within prompts[]",
      path: ["prompts"],
    },
  )

export type TemplateV2 = z.infer<typeof TemplateV2>

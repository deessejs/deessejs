import { z } from "zod"

import {
  LICENSE,
  RUNTIME,
  SEMVER,
  REPO_SLUG,
  SEMVER_RANGE,
  GIT_REF,
  BLOCK_TYPE,
  FILE_TYPE,
} from "../shared/index.js"

/**
 * BlockV1 — the overlay-side item descriptor co-located at the root of a
 * block repo as `deessejs-block.json`.
 *
 * Authoritative reference: RFC-005 (every field documented there). This Zod
 * schema is the executable form of the prose in RFC-005 and adds the
 * invariants the prose can only gesture at (closed enums, per-file type
 * tagging, ref-pinning).
 *
 * Q2 arbitration: the `type` field is a closed list of 8 values per
 * RFC-005 §32 (`block:page`, `block:component`, `block:hook`, `block:lib`,
 * `block:ui`, `block:file`, `block:font`, `block:theme`). `block:font` and
 * `block:theme` are two of the eight values; the RFC's summary table §124
 * groups them in one row because their routing is similar, but the
 * discriminated set is 8. Adding a value is a major bump per ADR-036 §2.
 *
 * Co-location with `v1/template.ts` (per RFC-005 §"Wire contract evolution"):
 * both descriptors live at the same version level because they represent
 * the same generation of the registry surface. `TemplateV2` lives under
 * `v2/` because it was amended in this PR to close invariants on per-file
 * `type`; `BlockV1` is a first-generation schema and starts at V1.
 *
 * Closed-enum invariance: every `z.enum` below is *closed*. Adding a value
 * is a major bump per ADR-036 §2.
 */

// -- $schema ---------------------------------------------------------------

/**
 * Version-pinned per ADR-036 §3. Distinct from `TemplateV2`'s URL: the
 * block descriptor publishes its own schema URL.
 */
const SCHEMA_URL_V1 =
  "https://registry.deessejs.com/schema/block/v1.json" as const

// -- name / title / description (parallels TemplateV2) --------------------

const NAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

const Name = z.string().min(1).regex(NAME_REGEX, {
  message:
    "name must match ^[a-z0-9][a-z0-9-]*[a-z0-9]$ (lowercase, digits, hyphens; cannot start or end with a hyphen)",
})

const Title = z
  .string()
  .min(3, { message: "title must be at least 3 characters" })
  .max(60, { message: "title must be at most 60 characters" })

const Author = z
  .string()
  .regex(/^[^<]+<[^@]+@[^>]+>$/, {
    message: 'author must match the "Name <email>" form (RFC 5322 with display name)',
  })
  .optional()

const Description = z
  .string()
  .min(10, { message: "description should be at least 10 characters" })
  .max(2000, { message: "description must be at most 2000 characters" })
  .optional()

// -- source ----------------------------------------------------------------

const Source = z.object({
  repo: REPO_SLUG,
  ref: GIT_REF,
  cloneUrl: z.string().url().optional(),
})

// -- requires (parallels TemplateV2, runtime mandatory when present) -------

const PackageManagerSpec = z
  .string()
  .regex(/^[a-z][a-z0-9-]*@[\dvx]+(\.[\dx]+){0,2}$/, {
    message:
      "packageManager must match `^[a-z][a-z0-9-]*@<version>$` (e.g. pnpm@9, bun@1.1, pnpm@9.0.0, npm@10.2)",
  })

const Requires = z
  .object({
    runtime: RUNTIME,
    node: SEMVER_RANGE.optional(),
    packageManager: PackageManagerSpec.optional(),
    djs: SEMVER_RANGE.optional(),
  })
  .optional()

// -- dependencies / devDependencies ----------------------------------------

const DependencyEntry = z
  .string()
  .regex(/^(@?[a-z0-9][a-z0-9._/-]*)@[^@]+$/, {
    message:
      "each dependency must be `<name>@<version>` — no git URLs, no wildcards",
  })

// -- files (the load-bearing delta vs TemplateV2) -------------------------

/**
 * Per RFC-005 §"Per-file `files[].type` (mandatory)": every file in
 * `files[]` declares its own `type` from the closed 9-value enum
 * {@link FILE_TYPE} (8 routing kinds + 1 `block:source` for non-routable
 * files). Missing or unknown per-file `type` fails at parse time with
 * `parse_error`.
 *
 * Per RFC-005 §"Routing semantics": per-file `type` **overrides** the
 * item-level type for routing purposes. A `block:feature` item can contain
 * files of any per-file type. A non-feature item (e.g. `block:page`) can
 * contain only files matching the item-level type — mixed-type items fail
 * at parse time. Enforced by the `.refine` below.
 */
const FileTransform = z.enum(["rename", "interpolate", "remove", "merge"])

const FileSpec = z.object({
  path: z.string().min(1),
  type: FILE_TYPE,
  target: z.string().optional(),
  transform: FileTransform.optional(),
  overwrite: z.boolean().optional(),
})

// -- blockDependencies (renamed from templateDependencies per RFC-005 §262)

const BlockDependency = z.array(Name)

// -- prompts / hooks (parallels TemplateV2) --------------------------------

const PromptType = z.enum(["text", "select", "confirm"])

const PromptChoice = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

const PromptConsume = z.object({
  target: z
    .string()
    .regex(
      /^(project:[a-z_]+|tokens:[A-Z_]+|file:.+|block:[a-z_]+)$/,
      {
        message:
          "consume target must be `project:<key>`, `tokens:<UPPER_SNAKE>`, `file:<glob>`, or `block:<key>`",
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

const HookSection = z.array(z.string().min(1)).optional()

const Hooks = z
  .object({
    preInit: HookSection,
    postInit: HookSection,
    preInstall: HookSection,
    postInstall: HookSection,
  })
  .optional()

const Category = z.string().min(1).optional()

const Docs = z.string().min(1).optional()

// -- the full schema -------------------------------------------------------

export const BlockV1 = z
  .object({
    $schema: z.literal(SCHEMA_URL_V1),
    name: Name,
    title: Title,
    description: Description,
    type: BLOCK_TYPE,
    version: SEMVER,
    author: Author,
    license: LICENSE.optional(),
    category: Category,
    labels: z.array(z.string()).optional(),
    source: Source,
    requires: Requires,
    dependencies: z.array(DependencyEntry).optional(),
    devDependencies: z.array(DependencyEntry).optional(),
    /**
     * Renamed from `templateDependencies` per RFC-005 §262. A block depends
     * on other blocks; the field's semantics don't change, only the name.
     */
    blockDependencies: BlockDependency.optional(),
    docs: Docs,
    prompts: z.array(Prompt).optional(),
    hooks: Hooks,
    files: z.array(FileSpec).optional(),
  })
  .refine(
    (b) => {
      if (!b.prompts) return true
      const seen = new Set<string>()
      for (const p of b.prompts) {
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
  .refine(
    (b) => {
      /**
       * Routing constraint per RFC-005 §"Routing semantics": a non-feature
       * item (any type other than `block:feature`) can contain only files
       * matching the item-level type. A `block:page` item can contain only
       * `block:page` files. Files of type `block:source` are always
       * allowed (they are non-routable and counted as metadata, not
       * routing input).
       */
      if (b.type === "block:feature" || !b.files) return true
      for (const f of b.files) {
        if (f.type === "block:source") continue
        // Block-level type is `<kind>:<value>`; per-file type is also
        // `<kind>:<value>`. The match is by the full discriminated value,
        // not by prefix.
        if (f.type !== b.type) return false
      }
      return true
    },
    {
      message:
        "non-feature blocks must have files[] whose `type` matches the block-level `type` (block:source is always allowed)",
      path: ["files"],
    },
  )

export type BlockV1 = z.infer<typeof BlockV1>

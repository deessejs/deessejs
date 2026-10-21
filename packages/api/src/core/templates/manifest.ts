/**
 * The template manifest, the machine readable contract of a template.
 *
 * Every template publishes `deesse-template.json` at the root of its
 * repository. The catalogue reads that file instead of keeping a second
 * copy of the same facts inside the API package. This module owns the
 * contract: the shape of the file, the parse of the raw text, and the
 * merge of the manifest with the live repository data.
 *
 * The schema that validates the file is published by the parent
 * template, at `templates/schema/template-v2.json`. That schema is the
 * source of truth for the field set. This module stays tolerant: it
 * reads the fields the catalogue needs and ignores the rest, because a
 * manifest written by a future version of the schema must not break
 * the catalogue.
 *
 * Ownership of the fields is split by the standard:
 *   - technical fields: name, version, type, license, requires
 *   - product fields: slug, title, description, product block
 * A product field is never invented here and a technical field is never
 * overridden by the product.
 */
import type { TemplateV1 } from "@workspace/contracts/v1"

/** Path of the manifest inside a template repository. */
export const MANIFEST_PATH = "deesse-template.json"

/** The editorial layers a template can declare. */
export const TEMPLATE_LAYERS = ["open-community", "pro", "enterprise"] as const

export type TemplateLayer = (typeof TEMPLATE_LAYERS)[number]

export type TemplateManifest = {
  name?: string | undefined
  slug?: string | undefined
  title?: string | undefined
  description?: string | undefined
  version?: string | undefined
  type?: string | undefined
  license?: string | undefined
  product?:
    | {
        layer?: string | undefined
        category?: string | undefined
        labels?: string[] | undefined
        image?: string | undefined
      }
    | undefined
}

/**
 * A catalogue row before the manifest is read. The pointer is the only
 * thing the API package knows about a template: the owner and the
 * repository. Everything else comes from the manifest and from GitHub.
 */
export type TemplatePointer = {
  owner: string
  repo: string
}

/** The wire shape. Same contract as `TemplateV1`, plus the layer. */
export type MergedTemplate = TemplateV1 & {
  layer?: TemplateLayer | undefined
}

/** The live facts the catalogue reads from the repository itself. */
export type LiveRepoFacts = {
  name: string
  description: string | null
  license: string | null
  topics: string[] | undefined
  pushedAt: string
  stars: number
  htmlUrl: string
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined

const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as string[])
    : undefined

const isTemplateLayer = (value: string | undefined): value is TemplateLayer =>
  value !== undefined && (TEMPLATE_LAYERS as readonly string[]).includes(value)

/**
 * Parse the raw manifest text.
 *
 * Returns `undefined` when the text is not JSON, or when it is JSON but
 * not an object. A malformed manifest is never published, and never
 * breaks the catalogue, because the caller skips the template.
 */
export const parseManifest = (raw: string): TemplateManifest | undefined => {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return undefined
  }

  const record = parsed as Record<string, unknown>
  const rawProduct = record.product
  const product =
    typeof rawProduct === "object" &&
    rawProduct !== null &&
    !Array.isArray(rawProduct)
      ? (rawProduct as Record<string, unknown>)
      : undefined

  const manifest: TemplateManifest = {
    name: asString(record.name),
    slug: asString(record.slug),
    title: asString(record.title),
    description: asString(record.description),
    version: asString(record.version),
    type: asString(record.type),
    license: asString(record.license),
  }

  if (product) {
    manifest.product = {
      layer: asString(product.layer),
      category: asString(product.category),
      labels: asStringArray(product.labels),
      image: asString(product.image),
    }
  }

  return manifest
}

/**
 * Resolve the `labels` field to a guaranteed `string[]`.
 *
 * Preference order:
 *   1. `manifestLabels` when the manifest declares at least one label.
 *      The manifest is the single source of the product fields, so the
 *      curated set wins over the repository topics.
 *   2. `repoTopics` when the manifest declares none.
 *   3. `[]` as the final fallback. Never `undefined`.
 *
 * The invariant is the reason this helper exists: the field emitted on
 * the wire is ALWAYS a `string[]`. The `TemplateLabels` component on
 * apps/web reads `labels.length` directly, and a missing field crashed
 * the SSR render with `TypeError: Cannot read properties of undefined
 * (reading 'length')` (prod digest `551940582`).
 *
 * Exported for unit testing, see `packages/api/tests/unit/manifest.test.ts`.
 */
export const resolveLabels = (
  manifestLabels: string[] | undefined,
  repoTopics: string[] | undefined,
): string[] => {
  if (Array.isArray(manifestLabels) && manifestLabels.length > 0) {
    return manifestLabels
  }
  if (Array.isArray(repoTopics)) return repoTopics
  return []
}

/**
 * Merge the manifest with the live repository facts into the wire
 * shape.
 *
 * The manifest wins over the repository on every field it declares.
 * The repository fills the gaps, so a manifest that omits the licence
 * still yields the licence GitHub reports.
 *
 * Returns `undefined` when the template is not publishable, which
 * means the manifest declares no slug or no product category. A
 * template with no catalogue row is not listed, because the catalogue
 * has nothing to publish for it.
 */
export const mergeManifest = (
  pointer: TemplatePointer,
  manifest: TemplateManifest,
  live: LiveRepoFacts,
): MergedTemplate | undefined => {
  const slug = manifest.slug
  const category = manifest.product?.category
  if (!slug || !category) return undefined

  const layer = manifest.product?.layer

  return {
    slug,
    name: manifest.title ?? manifest.name ?? live.name,
    description: manifest.description ?? live.description ?? "",
    owner: pointer.owner,
    repo: pointer.repo,
    license: manifest.license ?? live.license ?? "",
    category,
    labels: resolveLabels(manifest.product?.labels, live.topics),
    image: manifest.product?.image,
    layer: isTemplateLayer(layer) ? layer : undefined,
    cloneUrl: live.htmlUrl,
    updatedAt: live.pushedAt,
    stars: live.stars,
  }
}

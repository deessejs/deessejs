/**
 * The template catalogue, as a list of pointers.
 *
 * Each entry names the GitHub `owner/repo` of a template. Nothing
 * else lives here. The slug, the title, the description, the licence,
 * the category, the labels and the image come from the template
 * manifest, `deesse-template.json`, read live from the repository by
 * `core/templates/enrich.ts`, in the same way the readme and the
 * repository metadata are read live today.
 *
 * This is the rule of the template standard: the catalogue never keeps
 * a second copy of a fact that is versioned with the repository. A
 * template that has no manifest has no catalogue row, because the
 * catalogue has no copy to publish.
 *
 * Adding a row here without a matching repository on GitHub, or with a
 * repository that has no manifest, makes the row disappear from the
 * response and logs a `template_manifest_unreadable` error. It never
 * fails the whole endpoint.
 */
import type { TemplateV1 } from "@workspace/contracts/v1"

import type { TemplatePointer } from "./core/templates/manifest.js"

export type { TemplateLayer } from "./core/templates/manifest.js"
export type { TemplatePointer } from "./core/templates/manifest.js"

export type Template = TemplateV1

export const TEMPLATES: TemplatePointer[] = [
  { owner: "deessejs", repo: "saas-template" },
  { owner: "deessejs", repo: "complete-electron-template" },
  { owner: "deessejs", repo: "documentation-template" },
  { owner: "deessejs", repo: "landing-template" },
  { owner: "deessejs", repo: "blog-template" },
  { owner: "deessejs", repo: "package-template" },
  { owner: "deessejs", repo: "eve-template" },
]

/**
 * Templates registry data for the DeesseJS CLI.
 *
 * Each entry declares a slug, the GitHub `owner/repo` to fetch live data
 * from, a static `layer` (open-community | pro | enterprise), and an
 * editorial `category`. The live fields (name, description, license,
 * labels, stars, updatedAt, readme) are populated at request time by
 * `services/templates-enricher.ts`.
 *
 * V1 ships with a single entry: `saas-starter`. Each additional template
 * requires its own GitHub repo to live at the path declared by `owner/repo`.
 * Adding a row here without a matching repo on GitHub makes the templates
 * endpoint return 503 (fail loud).
 */
import type { TemplateV1 } from "@workspace/contracts/v1"

export type Template = TemplateV1

export type TemplateLayer = "open-community" | "pro" | "enterprise"

export type RegistryEntry = TemplateV1 & {
  /**
   * Static editorial layer for the template. Layer is not fetched from
   * GitHub — it is a marketing/business decision, not a property of the
   * repo. The fetcher preserves this field on the wire shape.
   */
  layer: TemplateLayer
}

export const TEMPLATES: RegistryEntry[] = [
  {
    slug: "saas-starter",
    name: "SaaS Starter",
    description:
      "Production-ready Next.js + Better Auth + Postgres boilerplate for B2B SaaS.",
    owner: "deessejs",
    repo: "saas-template",
    license: "MIT",
    category: "saas",
    labels: ["nextjs", "saas", "auth", "postgres"],
    layer: "open-community",
  },
]

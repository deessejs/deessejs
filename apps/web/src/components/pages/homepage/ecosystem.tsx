import { codeToHtml } from "shiki"

import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
import { EcosystemTabs } from "@/app/(marketing)/_components/ecosystem-tabs"

import {
  ECOSYSTEM_SNIPPETS,
  type EcosystemSlug,
} from "@/app/(marketing)/_components/ecosystem-snippets"

/**
 * Ecosystem section on the marketing homepage.
 *
 * Server Component. Pre-renders the four code samples (`shiki`
 * server-side, dual-theme) once per request and threads the
 * highlighted HTML into `<EcosystemTabs>` as plain strings, because
 * Next 16 forbids async Server Components inside Client trees
 * (Radix `<Tabs>` requires `"use client"`).
 *
 * Section header copy: eyebrow "The ecosystem" mirrors the dedicated
 * `/ecosystem` page; the h2 "One ecosystem, four tools" is the
 * marketing line for this section. `bordered={true}` adds the
 * `border-b border-border` separator that matches the shared-border
 * rhythm used by every other section on the homepage.
 */
export async function Ecosystem() {
  const htmlBySlug: Record<EcosystemSlug, string> = {
    errors: "",
    fp: "",
    drpc: "",
    collections: "",
  }

  await Promise.all(
    (Object.keys(ECOSYSTEM_SNIPPETS) as EcosystemSlug[]).map(async (slug) => {
      const { code, lang } = ECOSYSTEM_SNIPPETS[slug]
      htmlBySlug[slug] = await codeToHtml(code, {
        lang,
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      })
    }),
  )

  return (
    <Section>
      <SectionHeader
        eyebrow="The ecosystem"
        title="One ecosystem, four tools"
        bordered={true}
      />
      <EcosystemTabs htmlBySlug={htmlBySlug} />
    </Section>
  )
}

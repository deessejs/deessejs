import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CatalogPreviewTabs } from "@/components/catalog/catalog-preview-tabs"
import { SectionPreview } from "@/components/catalog/sections/preview"
import {
  getAllSectionParams,
  getSection,
} from "@/components/catalog/sections/catalogue"
import { getSectionSnippet } from "@/components/catalog/sections/snippets"

const SECTIONS_REPO_URL = "https://github.com/deessejs/deessejs"

/**
 * /sections/[category]/[section]
 *
 * Dynamic catch-all for the leaf of the sections tree. Pre-renders
 * every known `(category, section)` pair from the catalogue; a pair
 * that does not exist returns 404.
 *
 * The category is validated against the section: a typo'd
 * `/sections/hero/pricing-three-layer` (wrong category for the
 * slug) also returns 404 rather than rendering the wrong page.
 *
 * Pre-refactor: delegated to `SectionPage`. The body — back link,
 * hero, and tabbed preview — is inlined here.
 */
type Params = { category: string; section: string }

export function generateStaticParams(): Array<Params> {
  return getAllSectionParams()
}

export function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  return params.then(({ section }) => {
    const match = getSection(section)
    if (!match) return { title: "Section not found" }
    return {
      title: `${match.name} — Sections`,
      description: match.description,
    }
  })
}

export default async function SectionRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category, section } = await params
  const match = getSection(section)
  // Either the slug is unknown, or the (category, section) pair
  // does not match the catalogue. Both → 404.
  if (!match || match.category !== category) notFound()

  return (
    <>
      {/* Back to sections */}
      <div className="px-6 pt-12 lg:px-10">
        <Link
          href="/sections"
          className="inline-flex items-center gap-1 text-copy-14 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to sections
        </Link>
      </div>

      {/* Hero */}
      <header className="px-6 pt-6 pb-12 lg:px-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tighter text-balance sm:text-5xl">
            {match.name}.
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground [&:not(:first-child)]:mt-0">
            {match.description}
          </p>
        </div>
      </header>

      {/* Tabbed Preview / Code + inline install command */}
      <section
        aria-label={`${match.name} preview`}
        className="px-6 pb-12 lg:px-10"
      >
        <CatalogPreviewTabs
          slug={match.slug}
          itemName={match.name}
          itemKind="block"
          sourceRepoUrl={SECTIONS_REPO_URL}
          snippet={getSectionSnippet(match.slug)}
          preview={<SectionPreview section={match} />}
        />
      </section>
    </>
  )
}

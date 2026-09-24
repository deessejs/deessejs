import Link from "next/link"
import { allKbGuides } from "content-collections"

import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"

/** Latest guides — 4 featured KB articles, placeholder thumbnails. */
export function LatestGuides() {
  const featuredGuides = allKbGuides.slice(0, 4)
  return (
    <Section>
      <SectionHeader
        eyebrow="Latest guides"
        title=""
        action={{ href: "/knowledge-base", label: "All guides" }}
        bordered={false}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
        {featuredGuides.map((guide) => (
          <Link
            key={guide.slug}
            href={guide.url}
            className="group flex flex-col transition-colors hover:bg-accent/40"
          >
            {/* Placeholder thumbnail (mockup for now) */}
            <div
              aria-hidden
              className="relative aspect-[16/9] border-b border-border bg-muted/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
            </div>
            <div className="flex flex-col gap-2 p-6 lg:p-8 flex-1">
              <span className="font-mono uppercase text-[0.8125rem] leading-[1.2] text-foreground opacity-64 font-medium tracking-[-0.01em]">
                Guide
              </span>
              <h3 className="text-heading-20 lg:text-heading-24 tracking-tight text-foreground !m-0 text-balance">
                {guide.title}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                {guide.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  )
}

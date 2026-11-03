import * as React from "react"

import { FinalCta } from "@/components/pages/_shared/final-cta"

export default function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <FinalCta
        eyebrow="Keep learning"
        title="Find your next guide."
        body="Browse the knowledge base for practical guides, tutorials, and answers for building with DeesseJS."
        actions={[
          {
            label: "Browse all guides",
            href: "/knowledge-base",
            withArrow: true,
          },
          {
            label: "Read the blog",
            href: "/blog",
            variant: "outline",
          },
        ]}
      />
    </>
  )
}

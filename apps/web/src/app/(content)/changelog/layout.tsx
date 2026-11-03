import * as React from "react"

import { ContentFinalCta } from "@/components/blog/content-final-cta"

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <ContentFinalCta />
    </>
  )
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComponentPage } from "@/app/(marketing)/components/_components/component-page"
import {
  getAllComponentParams,
  getComponent,
} from "@/app/(marketing)/components/_components/components-list"
import { getCategory } from "@/app/(marketing)/components/_components/categories"

/**
 * /components/[category]/[component]
 *
 * Dynamic catch-all for the leaf of the components tree. Pre-renders
 * every known `(category, component)` pair from the catalogue; a
 * pair that does not exist returns 404.
 *
 * The category is validated against the component: a typo'd
 * `/components/forms/buttom` (wrong category for the slug) also
 * returns 404 rather than rendering the wrong page.
 */

type Params = { category: string; component: string }

export function generateStaticParams(): Array<Params> {
  return getAllComponentParams()
}

export function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  return params.then(({ component }) => {
    const match = getComponent(component)
    if (!match) return { title: "Component not found" }
    return {
      title: `${match.name} — Components`,
      description: match.description,
    }
  })
}

export default async function ComponentRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category, component } = await params
  const match = getComponent(component)
  // Either the slug is unknown, or the (category, component) pair
  // does not match the catalogue. Both → 404.
  if (!match || match.category !== category) notFound()
  const categoryMatch = getCategory(category)
  if (!categoryMatch) notFound()
  return <ComponentPage component={match} category={categoryMatch} />
}
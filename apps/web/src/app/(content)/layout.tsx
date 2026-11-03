import * as React from "react"

/**
 * Layout for the entire `(content)` route group.
 *
 * The shared-border card, container padding, and diagonal-stripe
 * framing are supplied by `<GlobalLayout>` in `apps/web/src/app/layout.tsx`,
 * so this layout only adds the surface-specific extras.
 *
 * Content-specific closing sections live in each route area's layout.
 */
export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

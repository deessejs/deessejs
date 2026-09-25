import { H2 } from "@workspace/ui/components/typography"
import { Card } from "@workspace/ui/components/card"

import { PRINCIPLES } from "@/lib/principles/tenets"

/**
 * /principles — Nine tenets section.
 *
 * Single visual section: an <ol> grid (1 / 2 / 3 cols by
 * breakpoint) of <Card>s. Each <li> carries list-none so the
 * auto-numeric marker doesn't double up with the visible Roman
 * numeral span. Card content order (number, title, body) is
 * fixed; the number stays first to anchor the eye on the Roman
 * numeral.
 *
 * The <H2> for "The nine tenets" lives here (inside the section
 * component) rather than in the route page, because the section
 * title is conceptually part of the section block — same as
 * enterprise's <ProcessTimeline> and <TrustAndCompliance> sections
 * that own their inner heading.
 */
export function NineTenets() {
  return (
    <section className="flex flex-col gap-6">
      <H2>The nine tenets</H2>
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PRINCIPLES.map((principle) => (
          <li key={principle.number} className="list-none">
            <Card className="flex h-full flex-col gap-3 p-6">
              <span className="text-label-13 font-mono text-muted-foreground">
                {principle.number}
              </span>
              <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                {principle.title}
              </h3>
              <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {principle.body}
              </p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}

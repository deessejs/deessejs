import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { GuideProductPill } from "./badges"

/**
 * Card for a guide in a KB grid (related guides, guides in
 * this topic). Uses the shadcn Card composition
 * (Card / CardHeader / CardTitle / CardDescription /
 * CardContent) so the spacing variable is shared with the
 * rest of the design system.
 *
 * The Card itself stays visually flat
 * (`rounded-none border-0 bg-background`) — the
 * composition change is structural, not visual.
 *
 * The entire card is a single clickable target. The Link
 * wraps the Card (display: flex) so the hit-test covers
 * title + description + pills. The title is no longer
 * nested in a Link — only the outer Link exists, and the
 * title is rendered as plain text inside the CardTitle.
 *
 * `text-balance` on the title and `text-pretty` on the
 * description eliminate single-word orphans on the 2nd
 * line of a 2-line title and on the last visible line
 * of a 3-line clamp.
 */
export function GuideCard({
  guide,
}: {
  guide: {
    title: string
    description: string
    products: string[]
    url: string
  }
}) {
  return (
    <Link
      href={guide.url}
      aria-label={`Read the ${guide.title} guide`}
      className="group flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex w-full flex-1 rounded-none border-0 bg-background transition-colors group-hover:bg-accent/30 group-focus-within:bg-accent/30">
        <CardHeader className="gap-3">
          <CardTitle className="text-label-16 font-semibold tracking-tight text-balance underline-offset-4 group-hover:underline">
            {guide.title}
          </CardTitle>
          <CardDescription className="text-copy-14 text-muted-foreground leading-7 line-clamp-3 text-pretty">
            {guide.description}
          </CardDescription>
        </CardHeader>
        {guide.products.length > 0 ? (
          <CardContent className="flex flex-wrap gap-1.5">
            {guide.products.slice(0, 3).map((product) => (
              <GuideProductPill key={product}>{product}</GuideProductPill>
            ))}
          </CardContent>
        ) : null}
      </Card>
    </Link>
  )
}
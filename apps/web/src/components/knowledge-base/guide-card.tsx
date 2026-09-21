import Link from "next/link"
import { Clock } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { AuthorAvatarLink } from "@/components/blog/author-avatar"

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
 * Layout mirrors the blog PostCard: date in the header
 * above the title, footer pinned at the bottom with author
 * + reading time. Optional fields fall back cleanly when
 * absent on older guides.
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
    date?: string
    readingTime?: number
    author?: {
      name: string
      role?: string
      avatar?: string
      handle: string
    }
  }
}) {
  return (
    <Link
      href={guide.url}
      aria-label={`Read the ${guide.title} guide`}
      className="group flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="flex w-full flex-1 flex-col rounded-none border-0 bg-background ring-0 transition-colors group-hover:bg-accent/30 group-focus-within:bg-accent/30">
        <CardHeader className="gap-3">
          {guide.date ? (
            <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <time dateTime={guide.date}>{guide.date}</time>
            </div>
          ) : null}
          <CardTitle className="mt-1 text-balance text-xl tracking-tight">
            {guide.title}
          </CardTitle>
          <CardDescription className="mt-2 line-clamp-3 text-sm text-muted-foreground">
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
        <div className="mt-auto px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1">
              {guide.author ? (
                <span className="inline-flex items-center gap-2">
                  <AuthorAvatarLink
                    author={{
                      name: guide.author.name,
                      handle: guide.author.handle,
                    }}
                    size={20}
                  />
                  <span className="text-xs text-foreground">
                    {guide.author.name}
                  </span>
                  {guide.author.role ? (
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {guide.author.role}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </div>
            {guide.readingTime ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {guide.readingTime} min read
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  )
}

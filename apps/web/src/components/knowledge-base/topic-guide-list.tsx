import { GuideCard } from "@/components/knowledge-base/guide-card"
import type { allKbGuides } from "content-collections"

/**
 * Vertical list of guides for a single KB topic page.
 *
 * The KB index renders 6-9 guides per topic across 3 columns
 * (`KbCardGrid`). But a single-topic page has between 1 and a handful
 * of guides, where a single-column list reads better than a grid:
 * full-width cards, comfortable reading widths, no awkward right-column
 * gutters, no division-of-attention across columns.
 *
 * Border strategy (Pattern A from `.claude/skills/tailwind-borders`):
 * `flex flex-col` on the wrapper with `divide-y divide-border` so each
 * row shares a hairline rule with its neighbours. A wrapper-level
 * `border border-border bg-background` closes the outer edges so the
 * first and last guides aren't visually orphaned from the page chrome.
 *
 * No search/filter input. A topic typically has 1-3 guides; the
 * dedicated `<GuideList>` on the KB index owns the filter UX for the
 * long corpus, and reusing it here would force this page to become a
 * client component for no real benefit.
 *
 * Reuses `GuideCard` directly — the cell body, fonts, and hover state
 * match the KB index `Featured Guides` grid so a visitor does not
 * perceive a visual mismatch when navigating from the index to a topic
 * detail.
 */

type TopicGuide = (typeof allKbGuides)[number]
// The shape `GuideCard` actually consumes — see
// `apps/web/src/components/knowledge-base/guide-card.tsx` for the
// definition. `TopicGuide` (from content-collections) infers
// `date: string | undefined` via Zod's `.optional()`, which trips
// `exactOptionalPropertyTypes: true` on `GuideCard`'s `date?: string`,
// so we project explicitly.
type GuideCardGuide = React.ComponentProps<typeof GuideCard>["guide"]

function project(guide: TopicGuide): GuideCardGuide {
  // exactOptionalPropertyTypes: true on GuideCard's `date?: string`
  // (and on `author.role?: string`, `author.avatar?: string`) means
  // we must omit the key when undefined instead of writing
  // `date: undefined`. This projector gives us that.
  const base: GuideCardGuide = {
    title: guide.title,
    description: guide.description,
    products: [...guide.products],
    url: guide.url,
    readingTime: guide.readingTime,
  }
  if (guide.date !== undefined) base.date = guide.date
  if (guide.author) {
    base.author = {
      name: guide.author.name,
      handle: guide.author.handle,
    }
    if (guide.author.role !== undefined) base.author.role = guide.author.role
    if (guide.author.avatar !== undefined) base.author.avatar = guide.author.avatar
  }
  return base
}

export function TopicGuideList({ guides }: { guides: ReadonlyArray<TopicGuide> }) {
  if (guides.length === 0) {
    return null
  }
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-border border border-border bg-background p-0">
      {guides.map((guide) => (
        <li key={guide.slug} className="h-full">
          <GuideCard guide={project(guide)} />
        </li>
      ))}
    </ul>
  )
}

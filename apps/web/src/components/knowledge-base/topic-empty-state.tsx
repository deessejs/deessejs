import type { ReactNode } from "react"

/**
 * Empty state for the "Guides in this topic" section on a KB topic
 * page when no guide covers that topic yet.
 *
 * Visual contract matches the empty-state used by `<GuideList>` on
 * the KB index (`apps/web/src/components/knowledge-base/guide-list.tsx`):
 * dashed border, generous padding, two lines (eyebrow + body). The
 * dashed border signals "placeholder" without looking like an error.
 *
 * Server-rendered. No client JS. The optional `action` slot lets a
 * future page add a CTA ("Browse all KB topics", "See the roadmap",
 * etc.) without re-templating the empty-state wrapper.
 */
export function TopicEmptyState({
  topicTitle,
  action,
}: {
  /** Topic display title (e.g. "Agents") used in the eyebrow. */
  topicTitle: string
  /** Optional CTA below the body. Pass `<Link>`-wrapped content. */
  action?: ReactNode
}) {
  return (
    <div className="border border-dashed border-border bg-background p-6 text-center sm:p-8">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        No guides in {topicTitle} yet
      </p>
      <p className="mt-3 max-w-md mx-auto text-pretty text-sm text-muted-foreground">
        We are still drafting content for this topic. Check back soon, or
        browse the rest of the knowledge base.
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

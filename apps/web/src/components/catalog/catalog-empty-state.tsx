type Props = {
  /** Headline shown centered. e.g. "No components match." */
  title: string
  /** Sub-copy shown below the headline in muted text. */
  description?: string
}

/**
 * Catalog chrome: empty state.
 *
 * Centered placeholder shown when a category drilldown returns no
 * items (typically after a search filter narrows to zero). The
 * `role="status"` + `aria-live="polite"` combination makes the
 * change readable by assistive tech without stealing focus.
 *
 * Pre-refactor: this was duplicated as inline `<div>` markup
 * inside `component-category-browser.tsx` and its blocks mirror.
 * Both have been replaced with calls to this component.
 */
export function CatalogEmptyState({ title, description }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center gap-4 border border-dashed border-border bg-muted/20 p-12 text-center"
    >
      <p className="text-heading-24 tracking-tight text-foreground">
        {title}
      </p>
      {description ? (
        <p className="text-copy-14 text-muted-foreground max-w-sm">
          {description}
        </p>
      ) : null}
    </div>
  )
}

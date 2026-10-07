import { Button } from "@workspace/ui/components/button"

/**
 * CSS-only tooltip on a comparison row attribute. Renders an underline
 * dotted on the wrapped text and reveals the explanation on hover or
 * keyboard focus. No JS, no portal — works in pure SSR HTML.
 */
export function AttributeTooltip({
  content,
  id,
  children,
}: {
  content: string
  id: string
  children: React.ReactNode
}) {
  return (
    <span className="group/attr relative inline-block">
      <Button
        asChild
        variant="ghost"
        size="sm"
        aria-describedby={id}
        className="h-auto cursor-help rounded-none border-b border-dotted border-muted-foreground/60 bg-transparent p-0 text-inherit transition-colors hover:bg-transparent hover:border-foreground focus-visible:bg-transparent focus-visible:border-foreground focus-visible:ring-0"
      >
        <span>{children}</span>
      </Button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-max max-w-[280px] rounded-md bg-foreground px-3 py-1.5 text-xs leading-relaxed text-balance text-background opacity-0 shadow-lg transition-opacity group-hover/attr:opacity-100 group-focus-within/attr:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}

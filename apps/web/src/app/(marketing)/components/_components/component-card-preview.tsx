import { Button } from "@workspace/ui/components/button"

type Props = {
  // V1 dummy: every card shows the same Button to telegraph
  // "design system surface" without committing to per-component
  // previews that would drift from the leaf.
  slug: string
}

/**
 * Mini-preview of a single component, rendered inside the
 * `aspect-video` slot at the top of each catalogue card on
 * `/components`.
 *
 * V1 dummy: every component renders the same `<Button>` from
 * `@workspace/ui` so the catalogue reads as a design-system
 * surface. V2 will switch on `slug` and render the actual
 * component (Button, Card, Dialog, etc.) by looking up a preview
 * registry.
 */
export function ComponentCardPreview(_props: Props) {
  return (
    <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-muted/40">
      <Button variant="default" tabIndex={-1} aria-hidden>
        Button
      </Button>
    </div>
  )
}
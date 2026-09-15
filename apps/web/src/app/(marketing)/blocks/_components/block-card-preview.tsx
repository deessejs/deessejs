import {
  Card,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type Props = {
  // Reserved for V2: each block slug renders a real section
  // (Hero, CTA, FAQ, etc.). V1 dummy: every card shows the same
  // Card mock so the catalogue reads as a sectioned-page surface
  // without committing to per-block previews that would drift
  // from the leaf.
  slug: string
}

/**
 * Mini-preview of a single block, rendered inside the
 * `aspect-video` slot at the top of each catalogue card on
 * `/blocks`.
 *
 * V1 dummy: every block renders the same `<Card>` mock from
 * `@workspace/ui` to telegraph "section of a marketing page".
 * V2 will switch on `slug` and render the actual section.
 */
export function BlockCardPreview(_props: Props) {
  return (
    <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-xs">
        <CardHeader>
          <CardTitle>Section</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
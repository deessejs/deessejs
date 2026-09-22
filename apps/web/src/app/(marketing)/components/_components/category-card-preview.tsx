import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"
import { Separator } from "@workspace/ui/components/separator"
import { Avatar } from "@workspace/ui/components/avatar"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Switch } from "@workspace/ui/components/switch"

import type { CatalogueComponent } from "./components-list"

type Props = {
  slug: CatalogueComponent["slug"]
}

/**
 * Mini preview of a single component, rendered inside the
 * 16:9 slot at the top of each category card on `/components`.
 *
 * Same shape as `ComponentCardPreview` (single Button mock
 * for V1 dummy), but here it renders a tiny preview that
 * visually hints at what the component looks like. Each slug
 * branches to the matching shadcn primitive in a compact
 * arrangement sized to fit a 16:9 card surface.
 *
 * Slugs without a tailored preview fall through to a
 * `<Button>slug</Button>` placeholder.
 */
export function CategoryCardPreview({ slug }: Props) {
  return (
    <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-muted/40 p-6">
      {renderPreview(slug)}
    </div>
  )
}

function renderPreview(slug: CatalogueComponent["slug"]) {
  switch (slug) {
    case "button":
      return <Button>Button</Button>
    case "badge":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
      )
    case "separator":
      return (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <p className="text-copy-14 text-muted-foreground">Above</p>
          <Separator />
          <p className="text-copy-14 text-muted-foreground">Below</p>
        </div>
      )
    case "skeleton":
      return (
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-full" />
        </div>
      )
    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <Avatar>FC</Avatar>
          <Avatar>PT</Avatar>
        </div>
      )
    case "input":
      return <Input type="email" placeholder="you@deessejs.com" className="w-72" />
    case "textarea":
      return <Textarea placeholder="Tell us more…" className="w-72" />
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox id={`cat-preview-${slug}`} />
          <label htmlFor={`cat-preview-${slug}`} className="text-copy-14">
            Option
          </label>
        </div>
      )
    case "switch":
      return (
        <div className="flex items-center gap-2">
          <Switch id={`cat-preview-${slug}`} />
          <label htmlFor={`cat-preview-${slug}`} className="text-copy-14">
            On
          </label>
        </div>
      )
    default:
      // Fallback for any slug not matched above. The "card" slug
      // was removed from the 1-category-per-component taxonomy, so
      // no specific case exists for it — this branch also handles
      // any future unhandled slugs and shows the slug as a label
      // so the card isn't empty.
      return (
        <span className="text-label-14 text-muted-foreground font-mono">
          {slug}
        </span>
      )
  }
}
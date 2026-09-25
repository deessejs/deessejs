import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

type Props = {
  /**
   * Slug of the component the card represents. Each card on the
   * `/components` index renders the actual shadcn primitive (not
   * a generic Button) — the category derives from the slug
   * prefix so the preview maps 1:1 to what the category page
   * drills into.
   */
  slug: string
}

/**
 * Mini-preview of a single component, rendered inside the
 * `aspect-video` slot at the top of each catalogue card on
 * `/components`. Renders the actual shadcn primitive for the
 * slug — Buttons for the button category, Inputs for the input
 * category, Badges for the badge category. Variants/sizes
 * showcase the primitive's range without committing to
 * per-component custom UI.
 */
export function ComponentCardPreview({ slug }: Props) {
  return (
    <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-muted/40">
      {renderPreview(slug)}
    </div>
  )
}

function renderPreview(slug: string) {
  if (slug.startsWith("button")) {
    // Buttons family: show the range of variants in a
    // real-looking arrangement.
    if (slug === "icon-button") {
      return (
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Add" tabIndex={-1}>
            +
          </Button>
          <Button size="icon" variant="default" aria-label="Notifications" tabIndex={-1}>
            N
          </Button>
          <Button size="icon" variant="ghost" aria-label="Close" tabIndex={-1}>
            X
          </Button>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button tabIndex={-1}>Primary</Button>
        <Button variant="secondary" tabIndex={-1}>
          Cancel
        </Button>
        <Button variant="destructive" tabIndex={-1}>
          Delete
        </Button>
      </div>
    )
  }

  if (slug.startsWith("input")) {
    if (slug === "textarea") {
      return (
        <Textarea
          placeholder="Type a message…"
          className="max-w-sm"
          tabIndex={-1}
        />
      )
    }
    if (slug === "input-search") {
      return (
        <div className="flex max-w-xs items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <span className="text-muted-foreground text-sm">🔎</span>
          <Input
            type="search"
            placeholder="Search…"
            className="h-7 border-0 p-0 focus-visible:ring-0"
            tabIndex={-1}
          />
        </div>
      )
    }
    if (slug === "input-otp") {
      return (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Input
              key={i}
              maxLength={1}
              defaultValue={i === 3 ? "4" : ""}
              inputMode="numeric"
              aria-label={`Digit ${i}`}
              className="h-9 w-9 text-center"
              tabIndex={-1}
            />
          ))}
        </div>
      )
    }
    if (slug === "input-tags") {
      return (
        <div className="flex max-w-xs flex-wrap items-center gap-1">
          <Badge variant="secondary" tabIndex={-1}>react</Badge>
          <Badge variant="secondary" tabIndex={-1}>next</Badge>
          <Badge variant="secondary" tabIndex={-1}>shadcn</Badge>
          <Input
            placeholder="Add…"
            className="h-6 w-16 border-0 p-0 focus-visible:ring-0"
            tabIndex={-1}
          />
        </div>
      )
    }
    return (
      <div className="flex w-full max-w-xs flex-col gap-1.5">
        <Input placeholder="Email" tabIndex={-1} />
        <Input placeholder="Password" type="password" tabIndex={-1} />
      </div>
    )
  }

  if (slug.startsWith("badge")) {
    if (slug === "badge-dot") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" tabIndex={-1}>
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Online
          </Badge>
          <Badge variant="destructive" tabIndex={-1}>
            <span className="size-1.5 rounded-full bg-red-500" aria-hidden />
            Offline
          </Badge>
        </div>
      )
    }
    if (slug === "badge-removable") {
      return (
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="secondary" tabIndex={-1}>
            urgent
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Remove urgent"
              className="ml-1"
              tabIndex={-1}
            >
              ×
            </Button>
          </Badge>
          <Badge variant="success" tabIndex={-1}>
            shipped
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Remove shipped"
              className="ml-1"
              tabIndex={-1}
            >
              ×
            </Button>
          </Badge>
        </div>
      )
    }
    if (slug === "badge-icon") {
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tabIndex={-1}>🔔 Notifications</Badge>
          <Badge variant="destructive" tabIndex={-1}>
            ⚠ Alerts
          </Badge>
        </div>
      )
    }
    if (slug === "badge-numeric") {
      return (
        <div className="flex items-center gap-2">
          <Badge tabIndex={-1}>3</Badge>
          <Badge tabIndex={-1}>42</Badge>
          <Badge variant="destructive" tabIndex={-1}>99+</Badge>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" tabIndex={-1}>Fixed</Badge>
        <Badge variant="warning" tabIndex={-1}>In review</Badge>
        <Badge variant="destructive" tabIndex={-1}>Blocked</Badge>
      </div>
    )
  }

  // Unknown / fallback
  return <Badge tabIndex={-1}>{slug}</Badge>
}
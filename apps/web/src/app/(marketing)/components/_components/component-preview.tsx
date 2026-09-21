import { useEffect, useState } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"
import { Card, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Avatar } from "@workspace/ui/components/avatar"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Switch } from "@workspace/ui/components/switch"

import type { CatalogueComponent } from "./components-list"

type Props = {
  slug: CatalogueComponent["slug"]
}

/**
 * Live preview of a single component. Renders the actual
 * `@workspace/ui` primitive so the visitor sees what the
 * component looks like and can interact with it.
 *
 * The Button preview is the only one that's `"use client"`-driven
 * via the inner `ButtonPreviewDemo` subcomponent — it changes
 * label on click to prove the primitive is live. The rest are
 * server-rendered previews.
 *
 * Slugs without a real preview fall through to a "Preview coming
 * in V2" placeholder.
 */
export function ComponentPreview({ slug }: Props) {
  const preview = renderPreview(slug)
  if (!preview) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-copy-14 text-muted-foreground">
          Preview coming in V2.
        </p>
        <p className="text-label-13 text-muted-foreground font-mono">
          {slug}
        </p>
      </div>
    )
  }
  return (
    <div className="flex min-h-48 items-center justify-center p-8">
      {preview}
    </div>
  )
}

function ButtonPreviewDemo() {
  const [clicked, setClicked] = useState(0)
  // Reset to 0 after 1.5s of inactivity so the label cycles back.
  useEffect(() => {
    if (clicked === 0) return
    const id = window.setTimeout(() => setClicked(0), 1500)
    return () => window.clearTimeout(id)
  }, [clicked])

  const label =
    clicked === 0 ? "Click me" : `Clicked ${clicked} time${clicked === 1 ? "" : "s"}`

  return (
    <Button onClick={() => setClicked((n) => n + 1)}>
      {label}
    </Button>
  )
}

function renderPreview(slug: CatalogueComponent["slug"]) {
  switch (slug) {
    case "button":
      return <ButtonPreviewDemo />
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
          <Checkbox id="preview-terms" />
          <label htmlFor="preview-terms" className="text-copy-14">
            Accept terms
          </label>
        </div>
      )
    case "switch":
      return (
        <div className="flex items-center gap-2">
          <Switch id="preview-switch" />
          <label htmlFor="preview-switch" className="text-copy-14">
            Enable notifications
          </label>
        </div>
      )
    case "card":
      // Card preview is already used as a wrapper for the preview slot,
      // so we render a minimal inner card to avoid nesting.
      return (
        <Card className="w-72">
          <CardHeader>
            <CardTitle>Card title</CardTitle>
          </CardHeader>
        </Card>
      )
    default:
      return null
  }
}
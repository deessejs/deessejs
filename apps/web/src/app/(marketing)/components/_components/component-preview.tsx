import { useEffect, useRef, useState } from "react"
import {
  Bell,
  Check,
  CircleAlert,
  Hash,
  Plus,
  Search,
  X,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"

import { ButtonPreviewDemo } from "./button-preview-demo"
import type { CatalogueComponent } from "./components-list"

type Props = {
  slug: CatalogueComponent["slug"]
}

/**
 * Live preview of a single component. Renders the actual
 * `@workspace/ui` primitive(s) in a compact arrangement sized to
 * the 16:9 preview slot of the leaf page.
 *
 * Slugs not matched below fall through to a "Preview coming in
 * V3" placeholder.
 */
export function ComponentPreview({ slug }: Props) {
  return (
    <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-muted/40">
      {renderPreview(slug)}
    </div>
  )
}

function renderPreview(slug: CatalogueComponent["slug"]) {
  switch (slug) {
    // ── button ───────────────────────────────────────────────
    case "button":
      // Real use case: a checkout form CTA. Different button
      // variants reflect the actions a real product needs
      // (primary action, destructive cancel, ghost link), not a
      // gallery of every variant the primitive ships with.
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button>Place order</Button>
          <Button variant="ghost">Save for later</Button>
          <Button variant="destructive">Cancel</Button>
        </div>
      )
    case "button-group":
      return (
        <div className="flex divide-x divide-border rounded-md border border-border">
          <Button variant="outline" className="rounded-none border-0">
            Day
          </Button>
          <Button variant="outline" className="rounded-none border-0">
            Week
          </Button>
          <Button variant="outline" className="rounded-none border-0">
            Month
          </Button>
        </div>
      )
    case "split-button":
      return (
        <div className="flex">
          <Button variant="default">Save</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" aria-label="More options">
                <Plus className="size-4 rotate-45" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Save as draft</DropdownMenuItem>
              <DropdownMenuItem>Save as copy</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    case "icon-button":
      return (
        <div className="flex gap-2">
          <Button size="icon" variant="outline" aria-label="Add item">
            <Plus className="size-4" aria-hidden />
          </Button>
          <Button size="icon" variant="default" aria-label="Notifications">
            <Bell className="size-4" aria-hidden />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Dismiss">
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      )
    case "loading-button":
      // Interactive — proves the Button is a live primitive
      // with state, not a static mock.
      return <ButtonPreviewDemo />

    // ── input ────────────────────────────────────────────────
    case "input":
      // Real use case: a sign-in form (email + password). The
      // page also adds a "forgot password?" ghost button to
      // mimic the actions a real auth form exposes.
      return (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Input type="email" placeholder="Email" autoComplete="email" />
          <Input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>
      )
    case "input-search":
      return <SearchPreview />
    case "input-otp":
      return <OtpPreview />
    case "input-tags":
      return <TagsPreview />
    case "textarea":
      return (
        <Textarea
          placeholder="Tell us what's on your mind…"
          className="min-h-24 max-w-md"
        />
      )

    // ── badge ────────────────────────────────────────────────
    case "badge":
      // Real use case: a list of bug-fix / version tags pinned to
      // an issue card. Each variant maps to a real state a
      // project tracker would show.
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">Fixed</Badge>
          <Badge variant="warning">In review</Badge>
          <Badge variant="destructive">Blocked</Badge>
          <Badge variant="secondary">v2.1.0</Badge>
          <Badge>Open</Badge>
        </div>
      )
    case "badge-dot":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            Online
          </Badge>
          <Badge variant="destructive">
            <span className="size-1.5 rounded-full bg-red-500" aria-hidden />
            Offline
          </Badge>
          <Badge variant="warning">
            <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
            Syncing
          </Badge>
        </div>
      )
    case "badge-removable":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            urgent
            <button
              type="button"
              aria-label="Remove urgent"
              className="ml-1"
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
          <Badge variant="success">
            <Check className="size-3" aria-hidden />
            shipped
            <button
              type="button"
              aria-label="Remove shipped"
              className="ml-1"
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
        </div>
      )
    case "badge-icon":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge>
            <Bell className="size-3" aria-hidden />
            Notifications
          </Badge>
          <Badge variant="destructive">
            <CircleAlert className="size-3" aria-hidden />
            Alerts
          </Badge>
        </div>
      )
    case "badge-numeric":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge>3</Badge>
          <Badge>42</Badge>
          <Badge>99</Badge>
          <Badge variant="destructive">99+</Badge>
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <span className="font-mono text-copy-13 text-muted-foreground">
            {slug}
          </span>
          <span className="text-copy-13 text-muted-foreground">
            Preview coming in V3.
          </span>
        </div>
      )
  }
}

// ── small interactive sub-components ───────────────────────────

function SearchPreview() {
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 250)
    return () => window.clearTimeout(id)
  }, [query])
  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <div className="relative">
        <Search
          className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search components…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 pr-8"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute right-2 top-2"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      <p className="text-copy-13 text-muted-foreground">
        Debounced:{" "}
        <span className="font-mono">{debounced || "—"}</span>
      </p>
    </div>
  )
}

function OtpPreview() {
  const CELLS = 6
  // useRef<Array<HTMLInputElement | null>>([]) infers as
  // RefObject<Array<HTMLInputElement | null>> in TS 6, which
  // does not allow numeric index access on .current. Cast
  // through unknown to a plain mutable array so we can do
  // refs.current[i] = el in the ref callback below.
  const refs: { current: (HTMLInputElement | null)[]; [k: number]: HTMLInputElement | null } = { current: [] }
  const [values, setValues] = useState<string[]>(
    Array.from({ length: CELLS }).map(() => ""),
  )

  const focusNext = (i: number) => {
    const next = refs[i + 1]
    if (next) next.focus()
  }

  return (
    <div className="flex gap-2">
      {values.map((value, i) => (
        <Input
          key={i}
          ref={(el: HTMLInputElement | null) => {
            refs[i] = el
            return undefined
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${CELLS}`}
          className="h-12 w-12 text-center text-xl"
          value={value}
          onChange={(e) => {
            const next = values.slice()
            next[i] = e.target.value
            setValues(next)
            if (e.target.value) focusNext(i)
          }}
          onPaste={(e) => {
            const data = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, CELLS)
            const next = values.slice()
            for (let j = 0; j < CELLS; j++) {
              const ch: string = data.charAt(j) || ""
              next[j] = ch
              const input = refs.current[j]
              if (input) input.value = ch
            }
            setValues(next)
            const lastInput = refs.current[Math.min(data.length, CELLS) - 1]
            if (lastInput) lastInput.focus()
          }}
        />
      ))}
    </div>
  )
}

function TagsPreview() {
  const [tags, setTags] = useState(["react", "next", "shadcn"])
  const [draft, setDraft] = useState("")

  const addTag = () => {
    const next = draft.trim().toLowerCase()
    if (next && !tags.includes(next)) setTags([...tags, next])
    setDraft("")
  }

  return (
    <div className={cn("flex max-w-sm flex-wrap items-center gap-2")}>
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => setTags(tags.filter((t) => t !== tag))}
            className="ml-1"
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            addTag()
          } else if (e.key === "Backspace" && !draft && tags.length) {
            setTags(tags.slice(0, -1))
          }
        }}
        onBlur={addTag}
        placeholder="Add tag…"
        className="w-32"
      />
    </div>
  )
}
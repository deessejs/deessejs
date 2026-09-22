/**
 * V2 hand-written snippets for the Code tab on every
 * `/components/[category]/[component]` page. Each entry is a
 * shadcn usage example that the consumer can copy-paste.
 *
 * Snippets are exhaustive over `CatalogueComponent["slug"]` —
 * the trailing `satisfies` check turns a missing slug into a
 * compile error.
 *
 * V3 will replace these with parsed source from
 * `packages/ui/src/components/<slug>.tsx`.
 */

import type { CatalogueComponent } from "./components-list"

const SNIPPETS = {
  // ── button ──────────────────────────────────────────────────
  button: `import { Button } from "@workspace/ui/components/button"

export function Example() {
  return <Button>Click me</Button>
}`,

  "button-group": `import { Button } from "@workspace/ui/components/button"

export function Example() {
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
}`,

  "split-button": `import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export function Example() {
  return (
    <div className="flex">
      <Button>Save</Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="icon" aria-label="More options">
            <ChevronDown className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Save as draft</DropdownMenuItem>
          <DropdownMenuItem>Save as copy</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}`,

  "icon-button": `import { Button } from "@workspace/ui/components/button"
import { Plus } from "lucide-react"

export function Example() {
  return (
    <Button size="icon" variant="outline" aria-label="Add item">
      <Plus className="size-4" aria-hidden />
    </Button>
  )
}`,

  "loading-button": `"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function Example() {
  const [isLoading, setIsLoading] = useState(false)
  return (
    <Button
      disabled={isLoading}
      onClick={() => {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 1500)
      }}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {isLoading ? "Saving…" : "Save"}
    </Button>
  )
}`,

  // ── input ───────────────────────────────────────────────────
  input: `import { Input } from "@workspace/ui/components/input"

export function Example() {
  return (
    <Input type="email" placeholder="you@deessejs.com" className="max-w-sm" />
  )
}`,

  "input-search": `"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"

export function Example() {
  const [value, setValue] = useState("")
  return (
    <div className="relative max-w-sm">
      <Search
        className="text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 size-4"
        aria-hidden
      />
      <Input
        type="search"
        placeholder="Search…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-8 pr-8"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}`,

  "input-otp": `"use client"

import { useRef } from "react"

import { Input } from "@workspace/ui/components/input"

const CELLS = 6

export function Example() {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  return (
    <div className="flex gap-2">
      {Array.from({ length: CELLS }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          inputMode="numeric"
          maxLength={1}
          aria-label={\`Digit \${i + 1} of \${CELLS}\`}
          className="h-12 w-12 text-center text-xl"
          onChange={(e) => {
            const next = refs.current[i + 1]
            if (e.target.value && next) next.focus()
          }}
          onPaste={(e) => {
            const data = e.clipboardData.getData("text").slice(0, CELLS)
            data.split("").forEach((digit, j) => {
              const input = refs.current[j]
              if (input) input.value = digit
            })
          }}
        />
      ))}
    </div>
  )
}`,

  "input-tags": `"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"

export function Example() {
  const [tags, setTags] = useState(["react", "next"])
  const [draft, setDraft] = useState("")

  const addTag = () => {
    const next = draft.trim()
    if (next && !tags.includes(next)) setTags([...tags, next])
    setDraft("")
  }

  return (
    <div className="flex max-w-sm flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
          <button
            type="button"
            aria-label={\`Remove \${tag}\`}
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
}`,

  textarea: `import { Textarea } from "@workspace/ui/components/textarea"

export function Example() {
  return (
    <Textarea
      placeholder="Tell us what's on your mind…"
      className="min-h-32 max-w-md"
    />
  )
}`,

  // ── badge ───────────────────────────────────────────────────
  badge: `import { Badge } from "@workspace/ui/components/badge"

export function Example() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </div>
  )
}`,

  "badge-dot": `import { Badge } from "@workspace/ui/components/badge"

export function Example() {
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
}`,

  "badge-removable": `"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"

export function Example() {
  const [tags, setTags] = useState(["urgent", "release", "v2"])
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
          <button
            type="button"
            aria-label={\`Remove \${tag}\`}
            onClick={() => setTags(tags.filter((t) => t !== tag))}
            className="ml-1"
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
    </div>
  )
}`,

  "badge-icon": `import { Bell } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"

export function Example() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge>
        <Bell className="size-3" aria-hidden />
        Notifications
      </Badge>
      <Badge variant="destructive">
        <Bell className="size-3" aria-hidden />
        Alerts
      </Badge>
    </div>
  )
}`,

  "badge-numeric": `import { Badge } from "@workspace/ui/components/badge"

function format(n: number, max = 99) {
  return n > max ? \`\${max}+\` : String(n)
}

export function Example() {
  return (
    <div className="flex flex-wrap gap-3">
      <Badge>{format(3)}</Badge>
      <Badge>{format(42)}</Badge>
      <Badge>{format(99)}</Badge>
      <Badge variant="destructive">{format(100)}</Badge>
      <Badge variant="destructive">{format(1500)}</Badge>
    </div>
  )
}`,
} as const satisfies Record<CatalogueComponent["slug"], string>

export function getComponentSnippet(slug: CatalogueComponent["slug"]): string {
  // `as const satisfies Record<...>` makes the type exact with no
  // index signature, so a direct `SNIPPETS[slug]` access fails type
  // check. Cast through `unknown` first so we keep the function's
  // `string` return type without an `| undefined` widening.
  const map = SNIPPETS as unknown as Record<string, string>
  return map[slug]!
}
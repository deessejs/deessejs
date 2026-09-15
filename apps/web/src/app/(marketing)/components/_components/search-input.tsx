"use client"

import { Search, X } from "lucide-react"

import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** Visually hide the input label but keep it screen-reader accessible. */
  "aria-label"?: string
}

/**
 * Text-search input shared by the components index and category
 * pages. Dumb component: state lives in the parent
 * (`CatalogueBrowser` or `CategorySearchableList`), this just
 * renders the field and forwards value changes.
 *
 * Clear button (`X`) appears when the field is non-empty.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  "aria-label": ariaLabel = "Search",
}: Props) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center",
        className,
      )}
    >
      <Search
        className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-8 w-full pl-7 pr-8 text-sm"
      />
      {value.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1 size-6"
        >
          <X className="size-3" aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
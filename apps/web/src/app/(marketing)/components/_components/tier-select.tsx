"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import type { TierFilter } from "./components-list"
import { TIER_ORDER } from "./components-list"

type Props = {
  value: TierFilter
  onChange: (value: TierFilter) => void
}

const LABELS: Record<TierFilter, string> = {
  all: "All tiers",
  free: "Free",
  pro: "Pro",
}

/**
 * Dropdown to filter the catalog by price tier (All / Free / Pro).
 * Reused on `/components`, `/components/[category]`, `/blocks`,
 * `/blocks/[category]`.
 *
 * Uses the shadcn `<Select>` primitive — Radix-based, keyboard
 * accessible. The `value` is a `TierFilter` (the type union
 * re-exported from `components-list.ts`).
 */
export function TierSelect({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TierFilter)}>
      <SelectTrigger aria-label="Filter by price tier" className="h-8 w-32">
        <SelectValue placeholder="All tiers">{LABELS[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TIER_ORDER.map((tier) => (
          <SelectItem key={tier} value={tier}>
            {LABELS[tier]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
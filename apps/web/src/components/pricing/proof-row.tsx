import { CreditCard, Fingerprint, LayoutDashboard } from "lucide-react"

import {
  Card,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/ui/card"

import type { ProofItem } from "@/lib/pricing/types"

const PROOF_ICONS = [Fingerprint, CreditCard, LayoutDashboard] as const

/**
 * ProofRow — Layer 4 (Proof).
 *
 * A real 3-card grid showing "what you ship on day 1". Each card has an
 * icon badge, a title, and a description. Matches the new tier card
 * aesthetic (rounded-lg, 1px border, bg-background, shadow-sm).
 */
export function ProofRow({ items }: { items: ProofItem[] }) {
  return (
    <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => {
        const Icon = PROOF_ICONS[i % PROOF_ICONS.length]
        return (
          <Card
            key={item.title}
            className="flex flex-col rounded-lg border bg-background p-6 shadow-sm"
          >
            <div className="inline-flex size-10 items-center justify-center rounded-lg border border-border/50 bg-muted/30">
              <Icon className="size-5 text-foreground" aria-hidden />
            </div>
            <CardTitle className="mt-4 text-base font-semibold tracking-tight text-foreground">
              {item.title}
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.caption}
            </CardDescription>
          </Card>
        )
      })}
    </div>
  )
}
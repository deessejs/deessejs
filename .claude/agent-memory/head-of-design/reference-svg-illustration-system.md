---
name: reference-svg-illustration-system
description: DeesseJS bespoke SVG illustration system — hairline 1.5px stroke, currentColor, 320×240 viewBox, mono with currentColor accent, no shadows; sits alongside [[feedback-deessejs-mono-design-language]]; built bespoke in apps/web/src/components/illustrations/ rather than adopting an external library
metadata:
  type: reference
---

# DeesseJS bespoke SVG illustration system

Established 2026-06-26 after research into Vercel / Supabase / Linear / Stripe illustration vocabulary. DeesseJS uses **bespoke hand-written SVG React components** (no external illustration library), living at `apps/web/src/components/illustrations/`.

## Why bespoke, not a library

- Existing dependency `lucide-react@1.21.0` is non-standard (some icons missing); adding a second icon/illustration lib compounds the version-drift risk
- The DeesseJS aesthetic is deliberately restrained — most third-party illustration packs lean colorful / 3D / playful, which fights the brand
- Illustrations are few (~6–10 over the site lifetime) — authoring cost is one-time, license/maintenance cost is forever
- Phosphor Icons (MIT) is the design **reference** for line weight and anatomy, NOT something we install

## Visual vocabulary (from Vercel / Supabase / Linear research)

| Trait | Value | Source |
|---|---|---|
| Stroke width | `1.5` (hero) / `1` (inline) | Vercel hero SVG, Supabase vector graph |
| Stroke caps | `round` | Linear March 2026 |
| Stroke joins | `round` | Linear March 2026 |
| Default fill | `none` | all three |
| Color strategy | `currentColor` for stroke; mono palette everywhere | DeesseJS mono rule |
| Radius | `6` (matches button/input) | Geist |
| Aspect ratio | `viewBox="0 0 320 240"` (4:3) for section heroes | Vercel hero uses fixed-aspect frames |
| Padding | `p-6` minimum inside the SVG container | Geist card padding |
| Motion | Static OR conditional cursor-glow (Supabase pattern); no autoplay animations | Geist motion: "0ms is best" |
| Shadows | **Never** — depth comes from layer order + opacity | Linear + DeesseJS existing rule |

## Anatomy of a hero illustration component

```tsx
import type { SVGProps } from "react"

interface HeroIllustrationProps extends SVGProps<SVGSVGElement> {
  /** Optional accent color override; defaults to currentColor */
  accentClassName?: string
}

/**
 * AgentMesh — node-and-edge constellation representing
 * the agent-callable surface (auth, billing, jobs, storage).
 * 320×240 viewBox; inherits text color via currentColor.
 */
export function AgentMesh({ className, accentClassName = "text-foreground", ...props }: HeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {/* nodes */}
      <circle cx="160" cy="120" r="6" className={accentClassName} fill="currentColor" stroke="none" />
      {/* edges */}
      <path d="M160 120 L80 60 M160 120 L240 60 M160 120 L80 180 M160 120 L240 180" />
      {/* child nodes */}
      <circle cx="80" cy="60" r="4" />
      {/* ... */}
    </svg>
  )
}
```

**Rules:**
1. Always `aria-hidden` (decorative; section provides alt copy).
2. Always spread `...props` last so consumers can override `aria-label` if the SVG carries semantic meaning.
3. `fill="none"` + `stroke="currentColor"` on the root `<svg>` so children inherit cleanly.
4. `currentColor` for the **only** accent (typically the active node); everything else is a stroke. Never two accent colors in one illustration.
5. No `<defs>` gradients except for the cursor-tracked glow pattern (Supabase hero). Static illustrations stay pure.
6. Component filename = `kebab-case-hero-name.tsx`, exported as `PascalCase`.

## Subject library (first batch, 2026-06-26)

| File | Subject | Used on |
|---|---|---|
| `agent-mesh.tsx` | Constellation: central node + 4 satellite nodes + edges | About hero |
| `terminal-prompt.tsx` | Terminal window with mono prompt + caret | Home hero, pricing FAQ |
| `tier-stack.tsx` | Three stacked rounded rectangles (mini tier cards) | Pricing hero |
| `checklist-lock.tsx` | Hairline checklist + padlock at bottom | Security section |
| `cursor-on-card.tsx` | Card with floating cursor + click ripple | "For coding agents" conviction |
| `hex-grid.tsx` | 4×3 hex tile background pattern | Empty states, section dividers |

## What NOT to do

- **Don't import Phosphor / unDraw / Storyset / Blush / Humaaans.** Brand mismatch and license sprawl.
- **Don't use `lucide-react` illustrations.** They're icon-sized; forcing them into hero illustrations pixelates.
- **Don't autoplay animate.** Geist rule: motion clarifies, never decorates. Loops are forbidden unless conditional (cursor-tracked gradient OK).
- **Don't use multiple accent colors.** One accent per illustration (or zero).
- **Don't add drop shadows.** Depth via stroke contrast and opacity only.

## How to apply

When asked for an illustration, hero, or empty-state graphic:
1. Check `apps/web/src/components/illustrations/` first — if a subject fits, reuse it.
2. If not, author a new component following the anatomy above. Don't reach for an external pack.
3. Wire it into the page as a sibling to the heading (`<div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">` pattern), not behind the heading (Vercel/Linear pattern).
4. Always verify dark mode in the design check (the SVG should look correct on both `bg-background` and `bg-muted/30`).

## Related memories

- [[feedback-deessejs-mono-design-language]] — the broader mono design language this extends
- [[reference-vercel-geist]] — Vercel's design system (stroke weight, motion, padding values)
- [[reference-shadcn]] — shadcn as the design system foundation; illustrations sit ABOVE shadcn primitives
- [[project-pricing-page-2026-06-26]] — pricing page where the first illustrations will be wired

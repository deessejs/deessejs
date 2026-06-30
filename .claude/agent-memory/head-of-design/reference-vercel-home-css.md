---
name: reference-vercel-home-css
description: Concrete CSS techniques from Vercel.com home — print-mark crosshair grid (1px lines, 10-15% opacity), mono palette, no decorative motion; the gold standard for "developer-grade" marketing sites
metadata:
  type: reference
---

# Vercel home — CSS technique inventory

Verified 2026-06-26 from `https://vercel.com` + `https://vercel.com/geist/grid` + Roman Kamushken's April 2026 Setproduct deep-dive + Rauno Freiberg's 2023 craft essay.

## The grid (the signature element)

Two layered CSS gradients on a single element:

```css
.grid-background {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

Rules (Setproduct article, confirmed):
- Opacity **5–10%** for the line color. If you see the grid before you read the headline, it's too strong.
- Spacing **must** be consistent across the entire site (8 or 16px increments).
- Dark mode: same opacity rule, lines on the dark surface token (`oklch(0.18 0 0)` background → `rgba(255, 255, 255, 0.05)` lines).
- DeesseJS token mapping: `bg-foreground/5` for light, `bg-background/5` (inverted) for dark via CSS variables.

**Variant — dot matrix:**
```css
.dot-grid {
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 16px 16px;
}
```

## Crosshair print-marks

The "register mark" detail Vercel puts at grid intersections (a + or × glyph, 12px). Two approaches:
1. **SVG overlay** — a `<svg>` with `<path>` crosses at each intersection, `stroke="currentColor"`, `opacity={0.15}`
2. **Radial gradient dots** — `background-image: radial-gradient(circle, currentColor 0.5px, transparent 1px); background-size: 96px 96px;` (one dot per 4×4 grid cells)

Approach #2 is cheaper. Use it.

## Typography scale (Geist)

| Token | Size | Line-height | Weight | Letter-spacing |
|---|---|---|---|---|
| Hero headline | 72px desktop / 48px mobile | 1.0 | 600 (semibold) | `-0.04em` |
| Section headline | 48px desktop / 32px mobile | 1.05 | 600 | `-0.03em` |
| Subhead | 20px | 1.5 | 400 | `-0.01em` |
| Body | 16px | 1.6 | 400 | 0 |
| Mono label | 14px (Geist Mono) | 1.4 | 500 | `0.02em` uppercase |

**Critical:** `letter-spacing` tightens as size grows. Without `-0.04em` on the 72px hero, it reads as "designed by committee" not "by Vercel."

## Section composition

- **Container**: `max-w-[1200px]`, side padding grows at breakpoints (`px-4 sm:px-6 lg:px-8`).
- **Vertical rhythm**: 96–128px between major sections (`py-24 sm:py-32`).
- **Hairline dividers**: every section ends with `border-b border-border/40`. Never background fills.
- **Cards**: 24px padding, no shadows, 12px radius (Geist cards).

## Color usage

| Where | Color |
|---|---|
| Background | `oklch(1 0 0)` (light) / `oklch(0.18 0 0)` (dark) |
| Text primary | `oklch(0.18 0 0)` / `oklch(0.96 0 0)` |
| Text secondary | `oklch(0.45 0 0)` / `oklch(0.7 0 0)` |
| Border | `oklch(0.18 0 0 / 0.1)` / `oklch(1 0 0 / 0.1)` |
| Accent (single) | `oklch(0.55 0.18 250)` (a focused blue, used sparingly) |

**Rule:** accent appears on exactly ONE element per section (one CTA, one link, one active dot). Never on a row of items.

## Motion

- Geist rule: **"0ms is best."** Most interactions are instant.
- When motion is necessary (popovers, modals): 150–300ms with `cubic-bezier(0.175, 0.885, 0.32, 1.1)`.
- `prefers-reduced-motion` honored for everything nonessential.

## What Vercel does NOT do

- No mesh gradients (the brand is editorial-mono, not warm-blob)
- No illustrations on the home hero (the grid IS the illustration)
- No animated SVG cursors or floating emojis
- No background image hero

## Source URLs

- https://vercel.com — current home
- https://vercel.com/geist/introduction — Geist design tokens
- https://vercel.com/geist/grid — GridSystem component source
- https://rauno.me/craft/vercel — Rauno's 2023 craft essay (founder quotes the underlying grid component code with `display: contents` trick)
- https://www.setproduct.com/blog/complete-guide-to-blueprint-grid-design — April 2026 deep-dive with CSS recipes

## Related memories

- [[reference-svg-illustration-system]] — Vercel doesn't use SVG illustrations on the home; grid + crosshairs carry the visual weight
- [[feedback-deessejs-mono-design-language]] — DeesseJS already aligns with this aesthetic (mono, hairline, no shadows)
- [[reference-supabase-home-css]] — for the mesh-gradient + cursor-glow techniques Vercel explicitly avoids

---
name: feedback-deessejs-mono-design-language
description: DeesseJS design system is deliberately monochrome (oklch black/white + greys, no chromatic accents) — check icons use text-foreground, not emerald; borders beat shadows per Linear March 2026
metadata:
  type: feedback
---

# DeesseJS visual language: monochrome + hairline borders

Established 2026-06-26 during the `/pricing` work. The design system is deliberately restrained — and the user expects this restraint to be defended against "design as usual" defaults.

## No chromatic accents

- Check icons: `text-foreground` (full black/white), **never** emerald/green
- Highlighted tier: differentiated by border + badge + CTA variant, **not** background fill
- Status colors are limited to: `destructive` (red for errors) + `accent` (used sparingly) — that's it

This is in deliberate contrast to the shadcn community examples (e.g. shadcn.io's `pricing-feature-matrix` block uses `text-emerald-500` checks; their `pricing66` example uses `lucide-circle-check text-emerald-700`). **The community examples are useful for layout inspiration, not for color.** When porting a reference, replace emerald/green with `text-foreground`.

## Borders beat shadows (2026 trend)

Per [[reference-vercel-geist]] + Linear's public design system (March 2026 update, cited via Pravin Kumar's June 2026 article): "entire UI uses three border tokens and zero shadow tokens." Hairline borders work in both light and dark mode; shadows age badly in dark mode.

**In practice for DeesseJS:**
- Default border: `border-border/40` (1px solid, ~10% opacity)
- Emphasized border: `border-foreground` (full opacity) or `border-foreground/60`
- Hover signal: `hover:border-foreground/30` (border darkens, not a shadow)
- Drop shadows: only on floating UI (popovers, dialogs) where elevation is the message

This contradicts shadcn's defaults (which ship with `shadow-sm` on most cards). Override aggressively.

## Card anatomy (the DeesseJS way)

After the pricing work, the canonical card is:

```
rounded-lg border bg-background p-6 shadow-sm   ← outer
+ flex flex-col gap-N                            ← layout
+ [optional inline badge]                        ← header (name + Most popular inline, NOT above)
+ Separator my-N                                 ← divider before price
+ price block                                    ← $ + amount + sub-text
+ [optional CTA button — h-9 rounded-md]        ← shadcn default size
+ [optional reassurance line]
+ Separator my-N                                 ← divider before features
+ [optional "Key features:" + 3-5 bullets]
+ [optional footer link]
```

The "Most popular" badge is **inline with the tier name** (with `<Zap />` icon for Pro), not above the card. Above-card badges get clipped by the Card's `overflow-hidden` and read as detached from the content.

## Pricing comparison matrix — established pattern

`feature-matrix.tsx` is the canonical reference for any tabular data component:
- Sticky first column (label) + sticky top row (tier names)
- `bg-background` uniform (no per-column tint)
- `border-l border-border/40` on every cell except the first column (vertical rules between columns)
- Row dividers from TableRow primitive
- Category header bands: `bg-muted/50`, full-width, uppercase tracking-widest
- Highlighted column differentiation: border + ring + badge + primary CTA — never background fill
- Z-index dance per CSS-Tricks: sticky label cell `z-10`, sticky header row `z-20`, intersection `z-30`

The same pattern is used by `comparison-block.tsx` (DeesseJS vs competitors) for visual consistency.

## Why this matters

When proposing visual changes, don't default to "the usual" shadcn treatment. The user will:
- Reject emerald/green check icons → use `text-foreground`
- Reject heavy shadows → use hairline borders
- Reject per-column background tints → use uniform `bg-background` + column dividers
- Reject above-card badges → use inline badges
- Reject pill buttons (`rounded-full`) → use `rounded-md` (shadcn default) or `rounded-lg` for emphasis

## Nuance (added 2026-06-26, second iteration)

The "no chromatic accents" rule above is the **default for shadcn primitive content** (check icons, status badges, tier differentiation, table cells). It is **NOT a blanket ban on color in the DeesseJS site**.

The user explicitly pushed back when I proposed making the home features section mono-only:

> "Les features cards manquent de couleurs mais surtout par rapport à des logos et illustrations comme on parle depuis tout à l'heure."

**Why:** the features cards carry **logos** (Next.js, TypeScript, Tailwind, shadcn, Postgres, Drizzle, Stripe — they're already chromatic) and **product iconography** (Rocket, Bot, Database, Shield — these have semantic associations). A grey-on-grey card background makes the chromatic logos look out of place. The mono rule was designed for **content surfaces** (table cells, check icons, badges) where color has no semantic role — not for **branding surfaces** (logos, product icons, illustrations) where color is the message.

**How to apply:**
- ✅ Use `bg-muted/30` or `bg-card/50` for card backgrounds (mono)
- ✅ Keep check icons / status badges / tier differentiation mono
- ✅ LET logos and product icons carry their native color
- ✅ Add **bespoke SVG illustrations** with a colored accent (per [[reference-svg-illustration-system]]'s `accentClassName` prop) when the section needs visual weight
- ❌ Don't add emerald/green to a `<Check />` icon — that's mono territory
- ❌ Don't tint the card background with `bg-blue-500/10` to "match" a logo — the logo's color is enough
- ❌ Don't use `rounded-full` colored pills everywhere — that's the shadcn samey look

**The test:** if a child of the card carries its own color (logo, product icon, illustration), the card itself stays neutral. If the card has no chromatic children, the card stays mono.

## Related memories

- [[reference-vercel-geist]] — inspiration source for the restrained aesthetic
- [[feedback-shadcn-border-token-subtle]] — why default `--border` is too faint and we use `border-foreground/15`
- [[project-deessejs-product]] — 6 design principles including "restraint over decoration"
- [[reference-svg-illustration-system]] — for when to add a colored accent (illustration, not card chrome)
- [[reference-flowline-decomposition]] — Sophie's pattern: section labels and stat icon badges carry semantic color, chrome stays neutral

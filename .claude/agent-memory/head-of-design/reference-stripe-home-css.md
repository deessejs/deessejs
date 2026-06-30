---
name: reference-stripe-home-css
description: Concrete CSS techniques from Stripe.com — gradient text headlines (background-clip: text), mesh gradient accents in marketing, sharp card grids with parallelogram motif, monochrome SVG illustrations; the "subtle warmth" precedent
metadata:
  type: reference
---

# Stripe home — CSS technique inventory

Verified 2026-06-26 from `https://stripe.com` + `https://stripe.com/pricing` + https://designcompass.org/en/archive/stripe-2026/.

## Gradient text headlines (Stripe signature)

Stripe uses a multi-stop gradient as the FILL of headlines, not the background:

```css
.gradient-headline {
  background: linear-gradient(
    90deg,
    oklch(0.55 0.2 30),
    oklch(0.65 0.2 60),
    oklch(0.55 0.2 250),
    oklch(0.45 0.15 280)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

**Rules:**
- Use 3–4 color stops, not 2 (avoids the "rainbow banner" look).
- All stops should be in the same lightness band (`oklch(0.5–0.65)`).
- Hue range: 180–240° of the color wheel for cohesion.
- Apply only to the HEADLINE, not body or subhead.
- Dark mode: invert lightness (use `oklch(0.75–0.85)` for the stops).

**Browser support:** `background-clip: text` works in all browsers since 2021. The `-webkit-` prefix is still required for Safari 14.

**For DeesseJS (mono brand):** apply the SAME technique but with monochrome stops — `oklch(0.2 0 0)` → `oklch(0.45 0 0)` → `oklch(0.18 0 0)`. The "gradient" becomes a tonal shift rather than chromatic.

## Mesh gradient accents (Stripe 2026)

Stripe's hero has a **subtle** mesh gradient — much less saturated than Supabase's:

```css
.stripe-mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(at 30% 20%, oklch(0.7 0.15 250 / 0.15), transparent 50%),
    radial-gradient(at 70% 80%, oklch(0.7 0.15 30 / 0.1), transparent 60%),
    radial-gradient(at 50% 50%, oklch(0.95 0.05 60 / 0.08), transparent 70%);
  filter: blur(40px);
  z-index: -1;
}
```

**The difference from Supabase:**
- Stripe's mesh is **barely visible** (max alpha 0.15). It's a "vibe," not a hero element.
- The mesh is BEHIND content (z-index: -1), not the background.
- One layer of blur (40px) — not the 80px Supabase uses.

**For DeesseJS:** if we add a mesh, this is the recipe — subtle, behind content, max alpha 0.15.

## Card grids with parallelogram motif

Stripe's pricing card grid has cards with a slight parallelogram tilt:

```css
.stripe-pricing-card {
  transform: skewY(-2deg);
}

.stripe-pricing-card > * {
  transform: skewY(2deg);  /* unskew content */
}
```

**Why:** the tilt signals "leaning forward" — motion implied by static geometry. Subtle (2°), but visible.

**For DeesseJS:** probably skip — the parallelogram tilt conflicts with the "mono hairline" aesthetic. But the principle (geometry implies motion) is worth keeping.

## Section composition

- Container: `max-w-[1200px]`
- Section padding: `py-20` to `py-32` depending on density
- Section transitions: hairline dividers + alternating backgrounds (`bg-white` → `bg-gray-50`)
- Card grid: 3-column desktop, 1-column mobile

## The "stat" pattern (Stripe social proof)

Stripe's home features large, mono-font stats:

```
135+        $1.9T         99.999%      200M+
currencies  processed     uptime       active subs
```

**CSS:**
```css
.stat {
  font-family: var(--font-mono);
  font-size: 72px;
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--muted-foreground);
  margin-top: 8px;
}
```

**Pattern:** large mono number (no comma in body — use thin spaces if needed for big numbers like `1 000 000+`), small sans label below.

**For DeesseJS:** add this to `/about` (e.g. "12 000+ developers using the template" or "47 teams shipped this quarter") and to `/pricing` ("37 of 50 founder slots claimed").

## Mono SVG illustrations

Stripe uses simple, monochrome SVG illustrations:
- 1.5px stroke (same as our spec)
- `currentColor` for stroke
- Geometric primitives (circles, rectangles, paths)
- No gradients inside the SVG
- Animations: rotate, scale, fade — never translate the whole illustration

**For DeesseJS:** already aligned with [[reference-svg-illustration-system]]. Stripe confirms the spec.

## Color usage

Stripe uses TWO accents (one warm, one cool):
- Indigo (`oklch(0.55 0.2 270)`) for primary
- Orange (`oklch(0.65 0.18 50)`) for secondary
- Both used in the gradient text + a single accent button

**For DeesseJS:** mono brand means single accent (foreground on muted backgrounds). Don't introduce a second color.

## Motion

- Hover: 150ms transitions
- Card flip on hover (3D `rotateY(5deg)`): subtle, used only on hero stats
- Mesh gradient: NO animation (Stripe's mesh is static — Supabase's animates)
- Scroll: NO scroll-driven animations

## What Stripe does NOT do

- No scroll-jacking
- No parallax
- No autoplay video
- No cursor-tracked glows (Stripe is more "Vercel" than "Supabase" on this dimension)

## Source URLs

- https://stripe.com — current home
- https://stripe.com/pricing — pricing page
- https://designcompass.org/en/archive/stripe-2026/ — Stripe 2026 brand refresh analysis
- https://www.shadcn.io/design/stripe — shadcn Stripe design system (Indigo #533afd, Sohne, 21 components)

## Related memories

- [[reference-vercel-home-css]] — Stripe is the "warm gradient" cousin to Vercel's "cool mono"
- [[reference-supabase-home-css]] — Supabase's mesh is bolder; Stripe's is subtler
- [[reference-svg-illustration-system]] — Stripe confirms our mono SVG spec

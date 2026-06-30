---
name: reference-supabase-home-css
description: Concrete CSS techniques from Supabase.com — mesh gradient hero (multi-radial, OKLCH, blur layer), cursor-tracked radial glow, product-graph SVG with hover-active outline; brand-allowed chromatic accents
metadata:
  type: reference
---

# Supabase home — CSS technique inventory

Verified 2026-06-26 from `https://supabase.com` + `https://github.com/supabase/supabase/blob/a5f4a59e/apps/www/components/Hero/Hero.tsx` + `https://github.com/supabase/supabase/blob/a5f4a59e/apps/www/components/Products/VectorVisual.tsx` + https://www.pravinkumar.co/blog/mesh-gradients-hero-sections-webflow-2026-design-trend (June 2026).

## Mesh gradient hero (the Supabase signature)

**The technique:** 2–3 layered CSS `radial-gradient`s on a `position: absolute; inset: 0` div, each blurred, composited via stacking context. Total payload < 1KB.

```css
.mesh-hero {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background:
    radial-gradient(at 20% 30%, oklch(0.7 0.18 145 / 0.5), transparent 50%),
    radial-gradient(at 80% 70%, oklch(0.6 0.2 250 / 0.4), transparent 60%),
    radial-gradient(at 50% 50%, oklch(0.85 0.12 60 / 0.3), transparent 70%),
    oklch(0.99 0 0);
}
```

**Rules (Pravin Kumar's June 2026 deep-dive, confirmed):**
- Use **OKLCH** interpolation (Chrome 138, February 2026, default on). sRGB gradients muddy at mid-tones.
- 3 colors max: one warm, one cool, one neutral mid.
- Saturation moderate — if you can't read white text at 32px over it, the gradient is wrong.
- `mix-blend-mode: plus-lighter` between layers so overlapping colors add (gives the painterly 3D look).
- Animation: 30s loop on `background-position` only. NEVER canvas, NEVER JS animation on a marketing site.
- Always wrap in `@media (prefers-reduced-motion: reduce) { animation: none }`.

**Browser support:** OKLCH gradient interpolation requires Chrome 138+ (Feb 2026). Fallback to sRGB gradients for older browsers (mid-tones will muddy — that's acceptable degradation).

## Cursor-tracked radial glow (VectorVisual.tsx)

The hero pattern: a static SVG sits in the hero, and on `mousemove` a `<radialGradient>`'s center is set to the cursor position. The outline of the active element glows softly.

```tsx
const [gradientPos, setGradientPos] = useState({ x: 0, y: 0 })

const handleGlow = (event) => {
  const rect = ref.current.getBoundingClientRect()
  setGradientPos({ x: event.clientX - rect.x, y: event.clientY - rect.y })
}

return (
  <svg viewBox="0 0 390 430" className="absolute inset-0">
    <path d="..." stroke="url(#activeGradient)" strokeWidth={2} />
    <defs>
      <radialGradient
        id="activeGradient"
        cx="0" cy="0" r="2"
        gradientUnits="userSpaceOnUse"
        gradientTransform={`translate(${x} ${y}) rotate(56) scale(132)`}
      >
        <stop stopColor="hsl(var(--brand-default))" />
        <stop offset="1" stopColor="hsl(var(--brand-default))" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
)
```

**Pattern:**
- Listen to `mousemove` on the SVG's container.
- Throttle to `requestAnimationFrame` (Supabase uses raw `mousemove` — fine because they early-return when cursor is outside).
- The `radialGradient` follows the cursor; the **static SVG** stays in place. The glow appears to "follow your finger."
- Default opacity 0, opacity 1 on `group-hover` of the parent. This is a hover affordance, not autoplay.

## Section composition

- Container: `max-w-[1400px]`, section padding `py-16` (tighter than Vercel's 96–128px — Supabase has more visual density per page).
- Section backgrounds alternate: `bg-background` → `bg-surface-75` → `bg-background` (Supabase uses three surface tones, not two).
- Cards: 16px radius (vs Vercel's 12px), heavier padding (`p-8` on hero cards).

## Color usage (Supabase is the chromatic exception)

| Where | Color |
|---|---|
| Primary brand | `oklch(0.65 0.18 145)` — Supabase green |
| Background | `oklch(1 0 0)` / `oklch(0.16 0 0)` |
| Surface 75 | `oklch(0.97 0 0)` / `oklch(0.2 0 0)` |
| Surface 100 | `oklch(0.95 0 0)` / `oklch(0.24 0 0)` |
| Text primary | `oklch(0.18 0 0)` / `oklch(0.96 0 0)` |

**Critical:** Supabase's green is reserved for **brand CTAs, badges, and the "active" cursor glow**. It does NOT appear on icons, checkmarks, or accent text. The rule is the same as Vercel's: color encodes state, never decorates.

**For DeesseJS (mono brand):** replace the green with `currentColor` and use opacity for the same "active vs idle" effect. Don't add color.

## Interactive dashboard hero (Supabase Realtime, May 2026)

The PR `supabase/supabase#46474` shipped a **fully interactive demo** as the hero of `/realtime`. Key techniques (from CodeRabbit walkthrough):

| Technique | Implementation |
|---|---|
| Real React table | `react-data-grid@7.0.0-beta.47` rendered as a read-only users table |
| Live cursor positions | `cursorStore.ts` (in-memory subscription store) + `RealtimeCursorLayer` with `transform: translate3d(...)` |
| Cell focus indicator | `DemoGridCell` renders a colored badge at the focused cell's edge |
| Animated bot users | `useAugmentedUsers` cycles bot state (offline → idle → moving → focusing) with Bezier interpolation |
| 3D composition | The whole hero has `perspective: 1200px; transform: rotateX(8deg)` for a tilted-on-the-table look |
| Dot-grid background | `IllustrationFrame` provides a dot-grid behind each illustration (`background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 16px 16px`) |
| Inline SVG URIs | Checkbox icons in `studio-grid.css` use `background-image: url("data:image/svg+xml,...")` (no extra HTTP request) |

**Pattern (replicable for DeesseJS):**
1. A `<div>` with `perspective: 1200px` wraps the mock dashboard.
2. Inside, a `<div>` with `transform: rotateX(8deg) rotateY(-4deg)` for the tilt.
3. Use shadcn `Table` primitive for the read-only data display.
4. For "live cursor" effect: 3–5 absolute-positioned `<div>`s with `transition: transform 1.2s cubic-bezier(...)` that move between random cells on a `setInterval`.

## What Supabase does NOT do

- No `text-shadow` glow on headlines
- No drop shadows on cards (their cards are flat with 1px borders)
- No emoji in production UI (the broadcast "reactions" are illustrations, not emoji)
- No autoplay loops on the mesh gradient (only `mousemove` glow)

## Source URLs

- https://supabase.com — current home
- https://github.com/supabase/supabase/blob/a5f4a59e/apps/www/components/Products/VectorVisual.tsx — the cursor-glow source
- https://github.com/supabase/supabase/pull/46474 — Realtime marketing page redesign (May 2026)
- https://www.pravinkumar.co/blog/mesh-gradients-hero-sections-webflow-2026-design-trend — mesh gradient technique deep-dive
- https://web.dev/articles/css-masking — for masking techniques used on the dot-grid illustrations

## Related memories

- [[reference-vercel-home-css]] — Vercel does the opposite (no mesh gradient, no cursor glow)
- [[reference-svg-illustration-system]] — DeesseJS bespoke illustrations vs Supabase's
- [[feedback-deessejs-mono-design-language]] — for the rule that DeesseJS uses NO chromatic accents

---
name: reference-hero-techniques-2026
description: Master CSS technique catalog distilled from Vercel/Supabase/Linear/Stripe/Resend/Anthropic (June 2026); 12 reusable recipes with concrete CSS, browser support, dark-mode notes, and DeesseJS-token mappings
metadata:
  type: reference
---

# Hero techniques catalog — 2026

Master reference for CSS hero/section techniques used by the best developer-AI marketing sites in June 2026. Each recipe is concrete, copy-pastable, and includes DeesseJS-token mappings. **Read this first** when asked to redesign any hero or section.

## The 12 recipes

### 1. Print-mark grid (Vercel signature)

Two layered gradients, hairline lines, 10–15% opacity. The grid IS the illustration.

```css
.bg-grid {
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

```tsx
// DeesseJS variant — uses foreground at 5% alpha
<div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:24px_24px] text-foreground/5 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none" />
```

**When to use:** mono brand, want texture without decoration.
**When NOT:** chromatic brand (Supabase/Stripe) — use mesh instead.
**DeesseJS fit:** ⭐⭐⭐⭐⭐ perfect — matches mono aesthetic.

### 2. Dot matrix (Linear signature + Supabase illustrations)

```css
.bg-dots {
  background-image: radial-gradient(circle, var(--dot) 1px, transparent 1px);
  background-size: 16px 16px;
}
```

```tsx
// DeesseJS variant
<div className="bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-[size:16px_16px] text-foreground/[0.08] pointer-events-none" />
```

**When to use:** section accents, illustration frames, empty states.
**DeesseJS fit:** ⭐⭐⭐⭐⭐ perfect.

### 3. Crosshair print-marks (Vercel grid intersections)

```tsx
// Approach 1: SVG overlay (more control)
// <svg><path d="M0 8h16M8 0v16" stroke="currentColor" opacity={0.15}/></svg>

// Approach 2: gradient dots at intersection frequency (cheaper)
.bg-crosshair {
  background-image: radial-gradient(circle, currentColor 0.5px, transparent 1px);
  background-size: 96px 96px;  /* 4× the grid spacing */
  opacity: 0.2;
}
```

**When to use:** grid backgrounds, want to signal "precision."
**DeesseJS fit:** ⭐⭐⭐⭐ good.

### 4. Mesh gradient hero (Supabase signature)

3 layered `radial-gradient`s on `position: absolute; inset: 0`, OKLCH interpolation, single blur layer.

```css
.mesh-hero {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background:
    radial-gradient(at 20% 30%, oklch(0.7 0.18 H1 / 0.5), transparent 50%),
    radial-gradient(at 80% 70%, oklch(0.6 0.2 H2 / 0.4), transparent 60%),
    radial-gradient(at 50% 50%, oklch(0.85 0.12 H3 / 0.3), transparent 70%);
  filter: blur(60px);
}

/* Optional: animate slowly via background-position */
@keyframes mesh-drift {
  0%, 100% { background-position: 0% 0%, 100% 100%, 50% 50%; }
  50% { background-position: 5% 10%, 95% 90%, 50% 50%; }
}

.mesh-animated {
  animation: mesh-drift 30s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .mesh-animated { animation: none; }
}
```

**Rules (Pravin Kumar June 2026):**
- 3 colors max: warm + cool + neutral mid
- Moderate saturation
- `mix-blend-mode: plus-lighter` between layers (optional, gives painterly 3D)
- 30s loop, NEVER canvas/JS animation
- Browser support: OKLCH interpolation Chrome 138+ (Feb 2026); sRGB fallback for older browsers

**DeesseJS variant (mono mesh):**
```tsx
<div className="absolute inset-0 -z-10 overflow-hidden opacity-30">
  <div className="absolute inset-0 blur-3xl"
    style={{
      background: [
        'radial-gradient(at 20% 30%, oklch(0.7 0 0 / 0.4), transparent 50%)',
        'radial-gradient(at 80% 70%, oklch(0.5 0 0 / 0.3), transparent 60%)',
      ].join(','),
    }} />
</div>
```

**When to use:** if you want to add warmth to a section. **Skip for mono brand** — the technique reads as chromatic even when desaturated.
**DeesseJS fit:** ⭐⭐ borderline — use only behind the "Get started" CTA on `/pricing`.

### 5. Cursor-tracked radial glow (Supabase VectorVisual pattern)

```tsx
'use client'
import { useState, useRef, useEffect } from 'react'

export function CursorGlowSvg() {
  const ref = useRef<SVGSVGElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      setPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <svg ref={ref} viewBox="0 0 390 430" className="opacity-0 group-hover:opacity-100 transition-opacity">
      <path d="..." stroke="url(#active)" strokeWidth={2} />
      <defs>
        <radialGradient
          id="active"
          cx="0" cy="0" r="2"
          gradientUnits="userSpaceOnUse"
          gradientTransform={`translate(${pos.x} ${pos.y}) rotate(56) scale(132)`}
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  )
}
```

**Rules:**
- `'use client'` required (interactive).
- `opacity-0 group-hover:opacity-100` — the glow is a hover affordance, not autoplay.
- The static SVG sits underneath; the radial gradient moves on top.
- Throttle with `requestAnimationFrame` if you have multiple instances.

**DeesseJS fit:** ⭐⭐⭐ good for the about page hero or pricing "compare" hero.

### 6. Gradient text headline (Stripe signature)

```css
.gradient-text {
  background: linear-gradient(
    90deg,
    oklch(0.55 0.2 30),
    oklch(0.65 0.2 60),
    oklch(0.55 0.2 250)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Dark mode: invert lightness */
@media (prefers-color-scheme: dark) {
  .gradient-text {
    background: linear-gradient(
      90deg,
      oklch(0.75 0.2 30),
      oklch(0.85 0.2 60),
      oklch(0.75 0.2 250)
    );
    -webkit-background-clip: text;
    background-clip: text;
  }
}
```

**DeesseJS variant (mono tonal):**
```tsx
<h1 className="bg-gradient-to-r from-foreground/80 via-foreground to-foreground/80 bg-clip-text text-transparent">
  Build agents on infrastructure that thinks like them.
</h1>
```

**DeesseJS fit:** ⭐⭐⭐⭐ great — the mono variant is restrained and adds polish.

### 7. The "FIG" section label (Linear signature)

```tsx
<div className="flex items-center gap-3 mb-4">
  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
    FIG 0.{n}
  </span>
  <div className="h-px flex-1 bg-border/40" />
</div>
```

**When to use:** documentation/research vibe. Works for `/about` and `/pricing`.
**DeesseJS fit:** ⭐⭐⭐⭐⭐ perfect for `/about` Principles + `/pricing` sections.

### 8. Interactive dashboard mockup (Linear + Supabase signature)

```tsx
<div className="[perspective:1200px]">
  <div className="rounded-xl border bg-background shadow-sm [transform:rotateX(8deg)_rotateY(-4deg)]">
    {/* shadcn Table or custom mock UI */}
    <Table>...</Table>
  </div>
</div>
```

**For "live cursor" effect:**
```tsx
{/* 3-5 absolutely positioned dots that animate between cells */}
<div className="absolute h-2 w-2 rounded-full bg-foreground transition-transform duration-1000"
  style={{ transform: `translate(${x}px, ${y}px)` }} />
```

**DeesseJS fit:** ⭐⭐⭐⭐⭐ perfect for `/pricing` hero — render the template's auth/billing UI as the hero.

### 9. "Tools" vertical list (Resend signature)

```tsx
<div className="divide-y divide-border/40 border-y border-border/40">
  {tools.map((tool) => (
    <div key={tool.name} className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <tool.icon className="size-5 text-foreground" />
        <div>
          <div className="font-medium text-foreground">{tool.name}</div>
          <div className="text-sm text-muted-foreground">{tool.description}</div>
        </div>
      </div>
      <Button variant="ghost" size="sm">{tool.cta} →</Button>
    </div>
  ))}
</div>
```

**DeesseJS fit:** ⭐⭐⭐⭐⭐ perfect for `/about` "agents can call" section + `/pricing` "what's included" section.

### 10. Stat grid (Stripe signature)

```tsx
<div className="grid grid-cols-2 gap-12 lg:grid-cols-4">
  {stats.map((stat) => (
    <div key={stat.label}>
      <div className="font-mono text-5xl font-medium tracking-tighter text-foreground lg:text-6xl">
        {stat.value}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
    </div>
  ))}
</div>
```

**Rules:** mono font, large number, thin-space separators for big numbers (`12 000+`, not `12,000+`), small sans label below.

**DeesseJS fit:** ⭐⭐⭐⭐ perfect for `/about` social proof.

### 11. Hairline-bordered feature table (Linear signature)

```tsx
<div className="divide-y divide-border/40 border-y border-border/40">
  {/* Header row */}
  <div className="grid grid-cols-[1fr_repeat(3,max-content)] gap-0">
    <div className="p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Feature</div>
    {tiers.map((t) => (
      <div key={t.name} className="p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground text-center">{t.name}</div>
    ))}
  </div>
  {/* Data rows */}
  {rows.map((row) => (
    <div key={row.label} className="grid grid-cols-[1fr_repeat(3,max-content)] gap-0">
      <div className="p-4 text-sm text-foreground">{row.label}</div>
      {row.values.map((v, i) => (
        <div key={i} className="p-4 text-center text-sm text-foreground">{v}</div>
      ))}
    </div>
  ))}
</div>
```

**Rules:**
- NO row backgrounds, only dividers
- Padding is per-cell, not per-row
- First row is the header (mono, uppercase, muted)
- Sticky first column + first row for long tables

**DeesseJS fit:** ⭐⭐⭐⭐⭐ perfect for `/pricing` feature matrix (already implemented; align this pattern with the existing Table primitive).

### 12. The "warm cream" palette (Anthropic exception)

If you ever want to break the mono rule, this is the only palette I'd recommend:

```css
:root {
  --background: #FAF9F5;  /* warm ivory */
  --foreground: #141413;  /* charcoal */
  --accent: #D97757;       /* burnt orange — single accent */
  --surface: #E8DCCB;      /* clay */
}
```

**Rules:** cream + charcoal + ONE accent. Two accents breaks the spell.
**DeesseJS fit:** ⭐⭐⭐ fit possible but risky — current mono brand is strong. Defer to a future rebrand.

## The decision matrix

When the user asks for "X-style" hero:

| User says | Use recipe | Source memory |
|---|---|---|
| "Vercel-style" / "grid" | #1 + #3 (grid + crosshairs) | [[reference-vercel-home-css]] |
| "Linear-style" / "feature table" | #11 (hairline table) | [[reference-linear-home-css]] |
| "Supabase-style" / "warm gradient" | #4 (mesh) + #5 (cursor glow) | [[reference-supabase-home-css]] |
| "Stripe-style" / "gradient text" | #6 (gradient text) + #10 (stats) | [[reference-stripe-home-css]] |
| "Anthropic-style" / "warm editorial" | #12 (palette) + serif headlines | [[reference-anthropic-home-css]] |
| "Resend-style" / "tools list" | #9 (tools list) + code blocks | [[reference-resend-home-css]] |
| "interactive dashboard" / "show what you ship" | #8 (dashboard mockup) | [[reference-linear-home-css]] + [[reference-supabase-home-css]] |
| "show agent flow" / "agent calling API" | Resend-style code + arrow + output | [[reference-resend-home-css]] |

## Browser support notes (June 2026)

| Feature | Chrome | Firefox | Safari |
|---|---|---|---|
| `oklch()` color | 111+ | 113+ | 15.4+ |
| OKLCH gradient interpolation | 138+ (Feb 2026) | tbd | tbd |
| `background-clip: text` | all | all | 14+ (`-webkit-` prefix required) |
| CSS scroll-driven animations | 115+ | tbd | tbd |
| `mix-blend-mode: plus-lighter` | all | all | all |
| `mask-image: radial-gradient(...)` | all | all | all |
| `perspective` + `rotateX/Y` 3D transforms | all | all | all |

## Dark-mode rules

1. **Never invert hue** — only invert lightness. Mid-tones become highlights, highlights become shadows.
2. **Reduce saturation by 20–30%** in dark mode (chroma reads as harsh on dark backgrounds).
3. **Test every gradient at `prefers-color-scheme: dark`** — OKLCH interpolation can produce surprising mid-tones in dark.
4. **Grid lines:** flip opacity from `text-foreground/5` (light) to `text-foreground/10` (dark) — dark backgrounds need more contrast to show the same texture.
5. **Mesh gradients:** in dark mode, use `oklch(0.4–0.5 L ...)` for the stops (not `oklch(0.7+ L ...)` like in light mode).

## The "feature → component" decomposition method (learned from partner's flowline work)

When a user says "show that there's an admin dashboard," the work is:

1. **Decompose the surface into atoms** (what does "admin dashboard" actually contain?)
   - Header (search, nav, user menu)
   - Sidebar (sections: Users / Billing / Settings / Logs)
   - Main canvas (data table with rows, status badges, actions)
   - Context panels (recent activity, stats cards)
2. **Pick a layout primitive** for each atom (sticky header, vertical nav, sticky table, bento grid)
3. **Choose the visual technique** from this catalog (#8 dashboard mockup is the default)
4. **Compose** with 2D CSS — perspective tilt + grid background + mono palette
5. **Animate subtly** — cursors move, badges pulse, status changes transition

This is a learned method, not innate. The [[reference-flowline-decomposition]] memory will document the partner's actual components so I can mirror the decomposition patterns.

## How to apply

When asked to redesign a hero/section:
1. Look at the user's request. Map keywords to recipes via the decision matrix.
2. Read the per-site memory ([[reference-vercel-home-css]] etc.) for the source-of-truth technique + URL.
3. Pick ONE primary recipe + ONE secondary. Don't combine 4+ — visual noise.
4. Apply the DeesseJS-token mapping (always mono-friendly unless explicitly told otherwise).
5. Verify dark mode renders correctly.
6. Verify the section's content density — if the section has 3+ headings, reduce the visual technique to ONE element only (just the grid, no mesh, no glow).

## Related memories

- [[feedback-deessejs-mono-design-language]] — the mono rules every DeesseJS recipe must respect
- [[reference-svg-illustration-system]] — for hand-drawn SVG illustrations alongside CSS techniques
- [[reference-flowline-decomposition]] — partner's actual decomposition patterns from the flowline project
- [[project-monorepo-strategy]] — for where the new CSS lives (Tailwind v4 + `packages/ui`)

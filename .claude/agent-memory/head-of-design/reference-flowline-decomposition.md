---
name: reference-flowline-decomposition
description: Sophie Wodey's flowline (github.com/deyzzz17/flowline) — the canonical reference for "user need → component decomposition" when building dashboard/flow/admin marketing visuals. AppShell + Content variant split; Reusable primitives (SectionLabel, Reveal, Orb, TimerRing); pillars array data-driven iteration
metadata:
  type: reference
---

# Flowline — component decomposition reference

Sophie Wodey's `flowline` project (`https://github.com/deyzzz17/flowline`) is the canonical reference for how to decompose "show me X" into a beautiful, shippable component. Built with Next.js + Tailwind + shadcn/ui by a designer working with Claude — it shows the kind of work the user wants me to be able to produce for DeesseJS.

This memory captures the **structural patterns** Sophie uses, not just the surface design. Read this when the user asks for a "dashboard mockup", "admin view", "flow diagram", or "show what you ship" visual.

## The mental model: Shell + Content variant

Every "show the product" visual in flowline is split into two files:

- **`<AppShell>`** — the persistent UI chrome (header, sidebar, mobile nav). One file. Doesn't change per variant.
- **`<XxxContent>`** — what's INSIDE the shell. One file per "view" of the product.

```
app-shell.tsx              ← chrome (logo, sidebar, mobile nav, header actions)
dashboard-content.tsx      ← "What does the dashboard look like?"
task-content.tsx           ← "What does the tasks view look like?"
calendar-content.tsx       ← "What does the calendar view look like?"
habits-content.tsx         ← "What does the habits view look like?"
timer-content.tsx          ← "What does the timer/analytics view look like?"
```

**Why this split matters:**
1. The shell stays stable across 5 content variants — you iterate on copy/layout in one file, the chrome stays still.
2. Each content variant is **independently swappable** in any section that uses `<AppShell>`. The `pillars-section.tsx` iterates 4 pillars with the same shell + 4 different content files.
3. The active nav item becomes a **prop** on the shell (`<AppShell active="home">`), not a state inside the shell. The shell doesn't know which content it's hosting.

**DeesseJS application:** the "show that there's an admin dashboard" ask maps directly to this. Build a `<TemplateShell>` (sidebar + topbar + main canvas) and 4-5 `<XxxContent>` variants for auth/billing/jobs/storage/analytics. Reuse them across `/pricing`, `/about`, and any future template preview.

## The primitive extraction pattern

Sophie extracts reusable atoms into single-purpose files BEFORE she uses them twice. Five primitives in flowline, each used 3-10× across the site:

| Primitive | Purpose | Used in |
|---|---|---|
| `section-label.tsx` (3 lines) | Small uppercase tracking-widest accent label | 9+ sections (hero, demo, pillars, problem, onboarding, testimonials, roadmap, footer, etc.) |
| `reveal.tsx` (24 lines) | IntersectionObserver fade-up with `delay` prop | All section headers + content blocks |
| `orb.tsx` (6 lines) | Absolutely-positioned blurred div with `animate-pulse` | Hero glow, final CTA glow |
| `timer-ring.tsx` (35 lines) | SVG ring with progress, size, stroke, gradient, label props | Dashboard, timer content |
| `app-shell.tsx` (90 lines) | Reusable chrome with `active` prop | Hero + 4 pillar sections |

**Rule of thumb Sophie follows:** when the same className string (or close variant) appears 3+ times, extract it into a primitive file. SectionLabel is 3 lines but reused 9× — that's the highest leverage primitive in the codebase.

**DeesseJS application:** when building the dashboard mockup, extract `<StatCard>`, `<SectionLabel>`, `<Reveal>` (or use the existing shadcn `Accordion`), `<Glow>` (Sophie's Orb), and `<ProgressRing>` as primitives BEFORE composing the section.

## The data-driven pillar pattern

The pillars section uses **one array + one map** to render 4 different features:

```tsx
const pillars = [
  {
    nav: 'lists' as const,
    icon: ClipboardList,
    name: 'Tasks',
    title: 'See exactly where your time went.',
    description: 'Link a focus timer to any task once...',
    color: 'text-violet-600 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-500/15',
    Content: TasksContent,  // ← component reference, not string
  },
  // ... 3 more
]

{pillars.map((p, i) => {
  const reversed = i % 2 === 1   // ← alternating layout
  return (
    <Reveal key={p.name}>
      <div className={`grid lg:grid-cols-2 lg:gap-16 ${reversed ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div>...icon + name + title + description...</div>
        <AppShell active={p.nav}>
          <p.Content />   {/* ← composed into the shell */}
        </AppShell>
      </div>
    </Reveal>
  )
})}
```

**Why this works:**
- Adding a 5th pillar is one object in the array — no JSX change
- Alternating layout (image-left, image-right, image-left, ...) is `i % 2 === 1`
- Color/icon/content are all data, not JSX
- The pattern reads "describe the pillar once, render it 1+ times"

**DeesseJS application:** the 6 principles on `/about` should follow this pattern (currently hardcoded as `principles.map`). The 3-tier pricing grid is already data-driven (good). The 4 stats on `/about` should be data-driven.

## The "5-element rhythm" inside each content variant

Each `*-content.tsx` follows a consistent internal hierarchy:

```
1. Section label (small uppercase, accent color)
2. Headline (1 line, the "name" of this view)
3. Stat tiles (2x2 or 1x4 grid)
4. Featured/priority item (single highlighted block)
5. Insight/list section (bullet list with color dots)
```

This is true for:
- `dashboard-content.tsx`: label → "Good morning, Sophie" → 2×2 stat grid → top priority banner → 3 mini-stats → insights list
- `timer-content.tsx`: label → "Where your time goes" → 2x2 stat grid → time-by-category chart → donut + legend
- `habits-content.tsx`: label → "Habit insights" → 2x2 stat grid → heatmap → goals claimed → per-habit list
- `calendar-content.tsx`: label → date range + new event button → 7-day grid → footer hint

**Pattern:** "name → quantity → highlight → drilldown." Every variant answers the same 4 questions in the same order.

**DeesseJS application:** when building a content variant for `/pricing` "what's in the template" or `/about` "principles", follow this 5-element rhythm: label → headline → grid → highlight → list. Don't skip steps.

## Color-coded section labels

Each `*-content` variant has its own accent color, used ONLY for the section label + the matching stat-icon badge:

| Content | Color | OKLCH approx |
|---|---|---|
| Tasks | violet | `oklch(0.55 0.2 290)` |
| Calendar | blue | `oklch(0.55 0.2 250)` |
| Habits | orange | `oklch(0.65 0.2 50)` |
| Timer/Focus | pink | `oklch(0.6 0.2 350)` |
| Dashboard | violet (primary) | `oklch(0.55 0.2 290)` |

The colors do NOT appear on:
- Borders (always `border-slate-100 dark:border-white/6`)
- Headlines (always `text-slate-900 dark:text-white`)
- Body text (always `text-slate-500 dark:text-white/50`)
- Buttons (always `bg-violet-600` brand)

**Rule:** color is a section-marker, not a global brand. The brand color stays monochrome-ish (violet) for primary actions; secondary colors are functional (blue = time, orange = streak, pink = focus).

**DeesseJS application:** DeesseJS is monochrome by intent, so this would translate to "section labels in different OPACITIES of foreground" rather than different hues. `text-foreground/90` for primary, `text-foreground/70` for secondary, etc. Each variant still has its own accent but the accent is luminance, not chroma.

## The Orb / Glow primitive

```tsx
export const Orb = ({ className }: { className?: string }) => (
  <div
    className={`absolute rounded-full blur-3xl pointer-events-none
      opacity-10 dark:opacity-20 animate-pulse ${className}`}
  />
)
```

Used in:
- Hero: `<div className="... -inset-x-16 -top-12 h-40 rounded-full bg-violet-500/15 blur-3xl" />`
- Final CTA: `<div className="... -top-32 left-1/2 h-64 w-64 ... bg-violet-400 blur-3xl opacity-20" />`

**Pattern:** a colored absolutely-positioned div, blurred, semi-transparent, sometimes pulsing. The hero gets ONE orb behind the app shell. The final CTA gets ONE orb behind the button. No section gets more than 1 orb.

**DeesseJS application:** this is exactly the "subtle mesh accent" from [[reference-stripe-home-css]] recipe #4. Use it sparingly — 1 per page max, behind a single important element.

## The Stat Card primitive (reusable)

Both `habits-content` and `timer-content` and `dashboard-content` use the same stat card:

```tsx
<div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 dark:border-white/6 dark:bg-white/[0.02]">
  <span className={`mb-1.5 flex h-5 w-5 items-center justify-center rounded-full ${bg} ${color}`}>
    <s.icon className="h-2.5 w-2.5" />
  </span>
  <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
  <p className="text-[7px] uppercase tracking-wide text-slate-400 dark:text-white/25">{label}</p>
</div>
```

Used 9+ times across the 3 content variants.

**DeesseJS application:** extract this as `<StatCard icon label value accentColor />` in `packages/ui` or `apps/web/src/components/marketing/`. It's a DeesseJS-shaped primitive — exactly what the user wants to see on `/about` ("12 000+ developers using the template" etc.) and `/pricing` ("37 of 50 founder slots claimed").

## The Reveal primitive

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'

export const Reveal = ({ children, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(ref.current!)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out
        motion-reduce:transition-none motion-reduce:transform-none
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
      `}
    >
      {children}
    </div>
  )
}
```

**Pattern:**
- IntersectionObserver fires once (then `disconnect()`)
- `threshold: 0.15` — fires when 15% of element is visible
- `delay` prop cascades through sections (SectionLabel = 0, headline = 50ms, body = 100ms)
- Respects `prefers-reduced-motion` via `motion-reduce:transition-none`

**DeesseJS application:** DeesseJS doesn't have this primitive. **Add it.** It's the most reused component in flowline and it would lift the entire site visually for ~30 lines of code.

## The honest placeholder pattern

Sophie's testimonials section has this comment:

```tsx
{/*
  TODO: replace these two placeholder cards with real beta tester quotes before launch.
  Keeping them as obvious placeholders (dashed border, muted text) rather than inventing
  fake names/quotes — presenting fabricated reviews as genuine is misleading and, in many
  places, against consumer protection rules.
*/}
```

The placeholder cards use:
- `border-dashed border-slate-200` (dashed border, not solid)
- `bg-slate-50/60` (very faint background)
- Centered text "Your next testimonial here"
- A role placeholder "— Name, role"

**Pattern:** when shipping a real product, mark unfinished sections VISUALLY as unfinished. Don't fake them. This applies to:
- Empty screenshots (dashed border + "Screenshot coming soon" label)
- Real-but-mock data (clearly labeled "Example" or "Demo")
- Author bios without photos (initial in a colored circle)

**DeesseJS application:** adopt this for any "social proof" or "customer story" sections that need content. Show the placeholder clearly, don't fake it.

## What I'd steal vs what I'd change for DeesseJS

**Steal:**
- Shell + Content variant split (build `<TemplateShell>` + 5 `<XxxContent>` variants)
- Stat card primitive (extract from 9+ uses)
- Reveal primitive (IntersectionObserver fade-up)
- Section label primitive (3 lines, used 9+ times)
- Data-driven pillars (one array + one map for the 6 about-page principles)
- 5-element rhythm inside content variants
- Honest placeholder pattern

**Change for DeesseJS:**
- Color → luminance variation (mono brand)
- Violet primary → `text-foreground` + opacity tiers
- Dark mode handling: DeesseJS uses semantic tokens (`bg-background`, `text-foreground`), not raw `slate-900` / `white` — adapt the OKLCH values to our existing tokens
- Drop the bg-linear-to-br gradient backgrounds (mono brand reads as too "marketing")
- The `Orb` glow → use more sparingly, only on the final CTA + hero (Sophie's approach, but rarer)

## Source URLs

- https://github.com/deyzzz17/flowline — repo root (Sophie Wodey)
- https://flowlineworkspace.com — live site
- Key files studied:
  - `src/components/home/app-shell.tsx` (90 lines)
  - `src/components/home/dashboard-content.tsx` (the most complete content variant)
  - `src/components/home/{task,calendar,habits,timer}-content.tsx` (variant set)
  - `src/components/home/pillars-section.tsx` (the data-driven iteration)
  - `src/components/home/{section-label,reveal,orb,timer-ring}.tsx` (primitives)
  - `src/components/home/{problem,onboarding,testimonials,final-cta,hero}-section.tsx` (marketing page anatomy)

## Related memories

- [[reference-hero-techniques-2026]] — the CSS catalog that backs every component here
- [[feedback-deessejs-mono-design-language]] — the mono rules every primitive must respect
- [[feedback-base-ui-tooltip-aschild]] — the gotcha when building interactive primitives
- [[project-monorepo-strategy]] — for where these primitives live (packages/ui vs apps/web/src/components)
- [[reference-capability-pillar-pattern]] — the pillar pattern as adopted for DeesseJS (DeesseJS-specific tweaks on top of Sophie's pattern)
- [[project-home-features-redesign-2026-06-29]] — the DeesseJS implementation that shipped 4 pillars + bento using Sophie's architecture

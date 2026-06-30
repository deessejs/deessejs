---
name: reference-decomposition-method
description: The 5-step method to decompose a user need ("show admin dashboard") into atoms, layout primitives, visual techniques, and a composable component. Learned from Sophie Wodey's flowline; reusable for any marketing visual ask
metadata:
  type: reference
---

# Decomposition method — user need → shippable component

This is the workflow I should follow when the user asks for any "show X" or "build me Y" visual: a dashboard, a flow, an admin view, a pricing comparison, an empty state, anything where the user describes a feature and wants to see it visualized.

The method comes from reverse-engineering [[reference-flowline-decomposition]] — Sophie Wodey's flowline project, which was built by a designer working iteratively with Claude.

## The 5 steps

### Step 1 — Decompose the user need into atoms

When the user says "show that there's an admin dashboard" or "show that agents can call the API", ask:

- **What surfaces does this product have?** (auth / billing / jobs / storage / notifications / API)
- **What's the main view of each surface?** (list / detail / edit / empty / loading / error)
- **What state changes matter?** (loading → loaded, empty → filled, idle → active)
- **What's the smallest thing that proves it works?** (one user, one task, one log line)

**Output:** a list of 3-7 atoms. For "admin dashboard": sidebar / topbar / data table / stat row / activity feed / empty state. For "agent flow": code block / arrow / API call log / response card.

**Anti-pattern to avoid:** treating the visual as ONE monolithic component. Sophie splits into `<Shell>` + `<XxxContent>` × N variants — the atoms are reusable + individually swappable.

### Step 2 — Pick a layout primitive per atom

Each atom has ONE clear role. The role maps to a layout primitive:

| Atom role | Layout primitive | Tailwind classes (typical) |
|---|---|---|
| Persistent chrome | `<header>` + `<aside>` + `<main>` grid | `grid grid-cols-[auto_1fr]` |
| Data table | Sticky first column + sticky header | `sticky left-0 top-0 z-10 bg-background/95` |
| Stat row | `grid-cols-2 md:grid-cols-4` | `grid gap-3 grid-cols-2 md:grid-cols-4` |
| Activity feed | Vertical list with timeline dots | `space-y-3 border-l border-border pl-6` |
| Empty state | Centered icon + label + CTA | `flex flex-col items-center gap-3 py-16` |
| Form | Label-on-top input rows | `space-y-4` |
| Card grid | Bento grid with size variants | `grid grid-cols-2 md:grid-cols-4 gap-3 [&>*:nth-child(1)]:col-span-2` |
| Side-by-side comparison | 2-column with divider | `grid grid-cols-2 divide-x` |
| Code block | `<pre>` with mono font | `font-mono text-sm bg-muted/30 p-4 rounded-lg overflow-x-auto` |

**Output:** one primitive per atom. Don't reach for novel layouts — pick from this table unless the user explicitly asks for something else.

### Step 3 — Choose ONE primary visual technique

Every section gets ONE primary technique from [[reference-hero-techniques-2026]]. Pick by user keyword:

| User said | Primary technique | Secondary (optional) |
|---|---|---|
| "show dashboard" / "admin view" | #8 interactive dashboard mockup | + #1 grid background |
| "show flow" / "agent flow" / "code → arrow → output" | Resend-style code+arrow+output | — |
| "show tools" / "agents can call" | #9 tools vertical list | — |
| "stats" / "social proof" | #10 stat grid | — |
| "comparison" / "feature matrix" | #11 hairline feature table | — |
| "hero" | #6 gradient text headline | + #1 grid OR #2 dots |
| "feature card" | Card grid + mono borders | — |
| "CTA" / "final" | Button + #10 stats OR #4 subtle mesh | — |

**Output:** exactly ONE primary technique + at most ONE secondary. **Never combine 3+ techniques in one section** — visual noise.

### Step 4 — Compose with a data array, not hardcoded JSX

After picking the atoms + layout + technique, the actual JSX is usually a `.map()` over a data array. **Always data-drive** when there are 3+ similar items.

```tsx
// ❌ Hardcoded — 4 sections of copy-paste
<section>
  <Card><CardTitle>Pillar 1</CardTitle>...</Card>
  <Card><CardTitle>Pillar 2</CardTitle>...</Card>
  <Card><CardTitle>Pillar 3</CardTitle>...</Card>
  <Card><CardTitle>Pillar 4</CardTitle>...</Card>
</section>

// ✅ Data-driven — one source of truth
const pillars = [
  { name: 'Tasks', title: '...', description: '...', icon: ClipboardList, Content: TasksContent },
  { name: 'Calendar', title: '...', description: '...', icon: CalendarDays, Content: CalendarContent },
  // ...
]

<section>
  {pillars.map((p, i) => (
    <Reveal key={p.name}>
      <div className={`grid lg:grid-cols-2 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div>...icon + name + title + description...</div>
        <AppShell active={p.nav}><p.Content /></AppShell>
      </div>
    </Reveal>
  ))}
</section>
```

**Output:** ONE data array + ONE map call. Adding a 5th pillar is one object, not 50 lines of JSX.

### Step 5 — Annotate intent in code

Every component file gets a header comment with:
1. **What user need it satisfies** ("shows the auth surface" / "demonstrates the agent-callable surface")
2. **The decomposition it represents** ("atoms: nav, badge, topbar — composed in `app-shell.tsx`")
3. **Where it's used** ("used in `hero-section.tsx` + `pillars-section.tsx` × 4")

```tsx
/**
 * <DashboardContent> — the main admin view mockup
 *
 * Decomposes "show that the template has a dashboard" into:
 *   1. Section label "Dashboard"
 *   2. Greeting headline
 *   3. 2x2 stat tiles
 *   4. Day-progress ring (right column)
 *   5. Top-priority banner
 *   6. 3 mini-stat tiles
 *   7. AI insights list
 *
 * Used in:
 *   - hero-section.tsx (the main app screenshot)
 *   - (no other usage yet — reuse if a /dashboard preview is needed)
 */
```

**Output:** every file has a 5-10 line header. Future-me (and other agents) can read the file's intent without parsing the JSX.

## The decision checklist

Before declaring "done" on any visual ask, run through this:

- [ ] **Atom split:** did I split into Shell + Content, or did I write one monolithic component?
- [ ] **Layout primitive:** did I pick from the table, or did I invent a novel layout?
- [ ] **ONE technique:** did I pick ONE primary visual technique from [[reference-hero-techniques-2026]]?
- [ ] **Data array:** if 3+ items, did I `.map()` over data, or hardcode JSX?
- [ ] **5-element rhythm:** inside the content, is there label → headline → grid → highlight → list?
- [ ] **Mono rules:** does it respect [[feedback-deessejs-mono-design-language]]? (no emerald, hairline borders, inline badges)
- [ ] **Dark mode:** did I verify it works with `bg-background` + `text-foreground`?
- [ ] **Reduced motion:** does motion respect `motion-reduce:transition-none`?
- [ ] **Header comment:** does the file explain WHAT it shows, WHERE it's used?
- [ ] **Honest placeholder:** if I included mock data, is it OBVIOUSLY mock (dashed border, "Demo data" label)?

If any answer is "no", fix it before declaring done.

## Common failure modes

**1. "I'll just build one component for everything."**
No. The Shell/Content split is what makes the section composable across 5 marketing contexts. One component = one-off. Shell + 5 Contents = reusable system.

**2. "I'll hardcode the 4 pillars as 4 sections."**
No. The data array is 5 lines. The `.map()` is 15 lines. Total: 20 lines vs 80 lines of copy-paste, AND adding a 5th pillar is one object.

**3. "I'll use 3 visual techniques at once."**
No. One primary technique. A subtle secondary is OK (e.g. gradient text headline + grid background). Three competing techniques = visual noise.

**4. "I'll animate it heavily to make it feel alive."**
No. Sophie animates: one orb pulse, one CTA shine, one IntersectionObserver reveal per section. That's it. Motion is restraint.

**5. "I'll fake the data convincingly."**
No. Use honest placeholders with `border-dashed` + "Demo data" label. The user will replace real data when they have it.

**6. "I'll invent a new layout primitive."**
Almost never. The 9 primitives in the table above cover 90% of needs. Inventing new layouts wastes time and creates inconsistency.

## How this method was validated

This method is reverse-engineered from Sophie Wodey's flowline project, which is the cleanest reference I have for "designer + Claude" output quality. It:

- Builds 19 components for a marketing site in ~6 weeks (created 2026-03-11, last push 2026-06-26)
- Uses consistent primitives across 9+ sections
- Demonstrates the Shell/Content split (1 shell + 5 contents)
- Demonstrates the data-driven pillar pattern (4 pillars from 1 array)
- Demonstrates the 5-element rhythm inside each content variant
- Ships with honest placeholders for incomplete sections

If the method works for Sophie to ship 19 production-quality components in 6 weeks, it works for DeesseJS.

## Related memories

- [[reference-flowline-decomposition]] — the source material this method comes from
- [[reference-hero-techniques-2026]] — the CSS recipe catalog (Step 3 inputs)
- [[feedback-deessejs-mono-design-language]] — the brand constraints (Step 5 checkbox)
- [[reference-svg-illustration-system]] — when the atoms include bespoke SVGs

## Companion files

When implementing a dashboard/flow/admin visual for DeesseJS, also save:
1. The decision matrix used (`docs-internal-design-{feature}-decomposition.md`) so future work reuses the atoms
2. The data arrays in `apps/web/src/lib/{feature}/data.ts` (matching the `lib/pricing/*` and `lib/blog/*` pattern)
3. New primitives in `packages/ui/src/components/ui/` if they belong to the design system (StatCard, Reveal, SectionLabel)
4. New component variants in `apps/web/src/components/marketing/{feature}/`

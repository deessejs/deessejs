# Landing Page — Structure & Design Spec

> **Status:** Draft — pending approval
> **Spec reference:** `../../DESIGN.md`
> **Audience:** Developers evaluating an agentic SaaS template

---

## Positioning

**Tagline:** "Your agents ship your SaaS. You ship faster."

**Wedge:** The first SaaS template built around the agentic development paradigm — not just "AI-powered" marketing fluff, but genuine agent-first DX.

**Sub-framing (from `landing-page.md` §5):** "supastarter pattern" — visual monorepo structure + code panels side-by-side. This is the visual proof of the positioning.

---

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR                                                  │
│  Logo · Features · Docs · Pricing · [Sign In] [Get Started]│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HERO                                                     │
│                                                           │
│  "Your agents ship your SaaS. You ship faster."          │
│                                                           │
│  The monorepo template built for agentic development.     │
│  Ships with shadcn, auth, and deploy pre-wired.           │
│                                                           │
│  [Get Started]  [View on GitHub]  [Watch Demo]          │
│                                                           │
│  ┌─────────────────────────────────────────────┐         │
│  │  INTERACTIVE FILETREE + CODE PANEL           │         │
│  │  (supastarter pattern — see §1 below)      │         │
│  └─────────────────────────────────────────────┘         │
│                                                           │
│  "Trusted by X developers · X templates generated"        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SOCIAL PROOF STRIP                                      │
│  "Built with agents from:" · logos strip                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FEATURES (2×3 grid)                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ ⚡ Zero Config│ │ 🔌 Agentic  │ │ 🎨 shadcn   │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ 🔒 Auth      │ │ 🚀 Deploy    │ │ 📊 Observab. │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HOW IT WORKS (3 steps)                                 │
│  ① Clone  ·  ② Configure  ·  ③ Ship                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TERMINAL SHOWCASE (CLI demo)                           │
│  $ deessejs deploy --env production                    │
│  ✓ Agent analyzing... ✓ Building... ✓ Deploying...    │
│  [Copy Command]                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PRICING (3 tiers)                                      │
│  Starter · Pro ★ · Enterprise                          │
│  Monthly/Annual toggle                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FAQ (Accordion)                                       │
│  How long? · Agent knowledge required? · What's in DS?  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FINAL CTA                                              │
│  "Stop scaffolding. Start shipping."                    │
│  [Get Started Free] · No credit card · 5 min setup    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FOOTER                                                 │
│  Logo · Links · Legal                                   │
└─────────────────────────────────────────────────────────┘
```

---

## Key Sections

### 1. InteractiveFiletree + Code Panel (Hero centerpiece)

**What it is:**
Visual monorepo tree (file/folder structure) paired with a live code panel. Hovering over a file in the tree highlights its content in the panel. Clicking a file shows its full implementation.

**Files shown (suggested set):**
```
apps/
├── web/
│   └── src/app/page.tsx       ← landing page
packages/
├── ui/
│   └── src/components/ui/     ← design system
│       └── button.tsx
api/
├── routes/
│   └── deploy.ts              ← agent endpoint
.deesse/
├── agents/
│   ├── analyze.ts             ← agent script
│   └── deploy.ts
deesse.config.ts
```

**Code panel:** Shows the content of the hovered/selected file, syntax highlighted, theme-aware.

**Why it matters:** Visual proof of the "supastarter pattern" — the template is structured so agents can navigate it immediately. No discovery work for the agent.

**Implementation:** Custom component in `src/components/`. Built with Motion for hover/click animations. No shadcn primitive.

---

### 2. Terminal Showcase

**What it is:** A fake terminal window showing the `deessejs deploy` CLI in action. Shows agentic workflow — agent analyzing, building, deploying.

**Visual treatment:** Dark terminal UI, monospace font (`--font-mono`), green/gray text, animated typing effect.

**Key:** It should look real enough that a developer thinks "I want that."

---

### 3. Social Proof Strip

**Placement:** Immediately after hero.

**Content:** "Built with agents from:" + logos of tools (Cursor, Copilot, etc.) + trust metrics.

**Not a section header** — just a strip. Don't create a "social proof" section with testimonials unless real ones exist.

---

### 4. Features Grid

**Layout:** 2×3 grid of feature cards.

**Card anatomy:**
- Icon (lucide)
- Title (label-16 Bold)
- Description (copy-14, 2 lines max)

**Content per feature:** Show, don't describe. Where possible, add a code snippet inline.

---

### 5. How It Works

**3 steps only:**
1. `git clone` — get the template
2. Configure `.env` — set your keys
3. `git push` — agent deploys

**Visual:** Step indicators with icons, connected by a line or arrow.

---

### 6. Pricing

**3 tiers:**
- **Starter** ($49) — core template, 1 app, docs
- **Pro** ($149) — everything, unlimited, priority, agent wizard
- **Enterprise** (custom) — SLA, white-label, support

**Toggle:** Monthly / Annual (20% savings). Styled with `Switch`.

---

### 7. FAQ

**Style:** `Accordion` primitive, full-width.

**Questions to cover (prioritized):**
1. "How long does setup take?" → "5 minutes"
2. "Do I need agent development knowledge?" → "No"
3. "What's in the design system?" → shadcn overview
4. "Can I use my own components?" → modular contract

---

### 8. Final CTA

**Headline:** "Stop scaffolding. Start shipping."

**Subtext:** "No credit card · 5 min setup · Production-ready"

**Single button:** `[Get Started Free]`

---

## Component Inventory

| Component | Type | Source |
|---|---|---|
| Navbar | Layout | Custom |
| Button | UI | shadcn `Button` |
| Card | UI | shadcn `Card` |
| InteractiveFiletree | Custom | `src/components/` |
| CodeBlock | Custom | `src/components/` |
| Terminal | Custom | `src/components/` |
| Accordion | UI | shadcn `Accordion` |
| Switch (pricing toggle) | UI | shadcn `Switch` |
| Badge (pricing tier) | UI | shadcn `Badge` |
| Separator | UI | shadcn `Separator` |
| Tooltip | UI | shadcn `Tooltip` |
| Dialog (signup/contact) | UI | shadcn `Dialog` |
| Sonner (toast feedback) | UI | shadcn `Sonner` |
| Input / Field / Label | UI | shadcn `Input`, `Field`, `Label` |

**Deferred to v0.2:** Pricing cards (complex table layout), Form signup (needs Zod + RHF).

---

## Motion & Animation

Per `DESIGN.md §3` — motion is functional, never cosmetic:

- **0ms** — default for color/opacity transitions
- **150ms** — hover state changes on InteractiveFiletree nodes
- **200ms** — panel code fade on file selection
- **300ms** — terminal typing animation (initial load)
- **No loops** — no decorative animation
- **Respect `prefers-reduced-motion`**

---

## Dark Mode

All sections fully support `[data-mode="dark"]` on `<html>`.

Tokens switch automatically via CSS variables — no component changes needed.

---

## Layout Rules (Tailwind v4 only — no native CSS)

### Container max-width via `@theme`

Define once, reuse everywhere. In `globals.css`:

```css
@theme {
  --max-w-container: 1200px;
}
```

All sections use the same token:

```html
<div class="max-w-container mx-auto px-4 lg:px-8">
  <!-- section content -->
</div>
```

**Note:** `max-w-screen-*` utilities stop at `xl` = 1280px. No built-in 1200px. Custom token is required.

### Grid everywhere, no margins between components

Sections use CSS grid. Components sit directly in grid cells — **no margin or gap between sibling components unless the grid provides it**.

**Example — Features 2×3:**
```html
<!-- Separation from grid gap + borders, NOT margins -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-border [&>*]:border-border">
  <div class="p-6 bg-card">Feature 1</div>
  <div class="p-6 bg-card">Feature 2</div>
  <!-- ... -->
</div>
```

**Spacing rhythm:**
- **Within** a component → padding, gap
- **Between** components in a grid → grid gap only
- **Between sections** → `py-24` or `py-16` on the section itself

### Sections anatomy
```html
<section class="border-t border-border">
  <div class="max-w-container mx-auto px-4 lg:px-8 py-24">
    <!-- section content -->
  </div>
</section>
```

### Navbar
Sticky/fixed, full-width, separated from hero by `border-b border-border`. No bottom margin.

### Hero
InteractiveFiletree stays **contained** within max-w. No bleed.

### Tailwind v4 patterns to use

**Subgrid** — for pricing table alignment (header + cells):
```html
<div class="grid grid-cols-3 gap-px bg-border">
  <div class="grid grid-cols-subgrid col-span-3 gap-px bg-border">
    <div>Header spans all</div>
  </div>
  <div>Cell 1</div>
  <div>Cell 2</div>
  <div>Cell 3</div>
</div>
```

**`@container`** — for pricing cards that reflow by their own width:
```html
<div class="@container">
  <div class="@sm:flex-row @xs:flex-col">...</div>
</div>
```

**Arbitrary variants** — for interactive states without JS:
```html
<div data-state="running" class="data-[state=running]:opacity-100 data-[state=idle]:opacity-50">
```

**`field-sizing-content`** — for auto-growing terminal input:
```html
<textarea class="field-sizing-content" rows="2"></textarea>
```

**Gradient text** (v4 `bg-linear-*`):
```html
<h1 class="bg-linear-to-r from-cyan-400 via-blue-500 to-violet-600 bg-clip-text text-transparent">
  Gradient title
</h1>
```

**`bg-(--var)`** — reference CSS variables directly:
```html
<div class="text-(--foreground) bg-(--background)">
```

**Custom utility for terminal** (via `@utility`):
```css
@utility terminal-window {
  background: var(--card);
  border: 1px solid var(--border);
  shadow: var(--shadow-card);
}
```

### Tailwind v4 breaking changes to remember

| v3 | v4 |
|---|---|
| `shadow` | `shadow-sm` |
| `shadow-sm` | `shadow-xs` |
| `ring` (3px blue) | `ring-3` |
| `outline-none` | `outline-hidden` |
| `flex-shrink` / `flex-grow` | `shrink` / `grow` |
| `max-w-screen-xl` | `1280px`, not `1200px` — use custom token |

### Responsive breakpoints

Per `DESIGN.md §2.6`:

| Breakpoint | Tailwind | Layout |
|---|---|---|
| Mobile | `< 401px` | Single column, stacked |
| sm | `401px+` | |
| md | `601px+` | Features 2-col → `md:grid-cols-2` |
| lg | `961px+` | Features 3-col → `lg:grid-cols-3` |
| xl | `1200px+` | Max container 1200px → `max-w-container` |

Per `DESIGN.md §2.6`:

| Breakpoint | Tailwind | Layout |
|---|---|---|
| Mobile | `< 401px` | Single column, stacked |
| sm | `401px+` | |
| md | `601px+` | Features 2-col → `md:grid-cols-2` |
| lg | `961px+` | Features 3-col → `lg:grid-cols-3` |
| xl | `1200px+` | Max container 1200px → `max-w-[1200px]` |

---

## Content Rules

Per `DESIGN.md §6`:

- **Title case** — labels, buttons, nav items
- **Sentence case** — body, descriptions
- **Actions = verb + noun** — "Get Started", "View on GitHub"
- **Never** "please", marketing superlatives, or "successfully"
- **Numerals** — "5 min setup", not "five minutes"

---

## Open Questions

1. **Pricing real?** — Are $49/$149 real prices or placeholders? Need product sign-off.
2. **Social proof real?** — If no real testimonials yet, should we show logos only or placeholder quotes?
3. **Agent wizard** — Mentioned in pricing Pro tier. Is this a real feature or aspirational?
4. **"Watch Demo" button** — Does a demo video exist? If not, remove or link to YouTube.
5. **Form signup** — Needs react-hook-form + Zod. Defer to v0.2 or build minimal version now?

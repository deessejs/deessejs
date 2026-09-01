# DeesseJS — Design System

> **The spec the code implements.** This document is the source of truth. If a design decision lives only in code, it's a bug — bring it back here.
>
> Lives at the **root of the monorepo** (`DESIGN.md`). Applies to all apps — `apps/web`, `apps/template/apps/web`, `apps/cloud`, and any future surface. When the buyer-facing template package is built, the tokens and primitives will be extracted into `@deessejs/ui`; this document remains the single spec that drives both the implementation in `apps/web` and the eventual package.

---

## 0. Positioning context

The marketing positioning was pivoted from **"The Apple of SaaS templates"** (completeness + DX, the original wedge from `documents/internal/product/positioning.md`) to **"The SaaS template that never sleeps — your agents are the developers"** (the agentic wedge from `documents/internal/marketing/landing-page.md`).

**What this means for the design system:**

- **Primary frame (marketing-facing):** agentic. The visual language should feel functional, peer-to-peer, dev-tool native — built for the audience that ships with AI agents, not the audience that buys a polished app template.
- **Sub-principle (aesthetic):** "Apple" survives as restraint + polish + completeness. Every screen, every empty state, every error is still production-grade. The wedge changed; the bar didn't.
- **Concrete visual implications:** restrained neutrals dominate; primary color is a punctuation accent (not a brand surface); monospace typography has equal weight with sans (tabular figures, code in agents); terminal/code aesthetics are welcome in agent-facing surfaces.

When a design decision is in tension between "agentic" and "Apple", agentic wins the framing, Apple wins the polish. Both must be present.

---

## 1. Principles (load-bearing)

These are inherited from the product brief and apply to every component and token:

1. **Opinionated defaults.** We make the choice. The buyer overrides if they need to.
2. **Modular by default.** Every component can be removed without breaking the rest.
3. **One coherent product, not a collection of parts.** Same patterns, same naming, same errors, same focus ring, same spacing rhythm.
4. **Polished UX everywhere.** Every screen, every empty state, every error. Not a chatbot demo — a *product*.
5. **No half-built features.** Ship the v0.1 inventory (17 primitives + 1 custom) at 100%, not 30 components at 80%. The DS that ships is the DS that's documented.
6. **CSS variables only.** No JavaScript theme manager. No `next-themes`. The `data-mode` attribute (light/dark) is set in HTML; CSS does the rest.

---

## 2. Token system

### 2.1 Token model

The DS uses shadcn's standard semantic token model. Two layers: semantic tokens → utility classes.

| Layer | Token | Lives in | Example |
|---|---|---|---|
| **Semantic tokens** | `--primary`, `--background`, `--foreground`, `--card`, … | `:root` and `.dark` | `--primary: oklch(0.205 0 0)` |
| **Utility classes** | `bg-primary`, `text-foreground`, `border-input`, … | `@theme inline` mapping | `--color-primary: var(--primary)` |

**Rule:** Components NEVER reference hardcoded values. They reference semantic tokens (`bg-primary`, `text-foreground`).

### 2.2 Color tokens

All colors use `oklch()` for Display P3 support. Light theme is the default; dark theme redefines the **same token names** with different values (per Geist pattern). The FOUC script sets `data-mode` on `<html>`; the CSS selector `[data-mode="dark"]` applies dark values.

**Two semantic layers:**
1. **Solid gray tokens** — `gray-*` (opaque). Hold contrast on any surface. Use for **text and icon fills**.
2. **Translucent gray tokens** — `gray-alpha-*` (semi-transparent). Layer over any background. Use for **borders, dividers, overlays, and hover states**.

Do not swap them. `gray-*` = text/fill. `gray-alpha-*` = borders/overlays. (Per Geist's §Do's and Don'ts.)

**Semantic tokens:**

| Token | Use | Default (light) |
|---|---|---|
| `--background` | Page surface | `oklch(1 0 0)` |
| `--foreground` | Default text on background | `oklch(0.145 0 0)` |
| `--card` | Elevated surface (Card) | `oklch(1 0 0)` |
| `--card-foreground` | Text on card | `oklch(0.145 0 0)` |
| `--popover` | Floating surface (Popover, DropdownMenu) | `oklch(1 0 0)` |
| `--popover-foreground` | Text on popover | `oklch(0.145 0 0)` |
| `--primary` | High-emphasis action, brand color | `oklch(0.205 0 0)` |
| `--primary-foreground` | Text on primary | `oklch(0.985 0 0)` |
| `--secondary` | Lower-emphasis filled action | `oklch(0.97 0 0)` |
| `--secondary-foreground` | Text on secondary | `oklch(0.205 0 0)` |
| `--muted` | Subtle surface, description text | `oklch(0.97 0 0)` |
| `--muted-foreground` | Text on muted | `oklch(0.556 0 0)` |
| `--accent` | Hover/focus surface | `oklch(0.97 0 0)` |
| `--accent-foreground` | Text on accent | `oklch(0.205 0 0)` |
| `--destructive` | Error/destructive action | `oklch(0.577 0.245 27.325)` |
| `--destructive-foreground` | Text on destructive | `oklch(0.985 0 0)` |
| `--border` | Default border, separator | `oklch(0.922 0 0)` |
| `--input` | Form control border | `oklch(0.922 0 0)` |
| `--ring` | Focus ring | `oklch(0.708 0 0)` |
| `--chart-1` … `--chart-5` | Chart palette | (see token block) |
| `--sidebar` | Sidebar surface | `oklch(0.985 0 0)` |
| `--sidebar-foreground` | Sidebar text | `oklch(0.145 0 0)` |
| `--sidebar-primary` | High-emphasis action in sidebar | `oklch(0.205 0 0)` |
| `--sidebar-primary-foreground` | Text on sidebar primary | `oklch(0.985 0 0)` |
| `--sidebar-accent` | Hover/focus in sidebar | `oklch(0.97 0 0)` |
| `--sidebar-accent-foreground` | Text on sidebar accent | `oklch(0.205 0 0)` |
| `--sidebar-border` | Sidebar border | `oklch(0.922 0 0)` |
| `--sidebar-ring` | Sidebar focus ring | `oklch(0.708 0 0)` |

### 2.3 oklch contrast rules

oklch makes contrast predictable: lightness (L) controls contrast, chroma (C) and hue (H) don't affect it. Fix contrast by adjusting L only.

**APCA thresholds (perceptual, recommended for internal use):**

| Content type | Pass | Pass+ |
|---|---|---|
| Normal text | Lc 60 | Lc 75 |
| Large text (≥18px / ≥14px bold) | Lc 45 | Lc 60 |
| UI components and graphical objects | Lc 30 | — |

**WCAG 2 thresholds (required for formal accessibility claims):**

| Content type | AA | AAA |
|---|---|---|
| Normal text (<18px / <14px bold) | 4.5:1 | 7:1 |
| Large text (≥18px / ≥14px bold) | 3:1 | 4.5:1 |
| UI components & graphical objects | 3:1 | — |

**Quick oklch lightness gap guide:**
- **Light background (L > 0.85):** foreground L should be ≤ 0.45
- **Dark background (L < 0.25):** foreground L should be ≥ 0.75
- Always verify with an actual contrast calculator. APCA Lc value is signed: positive = light text on dark, negative = dark text on light.

### 2.4 Dark mode

Class-based. Both `.dark` and `[data-mode="dark"]` selectors apply dark values. The FOUC script sets `data-mode` on `<html>`; the CSS selector `[data-mode="dark"]` picks up the dark values before paint.

The pattern is **identical token names, different values** (per Geist's dark theme convention): same `--background`, `--foreground`, `--primary`, etc., just re-mapped to dark-appropriate oklch values. Components never change — only the token values change.

### 2.5 Typography

**Fonts:**
- `--font-sans`: Geist Sans (UI, prose)
- `--font-mono`: Geist Mono (code, tabular data)
- `--font-serif`: System serif (fallback only)

**Roles** (each maps to a Tailwind class via `@theme inline`):

**Heading** — Page/section titles. `letterSpacing` tightens as size grows.

| Size | Tailwind class | Use |
|---|---|---|
| 72 | `text-heading-72` | Marketing heroes |
| 64 | `text-heading-64` | |
| 56 | `text-heading-56` | |
| 48 | `text-heading-48` | |
| 40 | `text-heading-40` | |
| 32 | `text-heading-32` (Subtle) | Dashboard headings, marketing subheadings |
| 24 | `text-heading-24` (Subtle) | |
| 20 | `text-heading-20` (Subtle) | |
| 16 | `text-heading-16` (Subtle) | |
| 14 | `text-heading-14` | Small section labels |

**Label** — Single-line scannable text. Ample line-height for pairing with icons.

| Size | Tailwind class | Use |
|---|---|---|
| 20 | `text-label-20` | Marketing text |
| 18 | `text-label-18` | |
| 16 | `text-label-16` (Strong) | Titles to differentiate from regular |
| 14 | `text-label-14` (Strong) | Most common label size. Nav, menus, form labels |
| 14 | `text-label-14-mono` | Pairs with larger (>14) mono text |
| 13 | `text-label-13` | Secondary line next to labels. Tabular figures for numbers |
| 13 | `text-label-13-mono` | Pairs with `label-14` |
| 12 | `text-label-12` | Tertiary level text. Tab captions, "Show More", calendar caps |
| 12 | `text-label-12-mono` | |

**Copy** — Multi-line body text. Taller `line-height` than Label.

| Size | Tailwind class | Use |
|---|---|---|
| 24 | `text-copy-24` (Strong) | Hero areas on marketing pages |
| 20 | `text-copy-20` (Strong) | |
| 18 | `text-copy-18` (Strong) | Big quotes |
| 16 | `text-copy-16` (Strong) | Modals, large views where text breathes |
| 14 | `text-copy-14` (Strong) | Most commonly used text style |
| 13 | `text-copy-13` | Secondary text, space-constrained views |
| 13 | `text-copy-13-mono` | Inline code mentions |

**Button** — Button labels only.

| Size | Tailwind class | Use |
|---|---|---|
| 16 | `text-button-16` | Largest button |
| 14 | `text-button-14` | Default button |
| 12 | `text-button-12` | Tiny button inside input fields |

**Rules:**
- `copy-14` and `label-14` cover ~80% of all text.
- Use `-mono` variants whenever tabular figures are needed (numbers in tables, metrics, code-adjacent labels).
- Use `<strong>` inside copy/label for Strong modifier (Geist pattern).
- Never set `font-size`, `font-weight`, or `line-height` by hand — always use a token class.
- Tabular figures (numbers that align in columns): always use Geist Mono or a mono token variant.

### 2.6 Geometry

**Radius scale** (Geist pixel values, not shadcn's calculated ratios):

```css
--radius-sm:  0.375rem;   /*  6px — inputs, small controls */
--radius:      0.75rem;    /* 12px — cards, menus, modals */
--radius-lg:   1rem;      /* 16px — fullscreen surfaces */
--radius-full:  9999px;    /* pills, avatars, circular controls */
```

Shadcn's calculated `radius-*` scale (`sm` through `4xl`) is **not used** — Geist's three-tier system (`sm` / default / `lg`) is the standard.

**Rule:** One radius family per view. Don't mix sharp and rounded corners.

**Spacing scale** (4px base, Geist values):

| Value | Rem | px | Use |
|---|---|---|---|
| 4 | 0.25rem | 4px | Fine-grained spacing |
| 8 | 0.5rem | 8px | Inside a group |
| 12 | 0.75rem | 12px | |
| 16 | 1rem | 16px | Between groups |
| 24 | 1.5rem | 24px | Card padding (standard) |
| 32 | 2rem | 32px | Between sections, card padding (hero) |
| 40 | 2.5rem | 40px | |
| 64 | 4rem | 64px | Section gaps |
| 96 | 6rem | 96px | |

**Three-step rhythm:** 8px inside a group → 16px between groups → 32–40px between sections.

**Container:** 1200px max-width, centered, side padding grows at wide breakpoints.

**Breakpoints** (mobile-first):

| Name | Min-width | Use |
|---|---|---|
| `sm` | 401px | |
| `md` | 601px | |
| `lg` | 961px | |
| `xl` | 1200px | |
| `2xl` | 1400px | |

### 2.7 Elevation

Subtle shadows. Hierarchy comes from tonal surfaces + borders first (Geist pattern). Tooltips take the lightest values.

**Light theme shadows:**

| Token | Value | Use |
|---|---|---|
| `shadow-card` | `0 2px 2px rgb(0 0 0 / 0.04)` | Raised cards |
| `shadow-popover` | `0 1px 1px rgb(0 0 0 / 0.02), 0 4px 8px -4px rgb(0 0 0 / 0.04), 0 16px 24px -8px rgb(0 0 0 / 0.06)` | Popovers, menus, dropdowns |
| `shadow-dialog` | `0 1px 1px rgb(0 0 0 / 0.02), 0 8px 16px -4px rgb(0 0 0 / 0.04), 0 24px 32px -8px rgb(0 0 0 / 0.06)` | Modals, dialogs |

Pair each elevation level with its matching radius: `shadow-card` + `radius-sm`, `shadow-popover` + `radius`, `shadow-dialog` + `radius-lg`.

### 2.8 Easing

```css
--ease-geist: cubic-bezier(0.175, 0.885, 0.32, 1.1);
```

Slight overshoot. Subtle spring-feel without spring physics. Use for all functional transitions.

---

## 3. Motion

> **"0ms is often the snappiest and best choice."** — Vercel Geist

Use motion only when it clarifies a change. Never for decoration.

### 3.1 Duration

| Duration | Use case |
|---|---|
| `0ms` / `duration-0` | Default for state changes (color, opacity, border) — instant feel. |
| `150ms` / `duration-150` | Hover scale, gentle fade |
| `200ms` / `duration-200` | Popovers, tooltips, dropdowns |
| `300ms` / `duration-300` | Modals, dialogs, overlays |
| `400ms+` | Page transitions, large reveals |

### 3.2 Easing

Use `--ease-geist` for all functional transitions:

```css
transition-timing-function: var(--ease-geist);
```

For decorative loops, use the standard ease curve of the animation type (spin = linear, pulse = ease-in-out, bounce = bounce).

### 3.3 Tailwind v4 animation utilities

Tailwind v4 ships built-in animation utilities. Use `@theme` to configure or override:

```css
@theme {
  --animate-spin: spin 1s linear infinite;
  --animate-ping: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
  --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-bounce: bounce 1s ease-in-out infinite;
  --animate-wiggle: wiggle 1s ease-in-out infinite;
}
```

**Available classes:** `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`. Custom animations defined in `@theme` generate matching utilities (`animate-wiggle`, etc.).

### 3.4 Reduced motion

Respect `prefers-reduced-motion` for all non-essential animation:

```html
<!-- Apply only when user does NOT prefer reduced motion -->
<button class="motion-safe:animate-spin ...">

<!-- Apply only when user prefers reduced motion -->
<div class="motion-reduce:animate-bounce ...">
```

For interactive/drag motion: spring physics via Motion library (see §3.5).

### 3.5 Motion library (interactive motion)

For spring physics, drag, layout animations, and choreography: use **Motion** (`motion` npm package, previously Framer Motion). The Motion AI Kit (`/motion` skill for coding agents) provides design guidelines and API reference.

Motion's hybrid WAAPI engine runs on the Web Animations API for 120fps native performance, with JS fallback for spring physics. It also supports native `oklch` color animations natively (supported since Motion v12+).

**Key Motion APIs for the DS:**
- `<motion.div>` — spring-based hover/tap via `whileHover`, `whileTap`
- `<AnimatePresence>` — exit animations before DOM removal
- `<LayoutGroup>` + `layoutId` — shared element transitions
- `useScroll` + `MotionValue` — scroll-linked animations
- `AnimatePresence` + `mode="wait"` — coordinated choreographed reveals

For simple hover/fade, CSS transitions are sufficient. Reach for Motion when spring physics, drag, layout changes, or choreography are needed.

### 3.6 Rules

- Honor `prefers-reduced-motion` via `motion-safe:` / `motion-reduce:`.
- No long loops. No attention-grabbing animation.
- No decoration. Motion is functional, never cosmetic.
- `0ms` is the default for state changes (color, opacity, border) — instant feels snappiest for most UI.

---

## 4. Component patterns

### 4.1 Buttons

**Variants** (per Vercel Geist pattern):

| Variant | Style | Use |
|---|---|---|
| `default` (primary) | Solid `--primary` fill, `--primary-foreground` text | Single most important action on a view. |
| `secondary` | `--secondary` fill, `--secondary-foreground` text | Supporting actions. |
| `outline` | Transparent fill, `--border` border, `--foreground` text | Secondary with visual weight. |
| `ghost` | Transparent fill, `--foreground` text | Low-emphasis actions. |
| `destructive` | `--destructive` fill, `--destructive-foreground` text | Destructive actions (delete, cancel subscription). |
| `link` | Transparent fill, `--primary` text, underline on hover | Inline navigation. |

**Sizes:** `sm` (32px), `default` (40px), `lg` (48px), `icon` (square, 40px).

**States:** default, hover (token step up), focus, active (token step up further), disabled (`--muted` fill, `not-allowed` cursor, 50% opacity).

**Focus ring (signature — copy exactly):**
```css
box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring);
```

A 2px gap in the surface color, then a 2px ring. The gap makes the ring readable on any background.

### 4.2 Forms

- All forms use `react-hook-form` + Zod. Type-safe end-to-end.
- Use the `Field` primitive (label + input + description + error).
- `aria-invalid` and `aria-describedby` are wired by the `Field` primitive.
- Inline validation on blur. Submit on `Enter` if single-input; explicit submit otherwise.

### 4.3 Empty / Loading / Error states

Every list, every page, every async data source has all three:

**Loading:**
- Skeleton for known shapes (use `Skeleton` primitive).
- Spinner for unknown durations.
- Never block the whole page; show progress where possible.

**Empty:**
- Headline (what's missing).
- Body (why it's empty / what to do).
- Primary action that resolves the empty state.
- No decorative illustration. No marketing copy. The user is stuck here.

**Error:**
- What happened.
- What to do next (retry, contact support, view docs).
- Never blame the user.
- A request ID for support escalation if applicable.

### 4.4 Toasts

Use Sonner. Categories:

| Type | Color | Icon |
|---|---|---|
| info | `--primary` | Info icon |
| success | `--green-500` | Check icon |
| warning | `--amber-500` | Alert icon |
| error | `--destructive` | Alert icon |

Toast copy: what changed, no trailing period, never "successfully" (`Project deleted`, not `Successfully deleted the project`).

### 4.5 Modals / Dialogs

- Use `Dialog` primitive. Always include a close button and `Esc` handling.
- Primary action on the right (Western reading order), destructive on the left.
- Sticky header on tall content.
- Click-outside dismiss is on by default. Use with care for destructive actions — require explicit cancel.

---

## 5. Accessibility

WCAG 2.1 AA. Every component must:

- Have a focus visible (the two-layer focus ring).
- Be keyboard-navigable.
- Use semantic HTML (`<button>` not `<div onClick>`).
- Have `aria-label` for icon-only buttons.
- Have `aria-invalid` and `aria-describedby` for form errors.
- Have `prefers-reduced-motion` respected for any motion.
- Maintain 4.5:1 contrast for body text, 3:1 for large text.
- Pass axe-core in CI.

---

## 6. Voice & content rules

- **Title Case** for labels, buttons, titles, tabs.
- **Sentence case** for body, helper text, toasts.
- Actions = **verb + noun** (`Deploy Project`, `Delete Member`). Never `Confirm`, `OK`.
- Errors = **what happened + what to do next** (`Build failed. Bundle exceeds 50 MB. Reduce it or raise the limit.`).
- Toasts = **specific thing + no period + never "successfully"** (`Project deleted`).
- Empty states = **point to first action** (`No deployments yet. Push to your Git repository to create one.`).
- In-progress = **present participle + ellipsis** (`Deploying…`, `Saving…`).
- Numerals not words (`3 projects`). Curly quotes. The ellipsis character, not three dots.
- No `please`. No marketing superlatives.

---

## 7. v0.1 inventory

The DS that ships now includes:

- **Tokens:** full color, typography, spacing, radius, shadow, easing.
- **24 shadcn primitives** (installed via `pnpm dlx shadcn@latest add` on 2026-06-24, base-nova / Base UI style; `Avatar` and `Table` added 2026-06-26 to support `AuthorBadge` and the `/pricing` feature matrix; `Collapsible` and `ScrollArea` added subsequently; `Sidebar`, `Sheet`, and `Skeleton` added 2026-06-30 to support the Cloud v0 `(protected)` shell — `Sidebar` ships with its own mobile drawer via `Sheet` and a loading primitive via `Skeleton`): `Button`, `Input`, `Textarea`, `Field`, `Label`, `Card`, `Dialog`, `DropdownMenu`, `Popover`, `Tooltip`, `Sonner`, `Checkbox`, `Switch`, `Separator`, `Accordion`, `Badge`, `Select`, `Avatar`, `Table`, `Collapsible`, `ScrollArea`, `Sidebar`, `Sheet`, `Skeleton`.
  - **Note on `Form`:** Forms use `react-hook-form` + `Zod` as a pattern (§4.2) — there is no shadcn `Form` primitive in the CLI registry.
- **1 custom component (still to ship, will live in `src/components/`, not in `src/components/ui/`):** `InteractiveFiletree` — the visual centerpiece of the v1 landing page. Built with Motion for hover/click animations. Renders the monorepo structure as a monospaced tree with paired code panels (the "supastarter pattern" from §6 of `landing-page.md`). Not a shadcn primitive — has its own docs entry.

**Deferred to v0.2** (each needs a use case in `apps/web` to justify shipping — "agentic SaaS template" is not "every component ever made"):

- `Command`, `Combobox`, `RadioGroup`, `Tabs`, `Breadcrumb`, `Alert`, `Spinner`, `Empty`, `Item`, `NavigationMenu`, `AlertDialog`, `ContextMenu`, `HoverCard`, `Menubar`, `Pagination`, `Resizable`, `Slider`, `Toggle`, `ToggleGroup`, `DataTable` (TanStack wrapper).

---

## 8. How to add a primitive

1. `pnpm dlx shadcn@latest add <name>` (lands in `src/components/ui/<name>.tsx`).
2. Read the generated code. Adjust variants/states to match Section 4 patterns.
3. Add a row to the preview page (`src/app/(marketing)/_design-system/page.tsx`).
4. Verify dark mode works.
5. Add an axe-core render test.
6. Update this document (Section 7 inventory).

## 9. How to delete a primitive

The modular contract applies:

1. `rm src/components/ui/<name>.tsx`.
2. Remove all imports of it across the codebase.
3. `pnpm typecheck` — must remain green.
4. `pnpm build` — must succeed.
5. Remove the row from the preview page.
6. Update this document (Section 7 inventory).

A buyer can run steps 1–4 to remove a primitive they don't need. The contract holds.

## 10. Authoring canon

The system above defines the tokens and primitives. This section defines how to assemble them into a page. Work a page in four passes, in order, before writing the first line of JSX.

### 10.1 The four-pass frame

1. **Frame.** Pick the wrapper recipe from §10.2. Decide the surface role (full-bleed grid, single-column article, detail shell) before any token or copy decision. The wrapper constrains everything downstream.
2. **Compose.** Place the header (§10.4), then sections top-to-bottom using the archetypes in §10.6. Pick section shells (cards, dividers, shared-border grids) before picking typography.
3. **Visual system.** Apply the Tailwind utilities from §2 (tokens) and the typography resolution in §10.5. Decide the radius family once for the view and hold it.
4. **Inspect.** Run the §12 checklist. Loading, empty, error, permission states declared. Cross-link at the bottom. Accessibility sweep passes.

A page that has not been framed does not ship.

### 10.2 Wrapper recipes

Three canvases. Pick one per page; do not invent a fourth.

**Recipe A — Frame-grid (full-bleed shared-border).**

Use when the page is a dense landing surface composed of multiple sections that share borders and read as one card. Canonical exemplar: `apps/web/src/app/(marketing)/page.tsx` (homepage).

Outer wrapper:

```html
<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
  <div class="border border-border bg-background rounded-none">…</div>
</div>
```

Section terminator between cells in a grid: `divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border`. The last row inherits the outer border via `border-b`.

Anti-patterns: Card primitives for in-grid cells (kills shared borders), rounded corners on cells, mixing `gap-*` and `divide-*` in the same grid.

**Recipe B — Article stack (one recipe, three sizes).**

Use when the page is primarily a reading surface with stacked sections, no shared-border grids. Common stem: `mx-auto flex max-w-{N} flex-col gap-{M} px-4 py-16 sm:px-6 lg:py-24`.

Sizes:

- `max-w-3xl gap-12` — prose-heavy single column. Exemplar: `apps/web/src/app/(marketing)/manifesto/page.tsx`.
- `max-w-4xl gap-12` — prose with a sibling surface (ToC aside, sidebar). Exemplar: `apps/web/src/app/(content)/knowledge-base/topics/[topic]/page.tsx`.
- `max-w-6xl gap-16 lg:gap-20` — multi-section catalog or comparison. Exemplars: `apps/web/src/app/(marketing)/pricing/page.tsx`, `apps/web/src/app/(marketing)/ecosystem/page.tsx`.

Anti-patterns: mixing `gap-*` values inside one page, using `<article>` for non-prose surfaces, adding side borders.

**Recipe C — Section shell (delegated layout).**

Use when the page delegates layout to a domain component (template detail, blog post body, KB guide body). Outer wrapper: `<section class="px-6 py-16">{component}</section>`. The shell owns outer padding; the component owns internal layout. Exemplar: `apps/web/src/app/(product)/templates/[template_slug]/page.tsx`.

Anti-patterns: padding inside the shell that duplicates the component's own padding; loading/empty/error handled inside `page.tsx` instead of `loading.tsx` / `error.tsx` / `not-found.tsx` route segments.

### 10.3 The grid family — shared borders and dividers

The shared-border pattern is a reusable recipe, not a one-off. The outer wrapper card supplies the outer border; the cells contribute padding and content; the dividers supply the inner borders. Cells never carry their own outer border.

In practice: outer `border border-border bg-background rounded-none`; inner cells use `divide-x divide-y divide-border gap-0`; the last row of each grid uses `border-b border-border` to inherit the wrapper outline so no double strokes appear at section seams.

Rule: cells contribute padding, the wrapper card supplies the outer border. Never both.

### 10.4 The header pattern

The eyebrow → H1 → lead trio is invariant across all surfaces. Do not skip a step.

Eyebrow utility: `text-label-13 uppercase tracking-wider text-muted-foreground`. The `uppercase` is letter-spacing rhythm, not decoration.

H1 size from §10.5 (typography differs by surface layer). Always apply `text-balance` to the H1.

Lead utility: `text-copy-{14|20} text-muted-foreground`. Wrap in `max-w-2xl` to constrain measure.

Optional tagline under the lead: `text-copy-13-mono text-muted-foreground` (codes, identifiers, install hints).

### 10.5 Typography resolution — the marketing/content split

Two conventions exist. The canon encodes them as a rule, not a bug.

Marketing surfaces use the `text-heading-*`, `text-copy-*`, `text-label-*` Tailwind utilities from §2.5. Content surfaces (blog, changelog, KB) use raw Tailwind (`text-3xl` / `text-4xl` + `font-bold` + `tracking-tight` / `tracking-tighter`) because their H1 sits inside an MDX prose plugin cascade — overriding that cascade with a token class fights the plugin.

Mixing the two on the same surface is a bug.

Reference table:

| Role | Marketing utility | Content utility |
| --- | --- | --- |
| Page H1 (hero) | `text-heading-72 tracking-tight text-balance` | `text-4xl font-bold tracking-tighter sm:text-5xl text-balance` |
| Page H1 (catalog) | `text-heading-56 tracking-tight text-balance` | `text-3xl font-bold tracking-tight text-balance` |
| Section H2 | `text-heading-32 tracking-tight` | `text-2xl font-semibold tracking-tight` |
| Card title H3 | `text-heading-24 tracking-tight` | `text-xl font-semibold tracking-tight` |
| Eyebrow | `text-label-13 uppercase tracking-wider text-muted-foreground` | (same) |
| Lead | `text-copy-{14|20} leading-{6|7} text-muted-foreground max-w-2xl` | `text-lg leading-7 text-pretty text-muted-foreground` |
| Body | `text-copy-14` or `text-copy-16 leading-6` | (prose plugin cascade) |

Marketing exemplars: `apps/web/src/app/(marketing)/pricing/page.tsx`, `apps/web/src/app/(marketing)/page.tsx`. Content exemplars: `apps/web/src/app/(content)/blog/[slug]/page.tsx`, `apps/web/src/app/(content)/knowledge-base/guides/[slug]/page.tsx`.

### 10.6 Section archetypes

Three archetypes recur. Reach for them; do not invent a bespoke shell.

**Hero.** Centered, eyebrow + H1 + lead + dual CTA + optional tagline. Used at the top of every marketing surface.

**Three-card grid.** `grid-cols-1 md:grid-cols-3 gap-0 divide-y divide-border md:divide-y-0 md:divide-x divide-border`. Each cell is a `<div>` with `flex flex-col gap-3 p-6`. H3 + body + optional CTA. Used for tier comparisons, principle grids, outcome lists.

**End-of-page cross-link.** Pick one of five shapes: prev/next nav (blog), in-topic CTA Card (KB), 2-col final CTA (homepage), footer CTA strip (pricing), "Related reading" card grid (everywhere). Every page terminates with exactly one. The cross-link is reachable from the keyboard tab order.

### 10.7 Page-level async states

Re-state §4.3 at the page level. Every page that fetches data declares all four states. Loading via `loading.tsx` showing the page shell with `<Skeleton />` for content blocks. Empty points to the first action the user should take. Error exposes a request ID and a retry path. Permission is a `(protected)` route boundary, not a per-page concern.

A page that renders one of these states inline must use the design system primitives for that state — never raw `<div>` with copy-pasted shadcn classes.

## 11. Reject list

Twelve items. Each is either a re-statement of a rule already in this document or a constraint validated by the team. Do not negotiate these in review.

1. No em-dash in user-facing copy. Use a comma, colon, or split the sentence. Em-dash is reserved for this document and code comments.
2. No marketing superlatives. No "blazing fast", "best-in-class", "revolutionary", "game-changing", "world-class". State the fact.
3. No decorative gradients. `bg-gradient-*` is rejected on every surface. Solid fills, borders, and tonal surfaces only.
4. No all-caps eyebrows used decoratively. The `uppercase` on `text-label-13` is letter-spacing rhythm. Never two consecutive all-caps strings; never an all-caps CTA.
5. No "please" or "successfully" in user-facing copy. "Project deleted", not "Successfully deleted the project". "Sign in to continue", not "Please sign in".
6. No mixed radius families per view. Pick one (sharp / `rounded-sm` / `rounded-lg` / `rounded-xl`) for the page and hold it. Do not mix `rounded-none` cells with `rounded-xl` cards in the same grid.
7. No raw HTML form controls. Use `@workspace/ui` `Field`, `Input`, `Select`, `Checkbox`, `Switch`. Copying shadcn classes onto a raw `<input>` is rejected by §7 inventory contract.
8. No attention-grabbing motion. No bounces, pulses, or infinite loops on idle state. `animate-pulse` for skeleton states only. All non-essential motion behind `motion-safe:`.
9. No manual `font-size`, `font-weight`, or `line-height` on marketing copy. Always use a token class from §2.5. Content surfaces are the documented exception (§10.5).
10. No `gray-*` text on a `gray-alpha-*` surface, and vice versa. `gray-*` = text and icon fills; `gray-alpha-*` = borders, dividers, overlays, hover. Do not swap them.
11. No `onClick` on a `<div>` for navigation. Use `<Link>` or `<Button>`. Use `<Dialog>` not a hand-rolled modal. Use `<DropdownMenu>` not a hand-rolled popover.
12. No JavaScript theme manager. Light/dark mode is set on `<html data-mode>` by the FOUC script; CSS does the rest.

## 12. Inspection checklist

Run before opening a PR that adds or rewrites a surface page.

1. Wrapper recipe picked and named in the file's leading JSDoc comment. The page opens with a comment naming the wrapper (frame-grid / article-stack:3xl|4xl|6xl / section-shell) and the section order.
2. Header pattern applied. Eyebrow (`text-label-13 uppercase tracking-wider text-muted-foreground`), `<H1>` with the size from §10.5, lead (`text-copy-{14|20} text-muted-foreground`). H1 has `text-balance`.
3. Typography matches the surface layer. Marketing pages use `text-heading-*`; content pages use raw Tailwind H1 (deliberate). No mixing on the same surface. Body copy uses `text-copy-14` or `text-copy-16`.
4. All four async states declared. Page either renders its own loading/empty/error/permission inline, or relies on `loading.tsx` + `error.tsx` + `not-found.tsx` segments. Loading uses `<Skeleton />` for known shapes. Empty points to a first action. Error exposes a request ID.
5. Section archetype used for each block. Hero, three-card grid, two-column split, in-text CTA, or end-of-page cross-link — pick from §10.6. No bespoke section shells.
6. End-of-page cross-link present. Every page terminates with one of: prev/next nav (blog), in-topic CTA Card (KB), 2-col final CTA (homepage), footer CTA strip (pricing), "Related reading" card grid. The cross-link is reachable from the keyboard tab order.
7. Accessibility sweep passes. Focus ring visible on every interactive element. `aria-label` on icon-only buttons. `prefers-reduced-motion` honored. Color contrast at least 4.5:1 for body and 3:1 for large text. `axe-core` clean.
8. No drift from §11. Scan the diff for em-dashes, raw HTML controls, gradient utilities, mixed radius families, manual font sizes, "please", "successfully", attention-grabbing motion. If any appear, the page does not ship.

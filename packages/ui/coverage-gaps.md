# Coverage Gaps — packages/ui

> Decisions and primitives that DeesseJS has NOT yet standardized.
> The product-design skill routes here when work touches these areas.
> Treat gaps as "ask the user, don't invent" zones.
>
> **Last verified: 2026-06-30** against `packages/ui/src/components/ui/` (24 files) and `DESIGN.md` §7.

---

## Primitives inventory status

### v0.1 inventory — COMPLETE (24/24 shipped)

Per `DESIGN.md` §7, the v0.1 target was 24 shadcn primitives. All shipped
(see `packages/ui/src/components/ui/`):

`Accordion`, `Avatar`, `Badge`, `Button`, `Card`, `Checkbox`, `Collapsible`,
`Dialog`, `DropdownMenu`, `Field`, `Input`, `Label`, `Popover`, `ScrollArea`,
`Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Sonner`, `Switch`,
`Table`, `Textarea`, `Tooltip`.

**`Form` is not a shadcn primitive** — forms use `react-hook-form` + Zod
as a pattern (DESIGN.md §4.2), wired through the `Field` primitive.

### Custom primitive — NOT YET SHIPPED

- **`InteractiveFiletree`** — the visual centerpiece of the v1 landing
  page. Lives at `src/components/InteractiveFiletree.tsx` (NOT in
  `src/components/ui/`). Built with Motion for hover/click animations.
  Renders the monorepo structure as a monospaced tree with paired code
  panels (per `landing-page.md` §6).

---

## Unresolved design decisions

These are spec-vs-implementation drift items acknowledged in
`packages/ui/CLAUDE.md` §12. They are the **real** coverage gaps an
agent will encounter when doing design work today.

### Focus Ring

- **Spec** (`DESIGN.md` §4.1): two-layer
  `box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring)`
- **Current code**: `focus-visible:ring-1 focus-visible:ring-ring`
  (single 1px — shadcn default)
- **Why it matters**: signature element of the design system. Every
  interactive primitive should match. Drift breaks visual consistency.
- **Reconcile**: update `button.tsx` + every interactive primitive to
  use the two-layer pattern. Tracked as a token-migration pass.

### Radius Scale

- **Spec** (`DESIGN.md` §2.6): Geist three-tier
  `--radius-sm: 6px / --radius: 12px / --radius-lg: 16px / --radius-full: pills`
- **Current code**: shadcn calculated scale
  (`sm * 0.6`, `md * 0.8`, `lg`, `xl * 1.4`, …) with `--radius: 0.625rem` (10px)
- **Why it matters**: spacing rhythm and surface hierarchy depend on
  this scale. Drift breaks the visual rhythm.
- **Reconcile**: rewrite `--radius-*` tokens in `globals.css` to match
  spec values. Update `@theme inline` mappings.

### Text Utilities

- **Spec** (`DESIGN.md` §2.5): `text-heading-*`, `text-label-*`,
  `text-copy-*`, `text-button-*` (with -mono variants where tabular
  figures matter)
- **Current code**: none defined. Components use raw `text-sm`,
  `text-base`, `text-lg`.
- **Why it matters**: typography discipline. Currently every component
  picks its own font-size, which means no consistency.
- **Reconcile**: add all spec utilities in `@theme inline` block of
  `globals.css`. Migrate components to use them. **Biggest single task
  of the three.**

---

## Open questions

These need Diego's input before any agent should make a decision.

- **Buyer override mechanism**: how does a buyer customize a primitive
  without forking the package? Spec exists in CLAUDE.md but no
  implementation pattern yet.
- **Theme engine portability**: does `--font-sans` indirection hold for
  non-Next.js consumers (e.g. a buyer using Vite + a different
  meta-framework)?
- **Multi-tenant tokens**: can a buyer re-skin via CSS variables alone,
  or do they need a fork of `@workspace/ui`?
- **InteractiveFiletree owner**: does the agent that ships it need to
  also ship the supporting motion choreography from `landing-page.md` §6,
  or is that a separate task?

---

## What an agent should do when work lands in a gap

1. **Do NOT invent.** A gap means there is no agreed decision yet.
   Inventing one creates hidden tech debt.
2. **Surface the gap to the user.** Cite this file (e.g. "coverage
   gaps: focus ring drift per `coverage-gaps.md`").
3. **Propose, don't implement.** In Shape mode, the proposal is the
   deliverable. In Implement mode, ask first if the work touches a gap.
4. **Log the resolution.** When Diego makes a call on a gap, update
   this file (gap → resolved) and surface the update to DESIGN.md.
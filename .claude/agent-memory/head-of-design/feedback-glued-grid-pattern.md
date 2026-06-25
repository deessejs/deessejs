---
name: feedback-glued-grid-pattern
description: For grid sections on the homepage, user wants a "glued" grid — no gap between cells, no section padding, no margin between subsections
metadata:
  type: feedback
---

For grid-based homepage sections (e.g. features), the user wants a "glued" grid pattern:

- No `gap-*` between grid cells
- No section padding (no `py-*` on `<section>`)
- No horizontal padding on the inner container (let it sit flush against the page frame)
- No `mt-*` between subsections (title blocks, grids, sub-headers sit immediately adjacent)

**Why:** User asked explicitly for `apps/web/src/components/homepage/features.tsx` on 2026-06-25 to be a real grid with no gaps, no global padding, no padding between subsections, "tout doit être collé" (everything glued). This is the canonical feature-grid look (Linear, Vercel, Stripe) — one continuous rectangular region of colored cells separated by 1px lines.

**How to apply:** When building similar grid sections:
1. Remove the `py-*` from the section, the `px-*` from the inner container, and all `mt-*` between blocks.
2. Drop `gap-*` on the grid.
3. Override the Card's default `rounded-xl` and `ring-1 ring-foreground/10` with `rounded-none ring-0` — otherwise rounded corners overlap weirdly and rings double up at the seams.
4. Use `divide-x divide-y divide-border` on the grid container to get the 1px cell separators (Tailwind v4 syntax).
5. Keep `bg-card` on the cells (default) — the color contrast against `bg-background` is what makes the grid read as one block.
6. Don't override `py-(--card-spacing)` on the Card — the internal card padding is part of the cell content, not the grid spacing.

**Known visual quirk:** Tailwind's `divide-y` adds `border-top` to all siblings except `:first-child`, which in a 2-col grid puts a 1px line on the top of cell (1,2). Acceptable — barely visible and the bg shift above the grid already creates the row break.

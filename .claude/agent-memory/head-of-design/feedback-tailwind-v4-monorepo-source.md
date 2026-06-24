---
name: feedback-tailwind-v4-monorepo-source
description: Tailwind v4 monorepo gotchas — THREE silent failures in packages/ui/src/styles/globals.css: (1) missing @source, (2) wrong @source order relative to @import, (3) off-by-one in relative path depth
metadata:
  type: feedback
---

# Tailwind v4 monorepo gotchas — THREE silent failures, all in the package's `globals.css`

All three produce silent failures (build green, page renders, but most CSS is missing). All three originate from `packages/ui/src/styles/globals.css`.

## Gotcha 1 — package's `globals.css` MUST scan consumer files via `@source`

**Problem:** In Tailwind v4 monorepos, when the design-system package's `globals.css` is imported by a consumer, Tailwind v4 does NOT automatically scan files outside the CSS file's directory. Classes used in `apps/web/src/app/page.tsx` are not detected → not generated → page is unstyled.

**Known upstream:** [shadcn-ui/ui#6878](https://github.com/shadcn-ui/ui/issues/6878) (open since 2025-03).

**Solution:** Add `@source` directives to `packages/ui/src/styles/globals.css`.

## Gotcha 2 — `@source` directive ORDER matters (silent no-op if wrong)

**Problem:** Even when `@source` is present, it silently does nothing if placed AFTER other `@import` directives. Confirmed by multiple users in [shadcn-ui/ui#6878](https://github.com/shadcn-ui/ui/issues/6878):

```css
/* ❌ DOES NOT WORK — @source after other @imports (silent failure) */
@import "tailwindcss";
@import "tw-animate-css";
@source "../components/**/*.{ts,tsx}";
```

```css
/* ✅ WORKS — @source immediately after @import "tailwindcss" */
@import "tailwindcss";
@source "../components/**/*.{ts,tsx}";
@import "tw-animate-css";
```

**Why:** Tailwind v4 evaluates `@source` at a specific point in the import pipeline. Other `@import` directives can swallow or bypass it. No error, no warning, just no CSS generated.

## Gotcha 3 — `@source` paths are RELATIVE TO THE CSS FILE, not project root

**Problem:** `@source` paths use relative-to-CSS-file resolution (per [Tailwind v4 docs](https://tailwindcss.com/docs/detecting-classes-in-source-files)). **Tracked as open upstream bug [shadcn-ui/ui#7821](https://github.com/shadcn-ui/ui/issues/7821)** — the CLI generates `@source "../../../apps/**"` which is off-by-one (3 ups reaches `packages/`, not root).

**Relative path math** from `packages/ui/src/styles/globals.css`:

| Pattern | Resolves to | Notes |
|---|---|---|
| `../` | `packages/ui/src/` | ✓ |
| `../../` | `packages/ui/` | ✓ |
| `../../../` | `packages/` | **NOT root** — common mistake |
| `../../../../` | **monorepo root** | where `apps/` lives |

An off-by-one means Tailwind silently scans a non-existent path. **No build error, just missing CSS at runtime.** This is exactly the bug we hit.

## The correct structure

```css
/* 1. Tailwind import FIRST */
@import "tailwindcss";

/* 2. @source IMMEDIATELY AFTER — before any other @import */
@source "../**/*.{ts,tsx}";                /* scan the package's src/ */
@source "../../**/*.{ts,tsx}";             /* scan the package itself */
@source "../../../../apps/**/*.{ts,tsx}";  /* scan consumer apps — 4 ups from packages/ui/src/styles/ */

@custom-variant dark (&:is(.dark *));      /* register dark: variant */

/* 3. Other @import directives AFTER @source */
@import "shadcn/tailwind.css";
@import "tw-animate-css";

/* 4. Then :root, .dark, @theme inline, @layer base ... */
```

## Alternative cleaner pattern: `source()` function

Per [Tailwind v4 docs](https://tailwindcss.com/docs/detecting-classes-in-source-files), the recommended monorepo pattern sets an explicit base path:

```css
@import "tailwindcss" source("../../../../");   /* base scanning path = monorepo root */

@source "apps/**/*.{ts,tsx}";                    /* now relative to root */
@source "packages/ui/src/**/*.{ts,tsx}";
@source "packages/ui/**/*.{ts,tsx}";

@custom-variant dark (&:is(.dark *));

@import "shadcn/tailwind.css";
@import "tw-animate-css";
```

**Pros:** base path is explicit in one place; removes the off-by-one risk; clearer intent for future contributors. **Recommended for new projects.**

## Architectural note — who scans whom?

The typical shadcn monorepo pattern (per the [merged PR #6724](https://github.com/shadcn-ui/ui/pull/6724) and the [Torben Sko blog post](https://torbensko.com/blog/fixing-tailwind-culling-in-monorepos/)):

- **The app** generates all CSS by scanning both its own source AND the component package
- **The component package** only contains tokens; doesn't scan the apps

Our setup is INVERTED: the package's `globals.css` scans the apps. This works if the paths are correct, but it's unconventional. The cleaner refactor is to move scanning to the consumer's `globals.css` and let the package's CSS only contain tokens + its own internal scanning. Out of scope for a quick fix.

## Gotcha 4 (separate) — consumer's `globals.css` MUST start with `@import "tailwindcss"`

The consumer's `apps/web/src/app/globals.css` must do `@import "tailwindcss"` BEFORE `@import "@workspace/ui/globals.css"`. Otherwise the package subpath CSS import silently fails to resolve in dev mode.

```css
/* apps/web/src/app/globals.css — CORRECT */
@import "tailwindcss";
@import "@workspace/ui/globals.css";

@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

This is a separate gotcha (already covered in [[feedback-tailwind-v4-monorepo-source]]). Build masks it; dev breaks.

## How to apply

- For the design-system package: see [[reference-tailwind-v4]] for v4 mechanics; [[reference-shadcn]] for shadcn conventions.
- For new consumer apps: copy `apps/template/apps/web/src/app/globals.css` as a template — has gotchas 1-4 handled correctly.
- For new component files in the package: see [[feedback-react-peer-dep-shadcn-package]] — must declare React as peer dep.
- See [[feedback-shadcn-monorepo-setup]] for the broader package setup workflow.

**References:**
- [Tailwind v4 — Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files) — official `@source` semantics + `source()` function
- [shadcn-ui/ui#6878 — Tailwind 4 classes missing when using shadcn from monorepo](https://github.com/shadcn-ui/ui/issues/6878) — original issue, the order fix
- [shadcn-ui/ui#7821 — Incorrect `@source` paths in monorepo globals.css template](https://github.com/shadcn-ui/ui/issues/7821) — **STILL OPEN** upstream, our exact off-by-one bug
- [shadcn-ui/ui#6724 — feat: use tailwindcss v4 in monorepo example](https://github.com/shadcn-ui/ui/pull/6724) — the merged PR with the recommended pattern
- [torbensko.com — Fixing Tailwind Culling in Monorepos](https://torbensko.com/blog/fixing-tailwind-culling-in-monorepos/) — practical guide with reasoning on why the app should own CSS generation
- [tailwindlabs/tailwindcss#17904 — utility classes not generated in monorepo](https://github.com/tailwindlabs/tailwindcss/issues/17904)
- [tailwindlabs/tailwindcss#13136 — v4 automatic content detection in monorepos](https://github.com/tailwindlabs/tailwindcss/issues/13136)

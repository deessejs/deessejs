---
name: project-monorepo-strategy
description: DeesseJS monorepo architecture — nested workspace inside apps/template/ holds the product sold to buyers, root apps/web is the external marketing site, shadcn monorepo integration confirmed 2026-06-24
metadata:
  type: project
---

# Monorepo strategy

The repo is a **two-tier monorepo**:

- **Root (`complete-template/`)** = the operator's development surface. Holds `apps/web` (the external marketing site, deessejs.com), `apps/cloud` (variant), the `DESIGN.md` spec, `documents/`, `scripts/`.
- **`apps/template/`** = a **nested pnpm workspace** = the actual product sold to buyers. Contains `apps/web` (the template's demo app), `apps/cli`, `apps/docs`, and `packages/*` (the modular feature packages: `auth`, `ai`, `database`, `mail`, `storage`, `ui`, etc.).

**Why:** Buyer-side modularity. When a buyer purchases the template, they get `apps/template/` as a single artifact. The packages (`@deessejs/ui`, `@deessejs/auth`, etc.) are designed to be removable (the "modular by default" principle from [[project-deessejs-product]]). The root is for the operator only.

## Shadcn monorepo integration (shipped 2026-06-24)

`@deessejs/ui` lives at `apps/template/packages/ui/`. The CLI was run from inside `apps/template/` so it auto-set the workspace aliases.

- Tailwind v4 source directives (`@source`) live INSIDE `packages/ui/src/styles/globals.css` with paths relative to that file (4 ups reaches `apps/template/`, 2 ups reaches `packages/ui/src/`).
- `@deessejs/ui/globals.css` is the single source of truth for color/typography/radius tokens.
- Consumer (`apps/template/apps/web/src/app/globals.css`) just re-imports and adds `--font-sans: var(--font-geist-sans)` + `--font-mono: var(--font-geist-mono)` for the typography utilities.
- Geist fonts loaded via `next/font/google` in the consumer's `layout.tsx` with variables `--font-geist-sans` and `--font-geist-mono` (NOT `--font-sans` — name mismatch with the rest of the spec is a known wart).

## Known spec deviations (still open as of 2026-06-24)

1. **`next-themes` is in the stack** — `apps/template/apps/web/src/components/theme-provider.tsx` wraps the tree with `NextThemesProvider`. **DESIGN.md §1 principle #6 forbids this** ("CSS variables only. No JavaScript theme manager. No `next-themes`. The `data-mode` attribute is set in HTML; CSS does the rest."). The provider's docstring even mentions "per-tenant branding — feature 10.5 of DeesseJS" — but [[project-deessejs-product]] says **"No per-tenant theming — user decided 2026-06-22"**. Conflict to resolve.
2. **Token drift** — `apps/template/packages/ui/src/styles/globals.css` still ships shadcn defaults:
   - `--radius: 0.625rem` (10px) vs spec `0.75rem` (12px)
   - shadcn's calculated `radius-sm` through `radius-4xl` scale vs spec's Geist three-tier (sm / default / lg / full)
   - No `text-heading-*`, `text-label-*`, `text-copy-*`, `text-button-*` role-based typography utilities
   - Two-layer focus ring (`0 0 0 2px var(--background), 0 0 0 4px var(--ring)`) not in CSS
3. **Root `apps/web` is broken** — `apps/web/src/app/globals.css` imports `@workspace/ui/globals.css` which doesn't exist at root. The external marketing site cannot build. **Critical — blocks any production deploy.**
4. **v0.1 inventory incomplete** — only `Button` is in `apps/template/packages/ui/src/components/ui/`. The other 4 primitives (Dialog, Input, Label, Select) live one level up at `components/` (wrong path for the shadcn convention). Missing: Card, Textarea, Field, DropdownMenu, Popover, Tooltip, Sonner, Checkbox, Switch, Separator, Accordion, Badge, InteractiveFiletree.
5. **`apps/demo` and `apps/docs`** at root are empty folders — unclear intent.
6. **Untracked `temp/`** directory at root — clutter.

## How to apply

- When recommending design changes, remember: the **buyer-facing artifact is `apps/template/`**, not the root. Token changes must land in `apps/template/packages/ui/src/styles/globals.css`, not at root.
- The root `apps/web` is a separate marketing site and needs its own fix (either hoist the UI package, or rename/redirect the imports).
- Before recommending a fix to the token system, verify against DESIGN.md §2 (tokens), §4 (components), §6 (voice) — the spec is the source of truth.
- For the buyer-side removal story ("modular by default"), the primitive inventory must be complete and documented in DESIGN.md §7. Today it's not.
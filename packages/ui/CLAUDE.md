# `@workspace/ui` — shadcn/ui in a monorepo (deep dive)

> The design system package for the DeesseJS monorepo. Lives at the root, consumed by `apps/web`, `apps/cloud`, and any future app. The single source of truth for the tokens, primitives, and theme engine described in `../../DESIGN.md` at the repo root.
>
> **This file is the operational guide.** DESIGN.md is the *spec* (what the system should be). This file is the *mechanics* (how the spec is actually implemented and how to extend it without breaking things).

---

## 1. What shadcn/ui actually is

**shadcn/ui is not a library. It is a registry of copy-pasteable components.**

When you run `pnpm dlx shadcn@latest add button`, the CLI:

1. Fetches the source code of the `Button` component from the shadcn registry (a Git repo).
2. **Copies the source into your project** at the path you configured (here, `src/components/ui/button.tsx`).
3. Installs the runtime dependencies it needs (e.g. `@radix-ui/react-slot`, `class-variance-authority`).
4. Wires up the Tailwind classes so they resolve.

After the install, **the component is yours**. You can edit `button.tsx` directly. It is not in `node_modules`. There is no `shadcn` import statement at runtime — the package is dev-only (used by the CLI for future adds).

**Why this matters for a monorepo:**

- You can **customize every primitive** without forking a library or dealing with `node_modules` patches.
- The "API" is the file structure, not a published interface.
- The CLI works on **one package** at a time, so in a monorepo you point it at the design-system package and consume from there.
- When the design system changes, every consumer in the monorepo picks up the change via pnpm symlinks — no `npm publish`, no version juggling.

The trade-off: **you own the upgrade path.** shadcn updates a primitive in the registry? You have to re-run `shadcn add` (or manually diff and merge) to pick up the change. There is no `npm update shadcn`. This is intentional — it forces deliberate upgrades instead of silent breaking changes.

---

## 2. The package layout

```
packages/ui/
├── components.json              ← shadcn CLI config (where to install new primitives)
├── package.json                 ← name: @workspace/ui, exports subpaths
├── postcss.config.mjs           ← Tailwind v4 PostCSS plugin
├── tsconfig.json                ← extends ../../tsconfig.base.json
├── src/
│   ├── components/
│   │   └── ui/                  ← ALL shadcn primitives live here
│   │       ├── button.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── select.tsx
│   ├── lib/
│   │   └── utils.ts             ← cn() helper (clsx + tailwind-merge)
│   └── styles/
│       └── globals.css          ← tokens: colors, radius, typography, dark mode
└── CLAUDE.md                    ← (this file)
```

**The two-level component folder is non-negotiable.** `components/ui/` is for shadcn primitives (CLI-owned, don't freely edit). `components/` (one level up) is reserved for **custom** components that you build on top of primitives. The shadcn registry expects this layout — re-running `add` will land files in `components/ui/`, not anywhere else.

The current 5 primitives cover the minimum surface for `apps/web` to render. The full v0.1 inventory per `../../DESIGN.md` §7 is **16 primitives + 1 custom** (InteractiveFiletree). The remaining 11 + the custom are not yet shipped — see `DESIGN.md` for the complete list and §5 below for how to add them.

---

## 3. `package.json` — the contract

```json
{
  "name": "@workspace/ui",
  "exports": {
    "./globals.css":   "./src/styles/globals.css",
    "./postcss.config": "./postcss.config.mjs",
    "./components/*":  "./src/components/*.tsx",
    "./components/ui/*": "./src/components/ui/*.tsx",
    "./lib/*":         "./src/lib/*.ts",
    "./hooks/*":       "./src/hooks/*.ts"
  },
  "imports": {
    "#components/*":   "./src/components/*.tsx",
    "#lib/*":          "./src/lib/*.ts",
    "#hooks/*":         "./src/hooks/*.ts"
  }
}
```

**Two fields, two purposes:**

- **`exports`** is the **public** API. It defines what consumers in other packages (e.g. `apps/web`) can import. The glob `*` matches one level deep — so `./components/ui/*` matches `src/components/ui/button.tsx` but `./components/*` does **not** (one level only). That's why we have two separate entries: one for the eventual custom components in `components/`, one for the primitives in `components/ui/`.
- **`imports`** is the **package-internal** API. It lets files inside the package import each other without going through the package name (which would create circular name-dependency at the package level). Use `#lib/utils` to import `cn()` from anywhere inside the package.

**Why not just use relative imports for internal use?** Both work. We standardize on `#lib/*` because:

1. It survives file moves (relative imports break when you `mv` a file up or down a directory).
2. It's symmetric with how external consumers import from the package (e.g. `@workspace/ui/lib/utils` vs `#lib/utils`).
3. The pattern is enforced by `components.json` and the shadcn CLI — newly added primitives will use `#lib/utils` by default.

**Why `name: "@workspace/ui"` and not `@deessejs/ui`?** The root `apps/web/package.json` already declares `"@workspace/ui": "workspace:*"`. pnpm resolves `workspace:*` to whichever local package has the matching name in the workspace. Using `@workspace/ui` is the conventional name for the root design-system package in a pnpm monorepo (and what `npx shadcn@latest init --monorepo` would have created). The nested workspace in `apps/template/packages/ui/` uses `@deessejs/ui` instead because it is the **buyer-facing artifact** and gets a branded name when sold.

---

## 4. `components.json` — the shaddn CLI config

```json
{
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@workspace/ui/components",
    "utils":      "@workspace/ui/lib/utils",
    "hooks":      "@workspace/ui/hooks",
    "lib":        "@workspace/ui/lib",
    "ui":         "@workspace/ui/components/ui"
  }
}
```

**`style: "base-nova"`** — the current shadcn aesthetic variant. Uses `@base-ui/react/*` primitives (the new unstyled component library from the Radix team after they rebranded), 7 button sizes, and Geist-aligned spacing. This is the "modern" shadcn. Other styles in the registry (`default`, `new-york`) use the older Radix-based primitives. Don't change `style` after install — the resulting primitives won't match what the rest of the app expects.

**`aliases`** — when the CLI adds a new primitive, it reads these to know:

1. Where to put the new file (`ui` alias → `src/components/ui/<name>.tsx`).
2. How the new file should import `cn` (`utils` alias → `@workspace/ui/lib/utils`).
3. The hook / lib / components paths for any cross-imports.

**Important:** the `ui` alias path is `@workspace/ui/components/ui`, **not** `@workspace/ui/components`. This is what makes the CLI install primitives in the right subfolder. If you accidentally point `ui` at `@workspace/ui/components` (one level up), the CLI will install primitives flat in `components/` and you'll be back to the drift this package was set up to avoid.

---

## 5. Tailwind v4 — the scanner and `@source`

This is the part that breaks silently and confuses everyone the first time.

Tailwind v4 does **not** read `tailwind.config.js` (there isn't one). Instead, it scans your project for class names at build time. The scanner looks at:

1. Files matched by `@import "tailwindcss"` and its own defaults.
2. Files you explicitly point it at via `@source` directives in your CSS.

**The `@source` directives in `globals.css` (lines 8-18) are the single most important thing in this package.** If they are wrong, **the build succeeds but your page renders unstyled** — the class names exist in your components, but Tailwind never generated the CSS for them.

Current state:

```css
/* Paths are RELATIVE TO THIS FILE (packages/ui/src/styles/globals.css).
   - 3 ups reaches the monorepo root (apps/web, apps/cloud, …)
   - 2 ups reaches packages/ui/src/ (scans the package's components + lib)
   - 1 up reaches packages/ui/ (scans the package's other files) */
@source "../../../apps/**/*.{ts,tsx}";  /* scan all consumer apps */
@source "../**/*.{ts,tsx}";              /* scan packages/ui itself */
@source "../../**/*.{ts,tsx}";            /* scan packages/ui/src (redundant but explicit) */
```

**The relative path trap.** If you `mv` this file to a different depth, **the `@source` paths break silently**. The build will still succeed; classes used in `apps/web/page.tsx` will just not be generated. Always verify the depth comment at the top of `globals.css` if you suspect a styling regression. A quick sanity check:

```bash
# From packages/ui/src/styles/globals.css, count the levels:
cd packages/ui/src/styles
# `../`      = packages/ui/src/styles/  (this file)
# `../../`   = packages/ui/src/
# `../../../` = packages/ui/             (1 up from the package root)
# `../../../../` = monorepo root         (3 ups from this file → apps/, packages/)
```

So the "apps" scan is 4 dots, not 3. If you ever move the file again, recount.

**Why two near-identical `@source` lines (`../**` and `../../**`)?** Belt and suspenders. `../**` covers `packages/ui/` (one level up from `src/`). `../../**` covers `packages/ui/src/` (scanning the same files but via a different relative path). They overlap but resolve to similar coverage. The `../**` line is the one that actually catches the new primitives in `components/ui/`. Keep both — they cost nothing.

---

## 6. `@theme inline` — the token system

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... */
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
  --font-sans: var(--font-sans);
}
```

**Two layers, separated by indirection:**

1. **Semantic tokens** (`:root { --background: oklch(...); }` and `.dark { --background: ...; }`) — the actual color values. Light and dark themes redefine the **same names** with different `oklch()` values. This is the Geist pattern: identical token names, different values per theme.
2. **`@theme inline` mappings** (`--color-background: var(--background)`) — translates the CSS variables into Tailwind utility classes (`bg-background`, `text-foreground`, etc.). The `inline` keyword tells Tailwind to use the value as-is, not wrap it in `var(--background)` again.

**Why `oklch()`?** Display P3 wide-gamut color. sRGB-only browsers will round to the nearest sRGB equivalent. Modern browsers (post-2023) get the full gamut. This is the future-proof choice and matches what Linear, Raycast, and Vercel ship.

**The `--font-sans` indirection** in `@theme inline` points to `var(--font-sans)`, which is **not defined in this file**. It's defined by the consumer (e.g. `apps/web/src/app/layout.tsx`) via `next/font/google`:

```tsx
const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
// ...
<html className={cn("antialiased", geistSans.variable)}>
```

This bridges the design-system layer to the consumer's font choice. The UI package doesn't know — and shouldn't know — which font is being used. If a consumer passes `--font-serif`, all components inherit it. The `font-sans` Tailwind utility then resolves to whatever the consumer provided.

**Known drift from `DESIGN.md` §2.6:** the spec calls for a **three-tier** radius scale (`--radius-sm 6px / --radius 12px / --radius-lg 16px`). The actual code uses shadcn's calculated scale (`sm * 0.6`, `md * 0.8`, `lg`, `xl * 1.4`, ...). Same for `--radius: 0.625rem` (10px) where the spec says `0.75rem` (12px). **Reconcile in a dedicated token-migration pass** before claiming the design system is complete. Until then, every primitive renders with shadcn's defaults, not the Geist-aligned values the spec describes.

---

## 7. The `cn()` helper

`src/lib/utils.ts` is six lines:

```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**`clsx`** concatenates class names conditionally. `cn("foo", isActive && "bar", { baz: true })` → `"foo bar baz"`.

**`twMerge`** resolves Tailwind class conflicts. `cn("px-4 px-8")` → `"px-8"` (the latter wins). Without it, conditional rendering of conflicting utilities produces undefined CSS specificity.

**Every primitive uses `cn()` for its className composition.** It is the universal shadcn pattern. When you write a new primitive, import `cn` from `#lib/utils` and pipe your CVA variants through it.

---

## 8. Adding a new primitive

To add, e.g., a `Card` component:

```bash
# Run from anywhere — the CLI reads components.json to know the target package
cd packages/ui
pnpm dlx shadcn@latest add card
```

The CLI will:

1. Read `components.json` to find the `ui` alias.
2. Fetch the `Card` source from the registry.
3. Drop it at `src/components/ui/card.tsx` (because `ui` alias = `@workspace/ui/components/ui`).
4. Install any missing runtime deps (e.g. it would need nothing for Card, but most primitives need at least one).
5. Use the `cn` import from the `utils` alias.

**After the install, do the following:**

1. **Read the generated file.** shadcn primitives are intentionally minimal — they often need adjusting to match the rest of the design system. For Card, you may need to swap the default background from `bg-card` to a value that respects the rest of the design.
2. **Verify dark mode works.** The card should use semantic tokens (`bg-card`, `text-card-foreground`) so the `.dark` block of `globals.css` flips it automatically. If the primitive hard-codes a color, fix it.
3. **Test the focus ring.** Every interactive primitive needs the two-layer focus ring from `DESIGN.md` §4.1: `box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring)`. The current `button.tsx` uses `focus-visible:ring-1 focus-visible:ring-ring` (shadcn default, single 1px ring). Reconcile to spec.
4. **Update the inventory.** Add the new primitive to `DESIGN.md` §7.
5. **Verify the scanner picks it up.** Run `pnpm build` in `apps/web` and confirm the new component renders with all classes applied. If a class is missing, check the `@source` directives in `globals.css`.

**The "no half-built features" principle** (DESIGN.md §1 principle #5) means: **don't add a primitive you won't fully use.** If the new primitive is the only one of its kind, you'll never get the variation in props, states, and edge cases right. Wait until you have a real consumer in `apps/web` that needs it.

---

## 9. Consuming the package

From `apps/web` (or any consumer):

```tsx
// app/layout.tsx
import "@workspace/ui/globals.css"   // tokens — must be imported once, near the top

// app/page.tsx
import { Button } from "@workspace/ui/components/ui/button"
import { Input }  from "@workspace/ui/components/ui/input"
import { cn }     from "@workspace/ui/lib/utils"
```

**The Geist font bridge** must be set up in the consumer's `layout.tsx`:

```tsx
import { Geist, Geist_Mono } from "next/font/google"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] })

export default function RootLayout({ children }) {
  return (
    <html className={cn("antialiased", geistSans.variable, geistMono.variable)}>
      <body>{children}</body>
    </html>
  )
}
```

The variables are picked up by `@theme inline { --font-sans: var(--font-sans) }` in `globals.css`. If you skip the `className` assignment on `<html>`, the fonts will load but the CSS variables won't be set, and `font-sans` will fall back to the browser default.

**The PostCSS config** is exported from the package (`./postcss.config`) and consumed by Next.js automatically. The consumer's `postcss.config.mjs` (if any) must re-export the package's config to keep the Tailwind v4 PostCSS plugin loaded.

---

## 10. Base UI vs Radix — what we're actually shipping

shadcn v4 (the `style: "base-nova"` variant) uses **Base UI** (`@base-ui/react/*`) as the unstyled primitive layer. This is the successor library to Radix UI from the same team, rebranded after the WorkOS acquisition. The migration is in progress; some shadcn primitives still use Radix (`@radix-ui/react-slot` for `asChild` support, for example).

**For consumers, this is invisible.** The exports are the same; the API surface is the same. What differs:

- **Base UI primitives** are imported as named components: `import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"`.
- **Radix primitives** are imported as compound parts: `import * as DialogPrimitive from "@radix-ui/react-dialog"`.

Our `dialog.tsx` uses the Base UI form. Our `button.tsx` uses Base UI's `Button` primitive plus `@radix-ui/react-slot` for the `asChild` pattern (Base UI doesn't have a Slot equivalent yet). This mixed approach is normal for shadcn v4 and will converge as Base UI ships more compound primitives.

**Don't hand-roll a primitive using just Radix or just Base UI directly** — that's what the registry is for. Use `shadcn add` to pull the canonical version.

---

## 11. Common pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Wrong `@source` depth | Build succeeds, page renders unstyled | Recount the relative paths from `globals.css` to the consumer apps |
| `imports` field doesn't have the alias you need | TS error "Cannot find module" | Add the alias to `package.json` `imports` (subpath imports must be declared) |
| Wildcard export `./components/**/*` | Some bundlers (older Next.js) reject it | Use specific patterns like `./components/*` (one level) — never `**` |
| `@import "shadcn/tailwind.css"` placed after `@theme` | Variables resolve to nothing | `@import "shadcn/tailwind.css"` must come BEFORE `@theme` and any other `@import` directives (this is a known shadcn pitfall, see lines 3-6 of `globals.css`) |
| `data-slot` attribute missing | Parent component selectors (e.g. `has-data-[slot=...]`) don't match | Every primitive must emit `data-slot="<name>"` on its root element |
| Forgetting `use client` directive | Server tries to call client hooks (Base UI, React state) → build error | Add `"use client"` at the top of any file using `useState`, event handlers, or Base UI's interactive primitives |
| Renaming a primitive without updating the exports | Consumers' imports break | Add the new name to `components.json` aliases, regenerate the entry in `package.json` exports if needed |
| `node_modules` in the package | Bloats git, pnpm complains | Delete `node_modules/` from the package; pnpm hoists shared deps at the workspace root |
| Running `shadcn add` from the wrong directory | CLI installs at the wrong path | Always run from `packages/ui/` or set the `cwd` flag. The CLI reads `components.json` from CWD. |

---

## 12. The relationship with `DESIGN.md`

`DESIGN.md` (at the repo root) is the **design spec** — what the system should be. This `CLAUDE.md` is the **operational guide** — how the spec is actually implemented. The two MUST stay in sync. When you:

- Add a primitive → update `DESIGN.md` §7 (inventory)
- Change a token → update `DESIGN.md` §2
- Change a focus-ring pattern → update `DESIGN.md` §4.1
- Change voice/copy rules → update `DESIGN.md` §6
- Change the add/delete primitive workflow → update `DESIGN.md` §8 / §9

If a design decision lives only in code, **it's a bug** — bring it back to `DESIGN.md`. The spec is the contract; the code is the implementation.

**Current drift to reconcile** (none of these are blocking but all are spec violations):

1. `--radius: 0.625rem` (10px) → spec says `0.75rem` (12px)
2. shadcn calculated `radius-*` scale → spec says three-tier (`sm 6px / default 12px / lg 16px / full pills`)
3. `focus-visible:ring-1` → spec says two-layer (`0 0 0 2px var(--background), 0 0 0 4px var(--ring)`)
4. No `text-heading-*` / `text-label-*` / `text-copy-*` / `text-button-*` utilities → spec §2.5
5. `next-themes` in the stack → spec §1 principle #6 forbids it (decision: keep, but spec needs updating)
6. v0.1 inventory incomplete → only 5 of 17 primitives shipped

Each of these is a separate task. None are part of the package's structural correctness — the package **works** as-is for `apps/web` to consume the 5 shipped primitives. Reconciliation is a separate design-quality pass.

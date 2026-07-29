# Tailwind CSS v4.0.0 — January 22, 2025

> The first stable release of the v4 line. A ground-up rewrite of the
> framework focused on performance, modern CSS, and a simplified
> developer experience.
>
> **Sources:** Official Tailwind CSS v4.0 blog post
> (<https://tailwindcss.com/blog/tailwindcss-v4>), GitHub release
> `v4.0.0` tag, and the official v3 → v4 upgrade guide.

---

## Headline features

- **New high-performance engine.** Full builds up to **5× faster**,
  incremental rebuilds **over 100× faster** (measured in microseconds on
  the Tailwind team’s own projects).
  | Build type | v3.4 | v4.0 | Improvement |
  | --- | --- | --- | --- |
  | Full build | 378 ms | 100 ms | 3.78× |
  | Incremental rebuild (new CSS) | 44 ms | 5 ms | 8.8× |
  | Incremental rebuild (no new CSS) | 35 ms | 192 µs | 182× |
- **Designed for the modern web.** Native cascade layers,
  `@property`-registered custom properties, `color-mix()`, and logical
  properties all under the hood.
- **Simplified installation.** One line of CSS, no config required, no
  external plugins needed.
- **First-party Vite plugin.** `@tailwindcss/vite` replaces the PostCSS
  plugin for Vite users and is even faster.
- **Automatic content detection.** No more `content` arrays — Tailwind
  discovers your template files automatically (respecting `.gitignore`
  and binary extensions). Add sources explicitly with `@source`.
- **Built-in `@import` support.** No need for `postcss-import`. Lightning
  CSS is used for vendor prefixing and modern syntax transforms.
- **CSS-first configuration.** All customization now lives in CSS via the
  `@theme` directive. The old `tailwind.config.js` is no longer required.
- **CSS theme variables.** All design tokens are exposed as native CSS
  custom properties (e.g. `--color-blue-500`) so they can be consumed at
  runtime in stylesheets and JavaScript.
- **Dynamic utility values and variants.** `grid-cols-15` works out of the
  box; arbitrary data attribute selectors like `data-current:opacity-100`
  work without configuration; spacing utilities are derived from a single
  `--spacing` variable and accept any value.
- **Modernized P3 color palette.** Default colors migrated from `rgb` to
  `oklch` for a wider gamut and more vivid tones.
- **Container queries in core.** `@container`, `@sm:`, `@lg:`,
  `@min-*`, `@max-*`, and stacked ranges — no `@tailwindcss/container-queries`
  plugin needed anymore.
- **New 3D transform utilities.** `rotate-x-*`, `rotate-y-*`, `scale-z-*`,
  `translate-z-*`, `perspective-*`, `transform-3d`.
- **Expanded gradient APIs.** Linear gradient angles (`bg-linear-45`),
  interpolation modifiers (`bg-linear-to-r/oklch`), conic and radial
  gradients (`bg-conic-*`, `bg-radial-*`).
- **`@starting-style` support.** A `starting:` variant for enter/exit
  transitions powered by the new CSS `@starting-style` feature.
- **`not-*` variant.** Native CSS `:not()` pseudo-class; also works to
  negate media and `@supports` queries.

## New utilities and variants

- `inset-shadow-*` and `inset-ring-*` (stack up to four shadow layers).
- `field-sizing-*` utilities (auto-resize textareas).
- `color-scheme-*` utilities (light/dark scrollbars).
- `font-stretch-*` utilities (variable font widths).
- `inert:` variant (style `inert` elements).
- `nth-*` variants (positional pseudo-classes).
- `in-*` variant (like `group-*` without the `group` class).
- `popover-open:` support via the existing `open:` variant.
- `descendant:` variant for styling all descendants.

## Removed & renamed

- `@tailwind base; @tailwind components; @tailwind utilities;` →
  `@import "tailwindcss";`.
- Deprecated utilities removed: `bg-opacity-*`, `text-opacity-*`,
  `border-opacity-*`, `divide-opacity-*`, `ring-opacity-*`,
  `placeholder-opacity-*`, `flex-shrink-*` (→ `shrink-*`), `flex-grow-*`
  (→ `grow-*`), `overflow-ellipsis` (→ `text-ellipsis`),
  `decoration-slice`/`-clone` (→ `box-decoration-*`).
- Renamed scale steps: `shadow-sm` → `shadow-xs`, `shadow` → `shadow-sm`,
  same shift for `drop-shadow-*`, `blur-*`, `backdrop-blur-*`,
  `rounded-*`.
- `outline-none` → `outline-hidden`; new `outline-none` actually sets
  `outline-style: none`.
- `ring` width changed from 3px to 1px; use `ring-3` for the old default.

## Installation

```bash
npm install tailwindcss @tailwindcss/postcss
```

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

```css
/* your CSS */
@import "tailwindcss";
```

Vite:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

## Reference

- v4.0 announcement — <https://tailwindcss.com/blog/tailwindcss-v4>
- v4.0 release notes — <https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.0.0>
- Upgrade guide — <https://tailwindcss.com/docs/upgrade-guide>
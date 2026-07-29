# Tailwind CSS v4.1 — April 1, 2025

> Headline: **Text shadows, masks, and tons more.** Plus significantly
> improved fallbacks for older browsers (Safari 15+).
>
> **Sources:** Official Tailwind CSS v4.1 blog post
> (<https://tailwindcss.com/blog/tailwindcss-v4-1>) and the GitHub
> CHANGELOG entries for `4.1.0` through `4.1.18`.

---

## Headline additions

- **`text-shadow-*` utilities** — five default sizes from `text-shadow-2xs`
  to `text-shadow-lg`, color variants (`text-shadow-cyan-300`),
  opacity modifiers (`text-shadow-lg/50`).
- **`mask-*` utilities** — image and gradient masking with a composable,
  side-oriented API (`mask-t-from-50%`, `mask-radial-from-80%`, etc.)
  that combines cleanly with linear, radial, and conic gradients.
- **Improved browser fallbacks** — `oklab` colors, `@property`-dependent
  features (shadows, transforms, gradients), and opacity modifiers now
  degrade gracefully in older Safari and Firefox.
- **`overflow-wrap` utilities** — `wrap-break-word`, `wrap-anywhere`,
  `wrap-normal`. Especially useful inside flex containers.
- **Colored `drop-shadow-*`** — `drop-shadow-indigo-500`,
  `drop-shadow-cyan-500/50`.
- **`pointer-*` and `any-pointer-*` variants** — target touch vs. precise
  pointing devices (`pointer-fine`, `pointer-coarse`, `any-pointer-fine`,
  etc.).
- **`items-baseline-last` and `self-baseline-last`** — align to the last
  line of text in flex/grid layouts.
- **Safe alignment utilities** — `justify-center-safe`,
  `items-center-safe`, etc. Fall back to `start` when content would
  otherwise overflow in both directions.
- **`@source not "…"`** — explicitly ignore directories when scanning.
- **`@source inline("…")`** — safelist utilities (brace-expansion syntax
  supported). Equivalent to v3’s `safelist` config option.
- **More variants** — `details-content`, `inverted-colors`, `noscript`,
  `user-valid`, `user-invalid`.
- **`bg-{position,size}-*`** — arbitrary background position/size utilities.
- **Shadow opacity modifiers** — `shadow-*/<alpha>`, `inset-shadow-*/<alpha>`,
  `drop-shadow-*/<alpha>`, `text-shadow-*/<alpha>`.

## Behavior changes

- `node_modules/` is now ignored by default (override via `@source`).
- `@source` rules pointing into `node_modules/` no longer respect
  `.gitignore`.
- Deprecated `bg-{left,right}-{top,bottom}` and
  `object-{left,right}-{top,bottom}` in favor of
  `bg-{top,bottom}-{left,right}` and `object-{top,bottom}-{left,right}`.

## Patch releases (4.1.x)

| Version | Date | Highlights |
| --- | --- | --- |
| **4.1.18** | 2025-12-11 | Source-map writes correctly under CLI `--watch`; more robust Rails/JS class extraction; `import.meta.resolve` support in configs. |
| **4.1.13** | 2025-09-03 | `aria`/`data`/`supports` theme keys now migrate to `@custom-variant` via the upgrade tool. |
| **4.1.11** | 2025-06-26 | Vite 7 support in `@tailwindcss/vite`. |
| **4.1.5**  | 2025-04-30 | `h-lh` / `min-h-lh` / `max-h-lh` utilities; `transition` now covers `display`, `visibility`, `content-visibility`, `overlay`, `pointer-events` for `@starting-style` ergonomics. Ignores `.hg`, `.svn`, `.venv`, `__pycache__`, `.svelte-kit`, `.turbo`, `.next`, `.parcel-cache` folders by default. |
| **4.1.4**  | 2025-04-14 | Experimental `@tailwindcss/oxide-wasm32-wasi` target for browser environments (StackBlitz). |
| **4.1.0**  | 2025-04-01 | Initial v4.1 release. |

## Upgrade

```bash
# Tailwind CLI
npm install tailwindcss@latest @tailwindcss/cli@latest

# Vite
npm install tailwindcss@latest @tailwindcss/vite@latest

# PostCSS
npm install tailwindcss@latest @tailwindcss/postcss@latest
```

## Reference

- v4.1 announcement — <https://tailwindcss.com/blog/tailwindcss-v4-1>
- GitHub releases — <https://github.com/tailwindlabs/tailwindcss/releases>
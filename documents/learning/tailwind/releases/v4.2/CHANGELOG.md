# Tailwind CSS v4.2 — February 18, 2026

> Headline: **Logical-property utilities, the Webpack plugin, and new
> neutral color palettes.** Logical properties replace `start-*` /
> `end-*`, which are now deprecated.
>
> **Sources:** GitHub CHANGELOG entries for `4.2.0` through `4.2.4`.

---

## Headline additions

- **`@tailwindcss/webpack` package** — first-class Webpack/Rspack plugin.
- **Mauve, olive, mist, and taupe palettes** added to the default theme.
- **Logical property utilities** — `pbs-*`, `pbe-*`, `mbs-*`, `mbe-*`,
  `scroll-pbs-*`, `scroll-pbe-*`, `scroll-mbs-*`, `scroll-mbe-*`,
  `border-bs-*`, `border-be-*`.
- **Inline / block sizing utilities** — `inline-*`, `min-inline-*`,
  `max-inline-*`, `block-*`, `min-block-*`, `max-block-*`.
- **Logical inset utilities** — `inset-s-*`, `inset-e-*`, `inset-bs-*`,
  `inset-be-*`.
- **`font-features-*`** — `font-feature-settings` utilities.
- **`start-*` / `end-*` deprecated** in favor of `inset-s-*` / `inset-e-*`.

## Patch releases (4.2.x)

| Version | Date | Highlights |
| --- | --- | --- |
| **4.2.4** | 2026-04-21 | Vite alias resolution fixed in `@tailwindcss/vite`. |
| **4.2.3** | 2026-04-20 | Canonicalization improvements: `border-{t,r,b,l}-*` collapses into `border-*` / `border-{x,y}-*`; `scroll-m/p{t,r,b,l}-*` collapses into shorthand; `overflow-ellipsis` → `text-ellipsis` migration; `start-*`/`end-*` → `inset-s-*`/`inset-e-*` migration; `-left-[9rem]` → `left-[-9rem]`; `tracking-*` canonicalization. `.env` and `.env.*` added to default ignored content files. |
| **4.2.2** | 2026-03-18 | Vite 8 support; tsconfig path resolution for `@import '@/path/to/file';`; canonicalization robustness fixes. |
| **4.2.1** | 2026-02-23 | Trailing dash allowed in functional utility names; proper `.` character handling inside MDX curly braces. |
| **4.2.0** | 2026-02-18 | Initial v4.2 release. |

## Reference

- GitHub releases — <https://github.com/tailwindlabs/tailwindcss/releases>
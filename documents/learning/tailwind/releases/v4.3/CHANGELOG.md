# Tailwind CSS v4.3 — May 8, 2026

> Headline: **Container sizing, scrollbar utilities, zoom & tab utilities,
> and improved `@variant`.**
>
> **Sources:** GitHub CHANGELOG entries for `4.3.0` and `4.3.1`.

---

## Headline additions

- **`@container-size` utility**.
- **`scrollbar-*` utilities** — `scrollbar-{auto,thin,none}`,
  `scrollbar-thumb-*` / `scrollbar-track-*` color utilities, and
  `scrollbar-gutter-*`.
- **`zoom-*` utilities**.
- **`tab-*` utilities**.
- **`@variant` with stacked and compound variants** — e.g.
  `@variant hover:focus { … }`, `@variant hover, focus { … }`.
- **`--default(…)` inside `--value(…)` / `--modifier(…)`** for functional
  `@utility` definitions.

## Patch releases (4.3.x)

| Version | Date | Highlights |
| --- | --- | --- |
| **4.3.1** | 2026-06-12 | `--silent` option added to `@tailwindcss/cli` to suppress output. Spacing utilities now emit `0` / `var(--spacing)` instead of `calc(var(--spacing) * 0|1)` for cleaner output. Numerous Vite, Webpack, CLI, scanner, and canonicalization fixes (see upstream CHANGELOG for the full list). |
| **4.3.0** | 2026-05-08 | Initial v4.3 release. |

## Reference

- GitHub releases — <https://github.com/tailwindlabs/tailwindcss/releases>
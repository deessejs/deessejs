# Tailwind CSS v4 + shadcn/ui

## Decision

**Tailwind CSS v4** for utility-first styling. **shadcn/ui** (latest, with the `new-york` style) for accessible component primitives — copied into the project, not installed as a dependency.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

This stack is used by every Next.js app in the repo. The buyer receives Tailwind + shadcn in their extracted template. Our internal apps use the same setup (with potentially different component selections).

## Tailwind CSS v4

### What we use

- **v4 specifically** for the CSS-first config (`@theme inline` directives) and the CSS variable-based theming.
- **Utility classes** for all styling. No `styled-components`, no CSS Modules, no CSS-in-JS.
- **Design tokens** as CSS variables in `app/globals.css`. Themable per tenant (see feature 10.5).
- **Tailwind breakpoints** for responsive design (per feature 10.21).

### Why v4 (not v3)

- CSS-first config replaces the JavaScript `tailwind.config.js`. Cleaner, fewer files, easier to theme.
- Native CSS variables instead of runtime JS evaluation. Faster build, simpler debugging.
- Better DX for custom design tokens via `@theme inline`.
- Active development. v3 is in maintenance.

### Alternatives considered

| Alternative | Why not |
|---|---|
| **Plain CSS modules** | No utility classes, slower to write, no design system enforcement. |
| **vanilla-extract** | Type-safe CSS-in-JS, but heavier setup and weaker ecosystem. |
| **Panda CSS** | Modern, but smaller ecosystem than Tailwind. |
| **Styled-components / Emotion** | Runtime cost, harder to theme per tenant. |

## shadcn/ui

### What we use

- **`new-york` style** (the modern style; `default` is deprecated).
- **`neutral` base color** — changeable only at init time.
- **CSS variables enabled** for theming.
- **Official `@shadcn` registry** + an internal `@acme` registry (future).
- **Radix UI primitives** under the hood (accessibility).
- **`lucide-react`** for icons.

### Why shadcn (not Material UI, Chakra, Mantine)

| Alternative | Why not |
|---|---|
| **Material UI** | Heavy bundle, opinionated Google design, hard to customize per tenant. |
| **Chakra UI** | Strong DX but its design language shows. |
| **Mantine** | Strong DX, good components, but a heavier runtime dependency. |
| **Radix Primitives alone** | We'd reinvent the styling layer. |
| **Headless UI** | Less coverage than Radix for our needs. |

shadcn wins because:

- **Copy-paste, not dependency.** The buyer owns the code. No version lock-in, no surprise breaking changes from an upstream.
- **Customizable to 100%.** The buyer can rewrite any component without forking a library.
- **Per-tenant theming works.** Design tokens via CSS variables are exactly what feature 10.5 requires.
- **Accessible by default.** Radix primitives give us WAI-ARIA support out of the box.

### The five shadcn principles we follow

1. **Open Code.** Copy components in, own the code.
2. **Composition.** Components compose, not extend.
3. **Distribution.** Registry-based installation.
4. **Beautiful Defaults.** Polished out of the box.
5. **AI-Ready.** Components are simple, well-structured, easy for AI tools to read and modify.

## Per-tenant theming (feature 10.5)

Design tokens live as CSS variables in `app/globals.css`. At request time, the org's theme values are injected:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  /* ... */
}

[data-theme="org-acme"] {
  --primary: oklch(0.5 0.2 240);  /* Acme's brand blue */
}
```

The layout reads the org's theme from the tenant context and sets `data-theme` on the `<html>` element. Components don't change — only the variables do.

## Accessibility (feature 10.20, 23.10)

- All shadcn components pass axe-core by default (Radix's accessibility baseline).
- Our CI runs axe-core on every page (feature 23.10).
- Keyboard navigation tested manually for custom components.

## Cross-references

- [`../03-web-app/`](../03-web-app/) — the web app's internal architecture, including theming.
- [`../10-decisions/`](../10-decisions/) — the ADR for the per-tenant branding decision (when written).
- [`../../product/features/10-ui.md`](../../product/features/10-ui.md) — the UI feature inventory.
- [`../../product/features/18-security-and-compliance.md`](../../product/features/18-security-and-compliance.md) — accessibility as part of compliance.
- [`../../product/learning/shadcn`](../../product/learning/shadcn) — internal learning notes (if applicable).

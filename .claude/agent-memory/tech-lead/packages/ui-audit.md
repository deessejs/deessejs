---
name: packages-ui-audit
description: Corrections to packages/ui audit findings after web verification — what was right, what was wrong
metadata:
  type: project
---

# packages/ui audit — corrections after web verification

## Things I got WRONG

### `bg-blend-color` typo — NOT a typo

`bg-blend-color` is a real Tailwind CSS utility class that maps to `background-blend-mode: color`.
It is NOT `mix-blend-color`. It exists in Tailwind v4.
However, it is dead code on AvatarBadge (no background image to blend) — not a bug but unnecessary.

### `lucide-react: "^1.22.0"` — NOT wrong

lucide-react jumped from 0.x to 1.x. Version 1.22.0 (Jun 28 2026) is the latest, not a mistake.
Peer deps: `^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0`.

### `next-themes: ^0.4.6` — NOT wrong

v0.4.6 (Mar 11 2025) is the latest release. No version issue.

### Sidebar cookie write — unlikely to be a hydration issue

`document.cookie` is in `setOpen` (useCallback body), triggered on user interaction, not on render.
Not a hydration problem. Would need to read the file to confirm it's not in a `useEffect` that runs on mount.

## Things I got RIGHT

### peerDependencies missing react/react-dom — confirmed

Component library best practice: React must be peerDependencies, never dependencies.
Source: designdev.io "How to Build a Component Library with Proper Versioning" (2026).

### shadcn CLI in dependencies — likely wrong

`shadcn` is a CLI tool, not a runtime library. Even if `globals.css` imports its CSS, that's a CSS import not a JS import.
Should be devDependencies or peerDependencies.

### `next-themes` in dependencies but not used in the package — valid finding

The package has no ThemeProvider component. `next-themes` is a dead dependency unless a ThemeProvider is added.

### `APP_CONFIG` in packages/ui/lib/config.ts — valid category mistake

App-level config (APP_NAME, APP_URL, login, signup, settings) does not belong in a UI library.
Should be in apps/web or a separate packages/config package.

## Verified via web (fresh CLI)

- `fresh fetch npmx.dev/package/lucide-react/v/1.22.0` — confirmed 1.22.0 is latest
- `fresh fetch tailscan.com/tailwind/effects/bg-blend-color` — confirmed class exists
- `fresh fetch designdev.io/how-to-build-a-component-library-with-proper-versioning` — peerDeps confirmed best practice
- `fresh fetch pacocoursey/next-themes` — confirmed v0.4.6 is latest

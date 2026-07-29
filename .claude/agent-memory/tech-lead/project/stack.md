---
name: stack
description: pnpm monorepo (11 + catalogs strict) + Next.js + Tailwind v4 + turbo + CI stack on this repo
metadata:
  type: project
---

# Stack — pnpm monorepo + Tailwind v4 (2026-07-01 →)

## Package manager

- **packageManager**: `pnpm@11.0.0`
- **Structure**: `apps/web`, `apps/app`, `packages/ui`, `packages/auth`, `packages/database`, `packages/eslint-config`, `packages/typescript-config`
- **Lockfile**: `pnpm-lock.yaml` (~280KB, 640 packages)
- **turbo.json**: v2.x with `tasks` field

## Config pnpm

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
allowBuilds:
  - esbuild
  - sharp
```

```ini
# .npmrc
shamefully-hoist=false
public-hoist-pattern[]=
```

**allowBuilds gotcha**: values MUST be the package name (or boolean `true`), not placeholder text. Any tool or linter that rewrites `allowBuilds` must keep the package names exact; otherwise pnpm install fails with `ERR_PNPM_IGNORED_BUILDS`. pnpm 11 requires explicit allowBuilds for packages with postinstall (esbuild, sharp).

## Catalogs (centralized versions)

```yaml
# pnpm-workspace.yaml
catalog:
  react: 19.2.4
  react-dom: 19.2.4
  typescript: ^5.9.3
  "@types/node": ^20
  "@types/react": ^19
  "@types/react-dom": ^19
  "@tailwindcss/postcss": ^4
  "@turbo/gen": ^2.10.1
```

Plus `catalogMode: strict` — bare versions in sub-packages are forbidden, must use `catalog:` reference.

## Erreurs courantes évitées

1. **pnpm 11 requires explicit `allowBuilds`** for packages with postinstall (esbuild, sharp).
2. **turbo binary** doesn't work in native bash on this Windows machine — use `npx turbo` or `pnpm exec turbo`.
3. **Config packages** (`eslint-config`, `typescript-config`) have no scripts — turbo skips gracefully.

## CI GitHub Actions

`.github/workflows/ci.yml`: lint → typecheck → build → test in parallel.

## CODEOWNERS

`.github/CODEOWNERS`: ownership per directory.

## Tailwind v4

- `@import "tailwindcss"` + CSS-based config (`@theme inline`, `@custom-variant dark`)
- For shared globals.css at `packages/ui/src/styles/globals.css` that covers both apps:
  - `@source "../../../apps/**/*.{ts,tsx}"` to scan apps for class usage
- `tailwindcss: "^4"` in devDeps is optional when using `@tailwindcss/postcss`
- Sidebar CSS vars (`--sidebar-*`) already defined in `packages/ui/src/styles/globals.css`

## Prochaines étapes

- Remote cache (Vercel): `npx turbo login && npx turbo link`
- Changesets — N/A (template repo, see [[template-strategy]])

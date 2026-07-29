# @workspace/docs

Documentation site for the SaaS Template, built with [Fumadocs](https://fumadocs.dev) on Next.js.

## Role in the monorepo

- Hosts the user-facing documentation (Markdown / MDX)
- Lives alongside `@workspace/app` (the product) and `@workspace/web` (the marketing site)
- Sources shared UI primitives from `@workspace/ui`
- Follows the same `lint` / `format` / `typecheck` / `build` conventions as the other apps

## Quick start

From the repo root:

```bash
pnpm install
pnpm --filter @workspace/docs dev
```

The dev server runs on `http://localhost:3000` by default. If another app is already using that port, Next.js will pick the next free one automatically.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm --filter @workspace/docs dev` | Start the dev server with HMR |
| `pnpm --filter @workspace/docs build` | Production build |
| `pnpm --filter @workspace/docs start` | Run the production build |
| `pnpm --filter @workspace/docs lint` | ESLint (extends `eslint-config-next`) |
| `pnpm --filter @workspace/docs format` | Prettier on TS/TSX/MDX |
| `pnpm --filter @workspace/docs typecheck` | Regenerate MDX types, then `tsc --noEmit` |

## Authoring content

Content lives in [`content/docs/`](./content/docs). Each `.mdx` file becomes a page; the frontmatter schema is enforced by `source.config.ts`.

```bash
content/docs/
└── getting-started.mdx
```

## Conventions

- All shared dependencies (`next`, `react`, `react-dom`, `tailwindcss`, `@types/*`) come from the workspace `catalog:` — update `pnpm-workspace.yaml` rather than this file.
- PostCSS config is re-exported from `@workspace/ui/postcss.config` to stay in sync with the other apps.
- This app uses the Next.js **App Router** — `pages/` is intentionally not used.
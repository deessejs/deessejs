# DeesseJS

The organizational hub for DeesseJS — the "Apple of SaaS templates."

## What this repo is

This monorepo contains the public-facing surfaces for the DeesseJS product family:

- **`apps/web`** — The marketing site. Hero, pricing, blog, changelog, and the templates gallery.
- **`apps/app`** — The DeesseJS Cloud per-tenant shell. The SaaS that hosts your template instance as a service.
- **`apps/docs`** — Documentation site (Fumadocs).
- **`packages/ui`** — The shared design system (`@workspace/ui`). shadcn/ui v4 with Tailwind v4 and Base UI primitives.

## The product family

DeesseJS is more than this repo. The full picture lives across several repositories:

| Repository | What it is |
|---|---|
| **[deessejs/deessejs](https://github.com/deessejs/deessejs)** | You are here. Marketing, Cloud, and design system. |
| **[deessejs/template-starter](https://github.com/deessejs/template-starter)** | The main buyer template. Auth, billing, DB, mail, AI primitives — everything you need to ship. |
| **[deessejs/template-lite](https://github.com/deessejs/template-lite)** | A lightweight mini-template for side projects and MVPs. |
| **[deessejs/deesse](https://github.com/deessejs/deesse)** | The `deesse init` CLI scaffolder. `npx @deessejs/cli init my-app --template starter`. |

## Getting started

```bash
# Install dependencies
pnpm install

# Start all apps in parallel
pnpm dev

# Or start one app
pnpm --filter @deessejs/web dev
pnpm --filter @deessejs/app dev
```

## Documentation

- [Architecture overview](./documents/internal/architecture/00-system-overview/)
- [Product brief](./documents/internal/product/)
- [Design system](./packages/ui/CLAUDE.md)
- [Marketing site guide](./apps/web/CLAUDE.md)

## License

MIT — see [LICENSE](./LICENSE) for details.

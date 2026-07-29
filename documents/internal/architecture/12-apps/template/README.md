# `apps/template` — the buyer-facing product

The DeesseJS template proper. What a buyer clones when they buy DeesseJS. Lives at the root of the monorepo as `apps/template/` and contains its own nested pnpm workspace (`apps/template/pnpm-workspace.yaml`).

> **What it is.** `apps/template` is one of N `apps/*` siblings (alongside `apps/cloud`, `apps/demo`, `apps/docs`, `apps/lite`, `apps/web`). Each `apps/*` is a DeesseJS instance — see [ADR 0012](../../10-decisions/0012-template-as-pattern.md). The template is the one buyers ship; the others are internal surfaces (marketing site, docs, demo, cloud hosting, OSS subset).

## What lives inside

```
apps/template/
├── apps/                          # the apps that compose the template product
│   ├── web/                       # the main Next.js app (buyer dashboard + landing + auth UI)
│   ├── cli/                       # the CLI (buyer tooling, scaffold / generate / migrate)
│   ├── docs/                      # the in-product docs site
│   └── email-preview/             # the mail preview app (M1+)
├── packages/                      # the shared libraries
│   ├── api/                       # the Hono + oRPC API surface
│   ├── auth/                      # Better Auth config + RBAC
│   ├── database/                  # Drizzle ORM + schema + transactions
│   ├── cache/                     # Upstash Redis factory + key conventions
│   ├── mail/                      # React Email + Resend transport (M1+)
│   ├── storage/                   # S3-compatible storage (M2+)
│   ├── notifications/             # in-app notification system (M2+)
│   ├── i18n/                      # i18n messages + locale routing (M2+)
│   ├── logs/                      # structured logging (M2+)
│   ├── admin/                     # super-admin UI components (M3+)
│   ├── ai/                        # Vercel AI SDK integration (M3+)
│   ├── sdk/                       # the auto-generated client SDK (M2+)
│   ├── ui/                        # shared design system (Tailwind + shadcn)
│   └── utils/                     # shared utility functions
├── package.json                   # workspace root, name "@deessejs/template-root"
├── pnpm-workspace.yaml            # the nested workspace
├── tsconfig.base.json             # shared TS config
└── pnpm-lock.yaml
```

## Audience

| Role | What they touch |
|---|---|
| **Buyer** (the customer who clones the template) | Every file. The whole thing ships in their repo. |
| **Buyer's end users** | `apps/web` (the deployed app), `apps/cli` (if they install the CLI), `apps/docs` (the in-product docs). They never see `packages/*`. |
| **DeesseJS core team** | Maintains the whole tree. The "what gets shipped" view is this folder. |

## Surface (what ships)

- **One repo, one `pnpm install`.** The buyer clones, runs `pnpm install`, gets the whole workspace.
- **Deploy target**: Vercel, single project, `apps/web` as the entry point. The other apps (`cli`, `docs`, `email-preview`) are siblings and can be deployed independently when ready.
- **Runtime**: Node.js (per [`../11-packages/api/decisions/0001-node-runtime-not-edge.md`](../11-packages/api/decisions/0001-node-runtime-not-edge.md)). No Edge runtime anywhere.

## Conventions specific to this app

- **Nested pnpm workspace.** `apps/template/` is itself a workspace — it has its own `pnpm-workspace.yaml`. This is intentional: it lets the buyer extract `apps/template/` to a standalone repo without surgery.
- **No root-level Turbo yet.** Build orchestration happens via pnpm workspace + (in progress) `turbo.json`. See the M0 deferred work in each package's local docs.
- **The dependency direction is strict**: `apps/* → packages/*`, never the reverse. Enforced by ESLint `no-restricted-imports` at the package boundary.

## Deploy

- **Primary**: `apps/web` → Vercel → `deessejs.com` (or the buyer's domain).
- **CLI** (`apps/cli`): distributed as a single-file binary (see [ADR 0002](../../10-decisions/0002-cli-runtime-and-distribution.md)).
- **Docs** (`apps/docs`): bundled inside `apps/web` at `/docs` OR a separate Vercel project. Decision deferred.
- **Email preview** (`apps/email-preview`): bundled inside `apps/web` at `/email-preview` for M1. See [`../email-preview/hosting.md`](../email-preview/hosting.md) for the M2 standalone deploy.

## Cross-references

### System concerns

- [`../../03-web-app/`](../../03-web-app/) — `apps/web` architecture
- [`../../04-api-surface/`](../../04-api-surface/) — the API exposed by `packages/api`
- [`../../05-modular-contract/`](../../05-modular-contract/) — the modular contract this app enforces
- [`../../07-deployment/`](../../07-deployment/) — the Vercel deploy topology
- [`../../08-testing/`](../../08-testing/) — the test strategy

### System ADRs

- [ADR 0011](../../10-decisions/0011-repo-structure.md) — `apps/` + `packages/` + `documents/` contract (superseded)
- [ADR 0012](../../10-decisions/0012-template-as-pattern.md) — current repo structure (canonical)

### Local apps

- [`../email-preview/`](../email-preview/) — the M1 mail preview app
- `apps/web/` — see [`../../03-web-app/`](../../03-web-app/) (the main Next.js app, not yet documented as a per-app doc)

### Local packages

- [`../../11-packages/api/`](../../11-packages/api/) — the Hono + oRPC pipeline
- [`../../11-packages/auth/`](../../11-packages/auth/) — Better Auth
- [`../../11-packages/database/`](../../11-packages/database/) — Drizzle
- [`../../11-packages/cache/`](../../11-packages/cache/) — Redis factory
- [`../../11-packages/mail/`](../../11-packages/mail/) — React Email + Resend (M1+)

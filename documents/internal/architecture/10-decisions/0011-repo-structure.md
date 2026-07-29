# 0011. Repo structure: monorepo with `apps/`, `packages/`, `documents/`

- **Status:** Superseded by 0012
- **Date:** 2026-06-17
- **Deciders:** founder, tech lead

> **Note (2026-06-17):** This ADR proposed a single root `packages/` shared across all apps. The refined structure — where each app is its own instance of the template with its own internal `packages/`, and the root `packages/` is meta-tooling only — is captured in [`0012-template-as-pattern.md`](./0012-template-as-pattern.md). Read that instead.

## Context and problem statement

We are building two distinct products that share infrastructure, brand, and code:

1. **The template** — a Next.js codebase that buyers clone and deploy in their own infra. The product we sell.
2. **Our web presence** — the site that sells the template (`deessejs.com`), the buyer dashboard, the public demo, the marketing pages. The product we use to sell.

These two products have different lifecycles (the template is SemVer, our web app is continuous deploy), different audiences (the template goes to developers, our web app goes to visitors and buyers), and different deploy targets (the template goes to a buyer's infra, our web app goes to Vercel under our account).

We also have three post-v1 products that need a home: `demo` (public demo of the template), `lite` (OSS subset for top-of-funnel SEO), `cloud` (managed hosting of the template per tenant).

The question: how do we structure the single git repo that holds all of this, so that:

- We can develop template + web app + demo side by side without coupling?
- The buyer receives a clean template-only repo (not the whole monorepo)?
- Shared code (UI components, design tokens, SDK, CLI) lives in one place?
- Brand consistency is automatic (not "remember to copy the logo to the new app")?
- The dogfooding claim ("our own seller app is built on DeesseJS") is literally true?

## Considered options

1. **Monorepo with `apps/` + `packages/` + extraction.** One repo, pnpm workspaces, Turborepo. The template ships via an extraction script (`scripts/extract-template/`) that produces a separate public repo. We dogfood our own template in `apps/web/`.

2. **Multi-repo strict.** Separate repos for template, web app, demo, and shared packages. Each has its own CI, its own versioning, its own changelog. Shared packages are published to a private npm registry.

3. **Single repo, no structure.** Everything at the root, no `apps/` or `packages/` separation. Both products live at the same level.

4. **Monorepo but no extraction.** The buyer clones the monorepo and gets everything, with a "delete what you don't need" instruction for the non-template parts.

## Decision

**Option 1.** Monorepo with `apps/` + `packages/` + extraction. The buyer never sees the monorepo — they receive a clean template-only repo produced by `scripts/extract-template/`.

## The structure (locked)

```
deessejs/                                  repo root
│
├── apps/
│   ├── template/                          THE PRODUCT — what buyers clone
│   ├── web/                               OUR WEB PRESENCE — deessejs.com
│   ├── demo/                              PUBLIC DEMO — demo.deessejs.com
│   ├── lite/                              OSS SUBSET (post-v1)
│   └── cloud/                             MANAGED HOSTING (post-v1)
│
├── packages/                              shared code
│   ├── ui/                                shadcn + design tokens + theming
│   ├── brand/                             palette, fonts, voice rules, logo
│   ├── sdk/                               auto-generated SDK for template's API
│   ├── cli/                               user-facing CLI (gh/vercel-style)
│   ├── docs-config/                       shared Fumadocs config
│   └── tsconfig/                          shared TypeScript configs
│
├── documents/                             docs — NEVER shipped
│   └── internal/                          architecture/, product/, process/, marketing/
│
├── scripts/
│   └── extract-template/                  monorepo → public template repo
│
├── tools/                                 internal tooling (CI helpers, etc.)
├── .github/workflows/                     one CI matrix per app
├── package.json                           workspaces root
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Contracts

### `apps/` contract

Each app is a self-contained, independently deployable unit. Each app:

- Has its own `package.json` with name `@deessejs/<app-name>`.
- Has its own tests, its own CI job, its own deploy target.
- Depends on `packages/*` via workspace references (`workspace:*`).
- Can be removed without affecting the others (the extraction script is the only code that touches multiple apps).

### Naming

Apps are named by surface or product, not by function. `template`, `web`, `demo`, `lite`, `cloud`. This naming is durable across pivots in what each app does.

### `apps/web` scope (the `/web` decision)

`apps/web` is everything that serves `deessejs.com/*` and its buyer/admin subdomains. Specifically:

- Marketing public (landing, pricing, comparison, FAQ, blog).
- Buyer auth (sign-in, sign-up).
- Checkout (Stripe).
- Buyer dashboard (post-purchase: downloads, licenses, invoices).
- Admin for the founder (sales metrics, refunds, support tickets).

`apps/web` does NOT contain:

- The public demo (that's `apps/demo/`, at `demo.deessejs.com`).
- The Cloud operator dashboard (that's `apps/cloud/`, post-v1, at `operators.deessejs.com`).
- Internal services (analytics, email senders) — these are tools or third-party services.
- The template itself.

**The rule:** a feature in `/web` serves a visitor of `deessejs.com` or a buyer post-purchase. If it serves a buyer of DeesseJS *as a user of the template they bought*, it lives in `apps/template/`.

### `packages/` contract

Each package is a shared library, published internally via workspace references. Each package:

- Has its own `package.json` and its own tests.
- Has zero dependencies on `apps/*` (the dependency direction is `apps → packages`, never the reverse).
- Can be extracted and published to npm if needed (e.g. `@deessejs/ui` for the lite repo).

### `documents/internal/` contract

The `documents/internal/` folder is the documentation about the code. It is NEVER shipped, NEVER extracted, NEVER public. It contains `architecture/`, `product/`, `process/`, `marketing/` — the docs we have already created.

### The extraction contract

The buyer receives a clean template-only repo. The extraction script (`scripts/extract-template/`) is the only code that crosses the monorepo/public boundary. It:

1. Copies `apps/template/` to a temporary output directory.
2. Copies the `packages/` the template depends on (`ui`, `sdk`, `cli`, `tsconfig`).
3. Excludes `apps/web/`, `apps/demo/`, `apps/lite/`, `apps/cloud/`, `documents/`, `scripts/`, `tools/`, `.github/`.
4. Replaces workspace dependencies (`"@deessejs/ui": "workspace:*"`) with the published npm versions.
5. Generates a clean `pnpm-lock.yaml`.
6. Builds the docs site.
7. Bundles the result (tarball or push to the public repo).
8. Tags the public repo with the SemVer version.

## Cadence per app

| App | Versioning | When bumped | Deploy target |
|---|---|---|---|
| `apps/template/` | Strict SemVer (v0.0.1 → v1.0.0) | Per [`../../process/release-process.md`](../../process/release-process.md) | npm + GitHub release via extraction |
| `apps/web/` | Continuous (no formal version) | Every merge to `main` | Vercel (deessejs.com) |
| `apps/demo/` | Tracks template version (`vX.Y.Z-demo`) | When template is bumped | Vercel (demo.deessejs.com) |
| `apps/lite/` | SemVer from its own v1.0.0 (post-v1) | When changes ship | Separate public GitHub repo |
| `apps/cloud/` | SemVer from its own v0.1.0 (post-v1) | When changes ship | Vercel Enterprise (operators.deessejs.com) |

## Dogfooding

`apps/web/` is built using DeesseJS itself. This is a deliberate, marketable claim: "we ship our own seller app on DeesseJS." It only works because the template and the web app share the same monorepo. If we ever split into multi-repo, this claim becomes harder to defend.

The cost: every template change ripples to the web app deploy. This is a feature (we feel our own pain) and a risk (template changes can break the web app). Mitigation: the web app's CI runs on every PR, so breakage is caught before merge.

## Consequences

**Positive:**

- The dogfooding claim is literal, not aspirational.
- Brand consistency is automatic (one `packages/brand/`, one `packages/ui/`).
- Cross-cutting changes (e.g. update the logo, update a design token) are atomic PRs.
- The buyer receives a clean repo with zero non-template files.
- The release manager can ship `apps/template/` independently of `apps/web/`.

**Negative:**

- The extraction script is non-trivial work that must be maintained for the life of the project.
- All secrets are in one repo (mitigated by per-app env files and GitHub Actions per-app secrets).
- Cross-app refactors are tempting and can leak coupling (mitigated by the "apps depend on packages, never the reverse" rule).
- The first version of `scripts/extract-template/` will be wrong in ways we discover at the first release.

**Neutral:**

- The repo grows with each app (5 apps today, possibly more).
- The CI matrix gets one job per app plus the extraction job.

**Why we might revisit:**

- If the extraction script becomes a maintenance burden (e.g. we spend more than 1 day per quarter on it), we may reconsider a multi-repo split for the buyer-facing side only.
- If dogfooding causes too much coupling (e.g. web app deploys break too often because of template changes), we may decide to dogfood selectively (use the template for new code in web, but don't refactor existing web code to use template).
- If we add a 6th app that doesn't fit the `surface/product` naming (e.g. an internal admin that isn't buyer-facing), we may need a separate `apps/internal/` category.

## References

- [`../../process/release-process.md`](../../process/release-process.md) — the release process this structure enables.
- [`../../process/role-definitions.md`](../../process/role-definitions.md) — who maintains which app.
- [`0009-...md`](./0009-billing-stripe-direct.md) and the rest of the tech-decision ADRs — the per-tech rationale that flows into `apps/template/` and `packages/`.
- [`../../product/build-roadmap.md`](../../product/build-roadmap.md) — when each app enters the repo (template at v0.0.1, web/demo at v0.8.0, lite/cloud post-v1).
- [`0010-v001-create-next-app-baseline.md`](./0010-v001-create-next-app-baseline.md) — the ratchet start of `apps/template/`.

# 0012. Template-as-pattern: each `apps/*` is a DeesseJS instance

- **Status:** Accepted
- **Date:** 2026-06-17
- **Deciders:** founder, tech lead

## Context and problem statement

We have 6 apps in the repo:

- `apps/template/` — the template we sell (the buyer-facing product)
- `apps/lite/` — a stripped-down OSS instance (post-v1)
- `apps/demo/` — the public demo instance
- `apps/web/` — our seller app (`deessejs.com`)
- `apps/docs/` — our docs site (`deessejs.com/docs`)
- `apps/cloud/` — our Cloud operator admin (post-v1)

The question is **how these 6 apps relate to each other**:

- Do they share code via the root `packages/`?
- Is each app its own codebase with its own packages?
- Does each app use the template as a library (imports from `apps/template/packages/*`)?

The wrong choice leads to either (a) accidental coupling that makes the template hard to evolve, or (b) the dogfooding claim becoming a marketing fiction rather than a literal fact.

ADR 0011 proposed "single root `packages/` shared across all apps." After walking through the design with the founder, we refined: each app is its own **instance of the template** with its own internal `packages/`. The root `packages/` is meta-tooling only (lint config, tsconfig, prettier config).

This ADR captures the refined decision. ADR 0011 is marked Superseded by this one.

## Considered options

1. **Each app is a separate codebase with its own structure.** No shared packages between apps. Highest isolation, lowest reuse.

2. **Each app is an instance of the template (same pattern, different feature selection).** Same internal structure (`apps/<app>/apps/{web,cli}` + `apps/<app>/packages/{...}`), each enables only the packages it needs, no cross-instance imports. (This is the refined decision.)

3. **Each app uses the template as a library.** Imports from `apps/template/packages/*`. Maximizes reuse, but couples every app to the template's release cadence and breaks the "buyer receives a self-contained repo" promise.

## Decision

**Option 2.** Each app is an instance of the template.

The internal structure of every `apps/<name>/` follows the same pattern:

```
apps/<name>/
├── apps/
│   ├── web/                       (the app's web app)
│   └── cli/                       (the app's CLI, if applicable)
└── packages/                      (only the packages this app activates)
    ├── auth/                      (if the app has auth)
    ├── billing/                   (if the app has billing)
    └── ...                        (whatever the app needs)
```

The root `packages/` is **meta-tooling only** — code that helps multiple instances coexist:

- `tsconfig/` — base TypeScript configs extended by each instance
- `eslint-config/` — shared linting rules
- `prettier-config/` — shared formatting

No application code lives at the root `packages/`. No cross-instance imports of `auth`, `billing`, etc.

## Contracts

### Per-instance contract

Every `apps/<name>/` has the same shape. The shape is enforced by the `template-extract-template` script being runnable on any instance, not just `apps/template/`.

- The instance has its own `package.json`, its own `pnpm-lock.yaml`, its own CI job.
- The instance depends on root `packages/{tsconfig,eslint-config,prettier-config}` via workspace references.
- The instance NEVER depends on another instance.
- The instance's `apps/<name>/packages/*` can have custom code that diverges from `apps/template/packages/*`.

### Sub-app contract

Each instance contains one or more **sub-apps** under `apps/<name>/apps/`. The sub-app is the actual deployable unit (the thing that ships to Vercel, gets a URL, has users).

Available sub-app patterns:

- **`web/`** — the instance's web app (Next.js App Router). The most common sub-app. Most instances activate this.
- **`cli/`** — the instance's user-facing CLI (gh/vercel-style). Activated by instances that ship a CLI to end users.
- **`docs/`** — the instance's docs site (Fumadocs). Activated by instances that ship documentation.

Different instances activate different combinations. Examples:

- `apps/template/`: web + cli + docs (the full template; the buyer receives all three)
- `apps/web/` (our seller): web only
- `apps/docs/` (our docs site): docs only
- `apps/demo/`: web only
- `apps/lite/`: web only
- `apps/cloud/`: web only (initially); cli possible later

The docs sub-app pattern is reused at two levels:

- **`apps/docs/`** at the repo root → deployed at `docs.deessejs.com` (our docs about DeesseJS itself).
- **`apps/template/apps/docs/`** inside the template → bundled into the buyer's extracted repo (the docs site the buyer ships for their own product).

**Content separation (locked 2026-06-17):** the two docs are **completely separate** — no shared content, no shared MDX, no shared translations. The root `apps/docs/` is our docs about DeesseJS (positioning, usage, pricing, architecture). `apps/template/apps/docs/` is the docs site the buyer customizes for their own product. The buyer does not receive a copy of "our" docs; they receive an empty Fumadocs instance they fill with docs about their product. Same pattern (Fumadocs + Next.js + MDX), completely separate content.

Same pattern, different content, different deployment target. The modular contract applies: a buyer who doesn't want a docs site deletes `apps/template/apps/docs/` along with its imports.

### Root `packages/` contract

The root `packages/` directory contains **only meta-tooling**. Concretely:

- `tsconfig/` (base TS configs)
- `eslint-config/` (lint rules)
- `prettier-config/` (formatting)

If we ever want to add application code at root (e.g. a shared `analytics` wrapper), we add it as an explicit ADR-reviewed decision. The default is: application code lives in instances.

### Drift contract

Instances can diverge. There is no automatic sync from `apps/template/packages/*` to other instances.

- Each instance is responsible for its own version of each package.
- Changes to `apps/template/packages/*` are not automatically propagated.
- A drift-detection tool (`tools/drift-check.ts`, future) can alert when instances fall behind, but does not force a sync.

The cost of duplication is accepted in exchange for the freedom of divergence.

## The pattern across our apps

| App | Sub-apps | Packages activated | Deployed at |
|---|---|---|---|
| `apps/template/` | web + cli + docs | all 13 (`auth`, `ai`, `api`, `database`, `i18n`, `logs`, `mail`, `notifications`, `sdk`, `storage`, `ui`, `utils`, `admin`) | Sold to buyers (extracted to public repo) |
| `apps/lite/` | web | `auth`, `billing`, `ui`, `utils` (subset for OSS) | Public OSS repo (post-v1) |
| `apps/demo/` | web | `auth`, `billing`, `notifications`, `ui` (one feature highlighted) | `demo.deessejs.com` |
| `apps/web/` | web | `auth`, `billing`, `admin`, `notifications`, `ui`, `utils` (commerce-oriented) | `deessejs.com` (continuous deploy) |
| `apps/docs/` | docs | minimal (just what the Fumadocs site needs) | `docs.deessejs.com` (continuous deploy) |
| `apps/cloud/` | web | `auth`, `admin`, `jobs`, `ui`, `utils` (ops-oriented) | `operators.deessejs.com` (post-v1) |

Each instance is the same template pattern, with a different package selection. The "delete what you don't need" contract applies to every instance uniformly.

**The docs sub-app appears twice in the matrix** — once at root level (`apps/docs/`) for our own docs, once inside the template (`apps/template/apps/docs/`) for the buyer's docs. This is the same code pattern (Fumadocs + Next.js) reused; it is **not** a code import. The buyer gets their own docs site as part of the extracted repo, configured for their own product content.

## The locked tree

```
deessejs/                                  repo root
│
├── apps/                                  every apps/* is a DeesseJS instance
│   │
│   ├── template/                          SOURCE OF TRUTH — what we sell
│   │   ├── apps/
│   │   │   ├── web/                       buyer's web app (ships with template)
│   │   │   ├── cli/                       buyer's CLI (ships with template)
│   │   │   └── docs/                      buyer's docs site (ships with template)
│   │   └── packages/                      all 13 packages
│   │
│   ├── lite/                              Subset OSS (post-v1)
│   │   ├── apps/web/
│   │   └── packages/{auth,billing,ui,utils}
│   │
│   ├── demo/                              Public demo instance
│   │   ├── apps/web/
│   │   └── packages/{auth,billing,notifications,ui}
│   │
│   ├── web/                               Our seller app (deessejs.com)
│   │   ├── apps/web/
│   │   └── packages/{auth,billing,admin,notifications,ui,utils}
│   │
│   ├── docs/                              Our docs site (docs.deessejs.com)
│   │   ├── apps/docs/                     docs sub-app only
│   │   └── packages/{ui,utils}            minimal
│   │
│   └── cloud/                             Cloud operator admin (post-v1)
│       ├── apps/web/
│       └── packages/{auth,admin,jobs,ui,utils}
│
├── packages/                              META-TOOLING only
│   ├── tsconfig/                          base TS configs
│   ├── eslint-config/                     lint rules
│   └── prettier-config/                   formatting
│
├── documents/                             internal docs — NEVER shipped
├── scripts/
│   ├── extract-template/                  apps/template/ → public buyer repo
│   └── extract-instance/                  any apps/<name>/ → its own public repo (for lite, demo, docs-as-standalone)
├── tools/
│   └── drift-check/                       future: alert when instances diverge
├── .github/workflows/                     one CI matrix per instance
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Consequences

**Positive:**

- The dogfooding claim is literal: "DeesseJS uses DeesseJS, multiple times, in production." This is stronger than "we built our seller app on DeesseJS."
- Each instance can diverge freely. Customizing `auth` for the seller app does not affect the buyer-facing template.
- The buyer receives a clean repo: just `apps/template/` + its dependencies, no `apps/web/`, no `apps/docs/`, no `apps/cloud/`.
- The modular contract (delete-what-you-don't-need) applies uniformly to every instance. We can prove the contract works by deleting a package in `apps/template/` and verifying it doesn't break `apps/web/`.
- Each instance has its own release cadence. `apps/web/` deploys continuously, `apps/template/` ships via SemVer, `apps/demo/` follows the template version.

**Negative:**

- Code duplication: `auth` exists in 6 instances. Drift is real. We accept the cost.
- Updating a package requires manual (or scripted) propagation across instances. No automatic sync.
- The first version of the per-instance structure will be wrong in ways we discover at the first extract-instance run.
- `tools/drift-check/` is future work. Until it ships, drift is detected manually.

**Neutral:**

- The root `packages/` is small (3 packages today). It will grow as we add meta-tooling.
- The extraction script needs two modes: `extract-template` (the buyer-facing public repo) and `extract-instance` (for lite, demo, docs-as-standalone, etc. that become separate public repos).
- The docs sub-app pattern appears at two levels (`apps/docs/` at root + `apps/template/apps/docs/` inside the template). Same pattern, different content, different deployment. This is intentional duplication, not a bug.

**Why we might revisit:**

- If drift between instances causes bugs that take > 1 day to debug per quarter, we may move from "alert" to "block" in drift detection.
- If a shared piece of logic is duplicated across 4+ instances and the duplication has bugged 3 times, we may reconsider adding it to root `packages/` (with an ADR).
- If the per-instance structure (apps + packages inside each app) proves too heavy for solo founders (the buyer audience), we may simplify `apps/template/` to a single-app layout while keeping our internal apps on the full pattern.

## References

- [`0011-repo-structure.md`](./0011-repo-structure.md) — the previous version of this decision, now Superseded.
- [`0010-v001-create-next-app-baseline.md`](./0010-v001-create-next-app-baseline.md) — v0.0.1 is single-app; the per-instance pattern lands at v0.0.6.
- [`../../process/release-process.md`](../../process/release-process.md) — the version progression where the per-instance structure lands.
- [`../../product/build-roadmap.md`](../../product/build-roadmap.md) — when each instance enters the repo.
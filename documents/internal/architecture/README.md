# `internal/architecture/` — Technical architecture

## Purpose

This folder is the **internal implementation** documentation for DeesseJS. It is the technical counterpart to the product-facing architecture doc: where `product/architecture.md` explains *what* the buyer gets and *why* the stack is the way it is, this folder explains *how* it is built, *what the contracts are*, and *why each technical choice was made*.

**Audience:** contributors (us, today and in 6 months), reviewers, anyone touching the code. Not for buyers.

## How to read this folder

If you're new to the codebase, follow this order:

1. **[`00-system-overview/`](./00-system-overview/)** — C4 context + container diagrams. The shape of the system in 10 minutes.
2. **[`01-stack/`](./01-stack/)** — the technology matrix and the per-tech rationale. The "why" behind each locked choice.
3. **[`02-data-model/`](./02-data-model/)** — schema, multi-tenancy, migrations. The data layer.
4. **[`03-web-app/`](./03-web-app/)** — the web app's internal architecture: routes, layouts, server/client boundaries, the wizard, theming. How the app is shaped from the inside.
5. **[`04-api-surface/`](./04-api-surface/)** — internal RPC + public REST + generated SDK/CLI. The most novel piece of the system.
6. **[`05-modular-contract/`](./05-modular-contract/)** — the wedge proof. Read this if you read nothing else. Every feature must be deletable, and the test discipline is enforced in CI.
7. **[`06-security/`](./06-security/)** — threat model and security architecture.
8. **[`07-deployment/`](./07-deployment/)** — where everything runs, env vars, CI/CD.
9. **[`08-testing/`](./08-testing/)** — test strategy and the delete-test pipeline.
10. **[`09-operations/`](./09-operations/)** — observability and incident response (with [`runbooks/`](./09-operations/runbooks/) for playbooks).
11. **[`10-decisions/`](./10-decisions/)** — the ADR log. Read the relevant ADRs before suggesting a change.

## Folder map

| Folder | What lives here | Read when |
|---|---|---|
| `00-system-overview/` | C4 context + container diagrams, deployment view | Onboarding, big-picture questions |
| `01-stack/` | One rationale doc per locked technology | Evaluating a swap, onboarding |
| `02-data-model/` | Schema, multi-tenancy, migration rules | Adding a model, reviewing a migration |
| `03-web-app/` | Web app internal architecture: routes, layouts, boundaries, wizard, theming | Touching a page, adding a route, the wizard |
| `04-api-surface/` | oRPC + Hono + OpenAPI + SDK + CLI | Touching an API route, debugging contract drift |
| `05-modular-contract/` | Module structure, delete tests, feature template | Adding a feature, reviewing a module boundary |
| `06-security/` | Threat model, OWASP, secrets, data handling | Touching auth, PII, encryption, retention |
| `07-deployment/` | Vercel/Cloudflare/Railway, env vars, CI/CD | Deploying, adding an env var, debugging CI |
| `08-testing/` | Test strategy, CI matrix, delete-test pipeline | Writing tests, debugging CI, quarantine |
| `09-operations/` | Observability, incident response, on-call | On-call rotation, post-mortems |
| `09-operations/runbooks/` | One playbook per incident type | Something is on fire |
| `10-decisions/` | Architecture Decision Records | Before suggesting a reversal of a past choice |

## Relationship to the product docs

- **`product/README.md`** is the product brief. The wedge, the pricing, the feature pillars.
- **`product/architecture.md`** is the product-facing architecture: rationale for buyers, dependency graph, the modular contract at a high level.
- **`internal/architecture/` (this folder)** is the technical deep-dive: how it's built, what the contracts are, why each choice was made.

When in doubt: the product doc answers "what does the buyer see?"; this folder answers "how do we build it?".

## Conventions

- **English.** All docs in this folder are in English, even when adjacent product docs are in French. Reason: contributor audience.
- **Cross-references over duplication.** When a topic is covered elsewhere (e.g. a feature spec), link to it; don't re-explain.
- **Decisions are immutable; docs are not.** Architecture changes update this folder. Past decisions live in `10-decisions/`.
- **Delete tests are P0.** A red delete test is a P0 bug, not a flaky test. If you see one, drop everything.

## How to contribute

- Adding a feature module: read `05-modular-contract/feature-template.md` first.
- Adding a new technology: write a new file in `01-stack/` and an ADR in `10-decisions/`.
- Adding a new page or route: read `03-web-app/route-structure.md` first.
- Changing an API: update the relevant file in `04-api-surface/` and run the contract tests.
- Reversing a past decision: write a new ADR in `10-decisions/` that supersedes the old one. Do not edit or delete the old ADR.

## Related

- [`../product/architecture.md`](../product/architecture.md) — the product-facing architecture doc.
- [`../product/features/`](../product/features/) — the complete feature inventory (~400 features across 23 surfaces).
- [`../product/build-roadmap.md`](../product/build-roadmap.md) — the v1 build sequence.
- [`../product/open-questions.md`](../product/open-questions.md) — the decisions still pending.

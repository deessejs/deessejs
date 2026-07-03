# `03-web-app/` — Web application architecture

## Purpose

The internal architecture of the **web app itself** — the Next.js application that the buyer's end users interact with. This folder is for application-level concerns that don't fit in any other folder: route structure, layout system, server/client component boundaries, data-fetching strategy, the wizard flow, the marketing-vs-app-vs-admin-vs-docs split, and the i18n readiness at the UI layer.

The framework (Next.js) is documented in [`01-stack/nextjs.md`](../01-stack/nextjs.md). The contracts between modules are in [`05-modular-contract/`](../05-modular-contract/). Where this app runs is in [`07-deployment/`](../07-deployment/). This folder is **how the app is shaped from the inside** — the patterns every page follows and the rules every new feature respects.

## What's in here

- `README.md` (this file) — entry point + surface map.
- `pages.md` — the full page inventory per surface, with M1/M2/M3 priorities, mapped to product features. **Start here for any "add a page" task.**
- `route-structure.md` — the App Router layout: `app/(marketing)`, `app/(app)`, `app/(admin)`, `app/(docs)`, `app/api/...`, route groups, parallel routes, intercepted routes.
- `layouts.md` — the layout system: root layout, marketing layout, app layout, admin layout, docs layout. What wraps what.
- `server-client-boundaries.md` — where we cut between Server Components and Client Components, and why. The default-vs-exception rule.
- `data-fetching.md` — server components, oRPC for client-driven calls, React Query / SWR where it earns its place, the cache strategy per surface.
- `forms.md` — the `react-hook-form` + Zod pattern, server actions, client validation, server validation, error surfacing.
- `state-management.md` — what lives where: server state (oRPC/React Query), URL state, UI state (Zustand where needed), form state.
- `wizard-flow.md` — the onboarding wizard as a special route: parallel routes, step state, persistence, recovery, "skip for power users".
- `auth-flows.md` — page-level auth: sign-in, sign-up, OAuth callback, magic-link landing, the post-auth redirect logic.
- `admin-surface.md` — the org-level admin (RBAC) vs the system admin (operator) — different layouts, different auth, different concerns.
- `templates-library.md` — index doc for the templates library (registry + gallery + deploy + demo buttons). **Start here for any templates-related task.**
- `templates-gallery.md` — the gallery's web app routes (`/templates/*`), filters, data source, ISR, SEO.
- `deploy-button.md` — the `<DeployButton>` component: URL composition, variants, edge cases, tests.
- `demo-button.md` — the `<DemoButton>` component (the friction-free "see it first" sibling of DeployButton).
- `demo-button.md` — the `<DemoButton>` component: the friction-free "see it first" sibling of DeployButton.
- `theming-and-tokens.md` — design tokens, dark mode, per-tenant branding (feature 10.5), the CSS variable contract.
- `error-loading-empty.md` — `error.tsx`, `loading.tsx`, `not-found.tsx`, empty states, the polished-UX discipline.
- `i18n-ui.md` — how the `en`-only architecture stays translatable: routing shape, content files, date/currency formatting, RTL readiness.

## Surface map

The web app is **one Next.js app** but it presents several distinct surfaces to the user. Each has its own layout, its own auth context, and its own design constraints.

| Surface | Audience | Auth | Layout | Key files |
|---|---|---|---|---|
| **Marketing** (`/`) | Public visitors, buyers | None | `app/(marketing)/` | landing, pricing, comparison, demo link |
| **Auth** (`/login`, `/signup`, `/verify`) | Prospects, new users | None (pre-auth) | `app/(auth)/` | wizard entry, OAuth callback, magic link |
| **App** (`/app/*` or `/[orgSlug]/*`) | Buyer's end users (logged-in) | Session | `app/(app)/` | org switcher, feature modules, settings |
| **Admin** (`/admin/*`) | Org admins (RBAC-gated) | Session + role | `app/(app)/admin/` | org settings, members, billing, RBAC editor |
| **System admin** (`/system/*`) | Operator (the buyer's SRE / internal team) | Separate session + MFA | `app/(system)/` | user management, system dashboard, job inspector |
| **Docs** (`/docs/*`) | Buyer's end users + the buyer themselves | Mixed | `app/(docs)/` | Fumadocs site, API reference, "Deleting features" |
| **Blog** (`/blog/*`) | Public | None | `app/(marketing)/blog/` | Fumadocs blog |
| **API explorer** (`/api-explorer`) | Public | API key | `app/(marketing)/api-explorer/` | Scalar / Swagger UI, branded |
| **Templates gallery** (`/templates/*`) | Devs (humans primary, agents as scrapers) | None | `app/(marketing)/templates/` | registry-driven grid + individual template pages with `<DeployButton>` + `<DemoButton>` paired on the hero |

## Conventions

- **Server Components by default.** Opt into Client Components only when you need interactivity, browser APIs, or state. The boundary is enforced in code review.
- **Route groups for layouts, not for paths.** `(app)`, `(marketing)`, etc. are layout boundaries, not URL segments. They never appear in the URL.
- **Every page has loading, error, and not-found states.** Polished UX is a non-negotiable design principle.
- **Forms are typed end-to-end.** Zod schema → react-hook-form → server action / oRPC call → server-side Zod re-validation.
- **State lives where it belongs.** Server state via oRPC, URL state via search params, form state via react-hook-form, UI state via React state (or Zustand only when it crosses components).
- **The wizard is a parallel route, not a URL path.** `?step=<n>` state with persistent progress in the DB. See `wizard-flow.md`.
- **Per-tenant branding is resolved at the layout level** via the org context, never per-component. See `theming-and-tokens.md`.

## Why this folder exists separately

The framework (Next.js) is one layer. The contracts (modular) are another. The deploy target is another. But the **shape of the app** — how the surfaces fit together, how the boundaries are drawn, how the wizard works, how the admin differs from the app — is a coherent concern that doesn't belong in any of those folders. Pulling it together here means:

- A new contributor can see the app's surface map before touching any code.
- A reviewer can point at `server-client-boundaries.md` when a Client Component imports a server-only thing.
- A new wizard step has a spec to follow (`wizard-flow.md`), not folklore.

## Related

- [`01-stack/nextjs.md`](../01-stack/nextjs.md) — the framework.
- [`04-api-surface/`](../04-api-surface/) — the contracts the web app calls.
- [`05-modular-contract/`](../05-modular-contract/) — how feature modules fit into the app.
- [`06-security/`](../06-security/) — auth flows at the security level.
- [`../product/features/10-ui.md`](../../product/features/10-ui.md) — the UI feature inventory.
- [`../product/features/13-onboarding.md`](../../product/features/13-onboarding.md) — the onboarding feature.
- [`../product/features/21-admin-dashboard.md`](../../product/features/21-admin-dashboard.md) — the system admin feature.

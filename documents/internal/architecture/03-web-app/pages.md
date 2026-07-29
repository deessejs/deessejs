# Web app — Page inventory

The full list of pages the `apps/template/apps/web` Next.js app must ship, organized by **route group** (which is also a layout boundary in the App Router — see [`./README.md`](./README.md#surface-map)). Synthesized 2026-06-23 from this folder's surface map, the product features specs (`../product/features/*.md`), and supastarter's `apps/saas` structure (closest reference).

**Current state (2026-06-23)**: only `src/app/{layout,page,globals.css}` + `favicon.ico` + `public/*.svg`. Zero product pages — the create-next-app placeholder + Geist fonts are the only thing in `apps/web`.

## Convention

Next.js route groups `(name)` are **layout boundaries, not URL segments**. `app/(marketing)/pricing/page.tsx` → URL `/pricing`, not `/(marketing)/pricing`. The group names never appear in the URL.

Priority legend:
- **M1** = v1 essentials, must ship for the first buyer deploy.
- **M2** = post-v1, ships once the supporting package lands (billing, mail webhooks, 2FA, docs).
- **M3+** = post-launch, polish, growth.

---

## Surface: Marketing — `app/(marketing)/` — public, no auth

| Page | URL | Priority | Feature |
|---|---|---|---|
| Landing | `/` | **M1** | 16 |
| Pricing | `/pricing` | **M1** | 16 |
| Features | `/features` | M2 | 16 |
| Changelog (public) | `/changelog` | M2 | 16 |
| Blog index (MDX) | `/blog` | M3 | 15 |
| Blog post | `/blog/[slug]` | M3 | 15 |
| Legal — Terms | `/legal/terms` | **M1** | 16 |
| Legal — Privacy | `/legal/privacy` | **M1** | 18 (GDPR) |
| Contact | `/contact` | M3 | 16 |
| API explorer (Scalar) | `/api-explorer` | M2 | 07 |

**Layout**: `app/(marketing)/layout.tsx` — top nav (logo, links, login/signup CTA), footer (legal, social, company).

---

## Surface: Auth — `app/(auth)/` — pre-auth, no session

| Page | URL | Priority | Feature |
|---|---|---|---|
| Sign-in | `/login` | **M1** | 1.1, 1.2 |
| Sign-up | `/signup` | **M1** | 1.1 |
| Forgot password | `/forgot-password` | **M1** | 1.15 |
| Reset password (form) | `/reset-password?token=...` | **M1** | 1.15 |
| Verify email (landing) | `/verify-email?token=...` | **M1** | 1.14 |
| Magic link callback | `/magic-link?token=...` | **M1** | 1.2 |
| OAuth callback | `/auth/callback/[provider]` | **M1** | 1.3, 1.4 |
| 2FA setup + verify | `/2fa` | M2 | 1.8 |
| Passkey setup | `/passkey-setup` | M2 | 1.9 |
| Magic link landing (post-click) | `/magic-link/sent` | M3 | 1.2 (UX) |

**Layout**: `app/(auth)/layout.tsx` — minimal centered card, no nav, just logo + form.

---

## Surface: Onboarding — `app/(app)/onboarding/` — wizard (parallel route)

| Page | URL | Priority | Feature |
|---|---|---|---|
| Wizard entry (auto-redirect) | `/onboarding` | **M1** | 13 |
| Step 1 — Welcome | `/onboarding/welcome` | **M1** | 13 |
| Step 2 — Org name + slug | `/onboarding/org` | **M1** | 13 |
| Step 3 — Invite teammates | `/onboarding/team` | **M1** | 13 |
| Step 4 — Pick plan (Stripe) | `/onboarding/plan` | M2 | 13 |
| Step 5 — Done | `/onboarding/done` | **M1** | 13 |
| Accept invite | `/accept-invite/[token]` | **M1** | 2.x |

**Wizard pattern** (per the system spec): `?step=N` query param + parallel route `@wizard` in the layout + DB-persisted progress. The 4 first M1 steps are sub-routes inside `/onboarding` for now; can be refactored to parallel routes once the team is comfortable with the pattern.

---

## Surface: App — `app/(app)/[orgSlug]/` — session + org context

| Page | URL | Priority | Feature |
|---|---|---|---|
| Org home / dashboard | `/[orgSlug]` | **M1** (placeholder OK) | 10 |
| Settings — général | `/[orgSlug]/settings` | **M1** | 2.x |
| Settings — profile (name, avatar) | `/[orgSlug]/settings/profile` | **M1** | 1.16, 1.17 |
| Settings — security (password, 2FA, passkeys) | `/[orgSlug]/settings/security` | M2 | 1.8, 1.9 |
| Settings — sessions (devices) | `/[orgSlug]/settings/sessions` | M2 | 1.12 |
| Settings — billing | `/[orgSlug]/settings/billing` | M2 | 3.x |
| Settings — personal API keys | `/[orgSlug]/settings/api-keys` | M2 | 1.18 |
| Settings — audit log (personnel) | `/[orgSlug]/settings/audit` | M3 | 1.24 |
| Members list | `/[orgSlug]/members` | **M1** (placeholder OK) | 2.x |
| Invite member | `/[orgSlug]/members/invite` | M2 | 2.x |
| Notifications inbox | `/[orgSlug]/notifications` | M2 | 11 |
| Projects (or business feature) | `/[orgSlug]/projects` | M2+ | produit |
| Project detail | `/[orgSlug]/projects/[id]` | M2+ | produit |
| Webhooks (org) | `/[orgSlug]/webhooks` | M3 | 07 |
| Storage (org files) | `/[orgSlug]/storage` | M2 | 06 |

**Layout**: `app/(app)/[orgSlug]/layout.tsx` — sidebar (org switcher + nav), top bar (user menu, notifications).

---

## Surface: Admin (global) — `app/(app)/admin/` — session + role-gate admin

| Page | URL | Priority | Feature |
|---|---|---|---|
| Admin home (overview) | `/admin` | M2 | 21 |
| Users list (search/filter/paginate) | `/admin/users` | M2 | 21 |
| New user form | `/admin/users/new` | M2 | 21 |
| User detail (profile + memberships) | `/admin/users/[userId]` | M2 | 21 |
| Edit user | `/admin/users/[userId]/edit` | M2 | 21 |
| Set user password | `/admin/users/[userId]/password` | M2 | 21 |
| User sessions (with revoke) | `/admin/users/[userId]/sessions` | M2 | 21 |
| (Impersonation banner lives in `(app)/layout.tsx`, not here) | — | M2 | 21 |

**Layout**: `app/(app)/admin/layout.tsx` — inherits the `(app)` auth gate + `AppHeader`. Adds a **role gate** (`session.user.role === 'admin'`) and an admin sidebar. Non-admins get `notFound()` (not `redirect()`) — the existence of `/admin/*` is hidden from non-operators.

**Scope**: GLOBAL. This admin operates on the `user` table, not on the `member` table. Org-scoped admin (member management, transfer ownership, org settings) lives at `/[orgSlug]/admin/*` when that surface ships in M3+.

**See [`./admin.md`](./admin.md) for the full spec** — route map, role gate, impersonation banner, endpoints → UI mapping, self-protection guard, build order.

---

## Surface: Admin org — `app/(app)/[orgSlug]/admin/` — session + RBAC owner/admin

| Page | URL | Priority | Feature |
|---|---|---|---|
| Admin home | `/[orgSlug]/admin` | **M1** (placeholder OK) | 21 |
| General (name, slug, logo) | `/[orgSlug]/admin/general` | M2 | 2.x |
| Members management | `/[orgSlug]/admin/members` | M2 | 2.x |
| Roles & permissions (RBAC) | `/[orgSlug]/admin/roles` | M3 | 2.x |
| Billing (org-level) | `/[orgSlug]/admin/billing` | M2 | 3.x |
| Audit log (org) | `/[orgSlug]/admin/audit` | M3 | 1.24 |

**Layout**: shares the `(app)` layout + an "admin" sidebar section. RBAC-gated via the `orgContext` middleware in `packages/api`.

---

## Surface: System admin — `app/(system)/` — operator, separate auth + MFA

| Page | URL | Priority | Feature |
|---|---|---|---|
| System home | `/system` | M3 (post-launch) | 21 |
| Global users | `/system/users` | M3 | 21 |
| Global orgs | `/system/orgs` | M3 | 21 |
| Background jobs inspector | `/system/jobs` | M3 (after jobs pkg ships) | 04 |
| Feature flags | `/system/flags` | M3 | 20 |

**Layout**: `app/(system)/layout.tsx` — separated, different navigation, visible "operator access" banner. Different auth middleware than `(app)`.

---

## Surface: Docs — `app/(docs)/` — Fumadocs, mixed public/authed

| Page | URL | Priority | Feature |
|---|---|---|---|
| Docs home | `/docs` | M2 | 14 |
| Doc page | `/docs/[...slug]` | M2 | 14 |
| API reference | `/docs/api` | M2 (auto-gen from oRPC spec) | 07 |
| Changelog (in-app) | `/docs/changelog` | M3 | 14 |
| Search | `/docs/search` | M2 (built-in Fumadocs) | 14 |

---

## Surface: API routes — `app/api/...` — handlers (not pages, but they're siblings in the App Router)

| Mount | URL | Priority | Source |
|---|---|---|---|
| Better Auth | `/api/auth/*` | **M1** (already planned) | `packages/api` |
| Hono catch-all (oRPC RPC) | `/api/[[...route]]` | **M1** (not yet scaffolded) | `packages/api` |
| Public REST (oRPC OpenAPI) | `/api/v1/*` | M2 (already exposed by Hono) | `packages/api` |
| Resend webhook | `/api/resend/webhook` | M2 | `packages/mail` § M0-deferred |
| Stripe webhook | `/api/stripe/webhook` | M2 | billing feature 03 |
| Cron / scheduled | `/api/cron/*` | M3 | jobs feature 04 |

**Critical M1 work NOT yet done**: `/api/[[...route]]/route.ts` doesn't exist — the Hono app from `@deessejs/api` isn't mounted yet. **Pages can't be fully functional until this is wired.** See [`../11-packages/api/hosting.md`](../11-packages/api/hosting.md) for the mount pattern.

---

## Surface: Special / utility

| File | Path | Priority | Note |
|---|---|---|---|
| Global error | `src/app/error.tsx` | **M1** | React error boundary |
| 404 | `src/app/not-found.tsx` | **M1** | Global not-found |
| Root loading | `src/app/loading.tsx` | **M1** | Suspense fallback |
| Sitemap | `src/app/sitemap.ts` | M2 | SEO |
| Robots | `src/app/robots.ts` | M2 | SEO |
| OpenAPI spec | `src/app/api-spec/route.ts` | M2 | External Scalar |

---

## M1 recap — the ~20 pages for v1

| # | Surface | URL | Notes |
|---|---|---|---|
| 1 | Marketing | `/` | Landing |
| 2 | Marketing | `/pricing` | Tiers |
| 3 | Marketing | `/legal/terms` | ToS |
| 4 | Marketing | `/legal/privacy` | Privacy |
| 5 | Auth | `/login` | Email/pwd + magic link + OAuth |
| 6 | Auth | `/signup` | Email/pwd sign-up |
| 7 | Auth | `/forgot-password` | Trigger reset email |
| 8 | Auth | `/reset-password` | New password form |
| 9 | Auth | `/verify-email` | Click confirmation landing |
| 10 | Auth | `/magic-link` | Magic link click landing |
| 11 | Auth | `/auth/callback/[provider]` | OAuth callback |
| 12 | Onboarding | `/onboarding` | Entry, auto-redirect |
| 13 | Onboarding | `/onboarding/welcome` | Step 1 |
| 14 | Onboarding | `/onboarding/org` | Step 2 |
| 15 | Onboarding | `/onboarding/team` | Step 3 |
| 16 | Onboarding | `/onboarding/done` | Step 5 |
| 17 | Onboarding | `/accept-invite/[token]` | Invite accept |
| 18 | App | `/[orgSlug]` | Dashboard (placeholder OK) |
| 19 | App | `/[orgSlug]/settings` | Settings home |
| 20 | App | `/[orgSlug]/settings/profile` | Profile form |
| 21 | App | `/[orgSlug]/members` | Members list (placeholder OK) |
| 22 | App | `/[orgSlug]/admin` | Admin home (placeholder OK) |
| 23 | API | `/api/auth/*` | Better Auth handler (already planned) |
| 24 | API | `/api/[[...route]]` | Hono catch-all (critical path) |
| 25 | Special | `error.tsx` | Error boundary |
| 26 | Special | `not-found.tsx` | 404 |
| 27 | Special | `loading.tsx` | Suspense fallback |

**27 elements total for M1** (24 pages + 3 special files). 3 of the 24 pages are placeholders that prove the routing works before the corresponding feature is implemented.

---

## Open decisions (not yet confirmed)

1. **M1 scope confirmation**: ship the full 27 elements, or a smaller subset (e.g. only auth + onboarding, landing as a single hero)?
2. **Placeholder policy**: are the 3 placeholder pages (`/[orgSlug]`, `members`, `admin`) "Coming soon" stubs, or do we wait for the feature impl?
3. **URL scheme**: `[orgSlug]` (URL = org slug, supastarter pattern) vs `/app/*` with a query param (URL stays clean, org state is in the cookie/session)?
4. **Wizard pattern**: parallel route `@wizard` with `?step=N` (canonical per the spec), or classic `/onboarding/welcome` sub-routes (simpler, easier to reason about for M1)?
5. **One layout per route group**: `(marketing)`, `(auth)`, `(app)`, `(system)`, `(docs)` — confirmed by the surface map in [`./README.md`](./README.md#surface-map).

## Scaffolding order (recommended)

1. **Wire `/api/[[...route]]/route.ts`** first — without this, no page can be functional. See [`../11-packages/api/hosting.md`](../11-packages/api/hosting.md).
2. **Setup the Better Auth client** in `apps/web` (auth-client.ts) — pages need it.
3. **Build layouts in dependency order**: `(auth)` → `(marketing)` → `(app)` (innermost) → `(system)` and `(docs)` last.
4. **Add the M1 pages** in this order: auth → onboarding → app placeholders → marketing → special files.

## Cross-references

- [`./README.md`](./README.md) — surface map (the 1-pager overview)
- [`./admin.md`](./admin.md) — full spec for the `/admin/*` surface (route map, role gate, impersonation banner, endpoints → UI mapping, self-protection guard, build order)
- [`../11-packages/api/hosting.md`](../11-packages/api/hosting.md) — Hono mount in Next.js (critical path)
- [`../11-packages/api/structure.md`](../11-packages/api/structure.md) — the API the web app calls
- [`../11-packages/auth/admin.md`](../11-packages/auth/admin.md) — admin plugin deep dive (endpoints, config, role ambiguity)
- [`../11-packages/auth/impersonation.md`](../11-packages/auth/impersonation.md) — impersonation flow (banner, security)
- [`../11-packages/auth/integrations.md`](../11-packages/auth/integrations.md) — Better Auth wiring
- [`../11-packages/auth/decisions/0002-admin-plugin-config.md`](../11-packages/auth/decisions/0002-admin-plugin-config.md) — admin plugin config ADR
- [`../10-decisions/0015-admin-routes-flat-vs-org-scoped.md`](../10-decisions/0015-admin-routes-flat-vs-org-scoped.md) — `/admin/*` flat layout ADR
- [`../11-packages/mail/`](../11-packages/mail/) — transactional emails
- [`../../product/features/01-auth-and-identity.md`](../../product/features/01-auth-and-identity.md) → `13-onboarding.md` → `21-admin-dashboard.md` — feature specs
- [supastarter Project structure](https://supastarter.dev/docs/nextjs/codebase/structure) — closest reference architecture

## How to update

When a new feature lands, add the new page to its surface table. Bump the priority if needed. Don't restructure the route groups without a discussion — they are the layout boundaries.

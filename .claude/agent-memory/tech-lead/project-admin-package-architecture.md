---
name: admin-package-architecture
description: Decision to implement admin as a self-contained package apps/template/packages/admin/ mounted via a single catch-all route [...slug]/page.tsx, mirroring the packages/api pattern (as of 2026-06-25)
metadata:
  type: project
---

The admin surface (operator console at `/admin/*`) will be implemented as **a self-contained package**, not as routes scattered in `apps/web/src/app/(app)/admin/`. The pattern mirrors `packages/api/`, which is mounted in `apps/web/src/app/api/[[...route]]/route.ts`.

## The pattern

```
apps/template/packages/admin/                      ← NEW PACKAGE
├── src/
│   ├── pages/                                     ← page components (dashboard, users, impersonate)
│   │   ├── dashboard.tsx
│   │   ├── users/
│   │   │   ├── list.tsx
│   │   │   ├── detail.tsx                         ← reads params.id from router
│   │   │   ├── new.tsx
│   │   │   ├── edit.tsx
│   │   │   ├── password.tsx
│   │   │   └── sessions.tsx
│   │   └── impersonate.tsx
│   ├── components/                                ← sidebar, dialogs, stat cards
│   │   ├── admin-shell.tsx
│   │   ├── admin-sidebar.tsx
│   │   ├── user-table.tsx
│   │   ├── user-search-bar.tsx
│   │   ├── ban-dialog.tsx
│   │   ├── impersonate-confirm-dialog.tsx
│   │   └── ...
│   ├── server-actions/                            ← all 13 admin endpoints wrapped as server actions
│   │   ├── user-actions.ts                        ← banUser, unbanUser, setRole, removeUser, createUser, updateUser, setUserPassword
│   │   ├── session-actions.ts                     ← revokeUserSession, revokeUserSessions
│   │   └── impersonation-actions.ts               ← impersonateUserAction, stopImpersonatingAction
│   ├── lib/
│   │   ├── guards.ts                              ← requireAdmin, assertNotSelf
│   │   ├── queries.ts                             ← getUserWithMemberships, listUsersForImpersonation (with last_active JOIN)
│   │   └── pagination.ts
│   ├── router.ts                                  ← matchAdminRoute(slug) → { Component, params }
│   ├── routes.ts                                  ← declarative route table (pattern + component)
│   └── index.ts                                   ← public surface
├── tests/
├── package.json                                   ← name: "@deessejs/admin", depends on auth/database/ui
└── README.md

apps/template/apps/web/src/app/(app)/admin/
├── layout.tsx                                     ← auth + role gate + <AdminShell> from @deessejs/admin
├── page.tsx                                       ← dashboard (optional, may delegate to [...slug] with empty slug)
└── [...slug]/page.tsx                             ← SINGLE FILE — delegates to @deessejs/admin/router
```

**Login flow** stays separate in `apps/web/src/app/(admin-unprotected)/` (pre-gate). The `packages/admin` package does NOT contain login or first-admin-bootstrap pages — those are pre-gate and live in `apps/web`.

## Why this pattern (rationale)

User explicitly chose this on 2026-06-25, after initially proposing a conventional file-based routing. The arguments they made:

1. **Consistency with `packages/api`** — the project already established that complex features live as dedicated packages. Admin has equivalent complexity (13 endpoints, ~10 pages, ~20 components, ~15 server actions). Why would admin be different?

2. **Isolation** — admin can be removed entirely by deleting the package + the route file + the workspace entry. Compare to scattered routes in `apps/web/` which create import cycles and unclear boundaries.

3. **Buyer extensibility** — a buyer who wants a custom admin (e.g., Stripe Dashboard style) replaces `@deessejs/admin` with their own. The catch-all route continues to work.

4. **Tests co-located** — `packages/admin/tests/` matches the pattern of `packages/auth/tests/`, `packages/api/tests/`.

5. **Dependency direction** — `packages/admin` depends on `@deessejs/auth`, `@deessejs/database`, `@deessejs/ui`, `@deessejs/mail`. The reverse is never true.

## Honest tradeoffs (acknowledged)

The pattern is less Next.js-idiomatic. Tradeoffs accepted:

- **No file-based routing** — pages live in `packages/admin/src/pages/`, not `apps/web/src/app/(app)/admin/`. New devs expect file-based routing.
- **`params.slug` is an array** — manual parsing (`slug[0]`, `slug[1]`) vs. named segments (`params.userId`).
- **No per-route `loading.tsx` / `error.tsx` / `not-found.tsx`** — must use layout-level or error boundary in `matchAdminRoute`.
- **No parallel / intercepting routes** — not needed for admin (no modals-on-routes), but a limitation.
- **Next.js devtools** (route overlay) won't recognize sub-routes of the catch-all.

**Verdict:** acceptable for admin (rarely changes, small team, well-documented). Would be a bad pattern for the user-facing app.

## The router matcher

```ts
// packages/admin/src/router.ts
const routes: Route[] = [
  { pattern: [],                              component: DashboardPage },
  { pattern: ['users'],                       component: UsersListPage },
  { pattern: ['users', 'new'],                component: UsersNewPage },
  { pattern: ['users', ':id'],                component: UserDetailPage },
  { pattern: ['users', ':id', 'edit'],        component: UserEditPage },
  { pattern: ['users', ':id', 'password'],    component: UserPasswordPage },
  { pattern: ['users', ':id', 'sessions'],    component: UserSessionsPage },
  { pattern: ['impersonate'],                 component: ImpersonatePage },
]

export function matchAdminRoute(slug: string[]) {
  for (const route of routes) {
    const params = matchPattern(route.pattern, slug)
    if (params) return { Component: route.component, params }
  }
  notFound()
}
```

`matchPattern(['users', ':id'], ['users', 'abc'])` → `{ id: 'abc' }`. Unit-testable.

## Open questions (pending user answers as of 2026-06-25)

1. **Does the catch-all handle `/admin` (dashboard, slug empty)?** Or have a separate `app/(app)/admin/page.tsx` for the dashboard to allow per-route `loading.tsx` / `error.tsx`?
2. **`matchAdminRoute` sync or async?** Sync is simpler. Async allows pre-fetching common data (sidebar counters) in the same call.
3. **Does `packages/admin` have its own `eslint.config.js` + `vitest.config.ts`** (like `packages/api`)? Or share with root?
4. **Direct imports** (`@deessejs/auth`, `@deessejs/database`) **or only via oRPC procedures** for cross-package access? Direct is simpler; oRPC is cleaner architecturally but premature for a self-contained admin package.

## What's still valid from prior analyses

These are NOT invalidated by the architectural decision — they just need reorganization:

- **Dashboard content** (4 counter cards + recent users + system signals + quick actions) — moves to `packages/admin/src/pages/dashboard.tsx` + `components/`.
- **Impersonate picker UX** (search-first, default filter `role=member`, last_active sort, Dialog confirmation) — moves to `packages/admin/src/pages/impersonate.tsx` + `components/impersonate-*`.
- **Admin sidebar** (flat: Overview / Users / Impersonate, impersonation indicator) — moves to `packages/admin/src/components/admin-sidebar.tsx`.
- **Role gate** (`session.user.role === 'admin'`, `notFound()` not redirect) — stays in `app/(app)/admin/layout.tsx` (Next.js idiom).
- **ImpersonationBanner** — stays in `app/(app)/layout.tsx` (must appear on ALL authenticated pages, not just admin).
- **Self-protection guards** (`assertNotSelf`, `assertNotAdmin`) — move to `packages/admin/src/lib/guards.ts`.
- **The 4 questions I asked about the impersonate picker** (destination, pagination, etc.) — still pending user answer.
- **The 8 questions about the dashboard** (sessions live, welcome back, etc.) — still pending user answer.

## References

- [../../documents/internal/architecture/03-web-app/admin.md](../../documents/internal/architecture/03-web-app/admin.md) — updated to reflect the catch-all + package structure
- [../../documents/internal/architecture/11-packages/auth/admin.md](../../documents/internal/architecture/11-packages/auth/admin.md) — the admin plugin deep dive (server-side, not affected by this package decision)
- [../../documents/internal/architecture/11-packages/auth/impersonation.md](../../documents/internal/architecture/11-packages/auth/impersonation.md) — impersonation flow
- [../../documents/internal/architecture/11-packages/api/structure.md](../../documents/internal/architecture/11-packages/api/structure.md) — the precedent package this pattern mirrors
- [[package-implementation-state]] — to be updated with admin package status

**Why:** this is a non-obvious architectural choice (less Next.js-idiomatic than conventional) that will be re-litigated every onboarding without an explicit memory. Future sessions must NOT silently refactor admin back to file-based routing in `apps/web`.

**How to apply:**
- When the user asks about implementing admin, propose this structure. Don't propose scattered routes in `apps/web/src/app/(app)/admin/`.
- When reviewing admin-related PRs, check that pages live in `packages/admin/src/pages/`, not in `apps/web`.
- When the user asks about adding new admin routes, extend the routes table in `packages/admin/src/routes.ts`, don't add new `page.tsx` files in `apps/web`.
- The decision is final unless the user explicitly reverses it.
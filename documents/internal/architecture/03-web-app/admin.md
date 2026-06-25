# Admin surface — `/admin/*`

The full spec for the `/admin/*` operator console. Operators only — gated by `session.user.role === 'admin'`. This is the **global admin panel** (the admin plugin's actual scope), not the org-scoped admin (which lives at `/[orgSlug]/admin/*` when that surface ships in M3+).

> **Architecture note (2026-06-25).** Admin is implemented as a **self-contained package** (`apps/template/packages/admin/`), mounted via a single catch-all route `app/(app)/admin/[...slug]/page.tsx`. This mirrors the `packages/api` pattern (mounted at `app/api/[[...route]]/route.ts`). All pages, components, server actions, and the route matcher live in the package. Only the role gate (Next.js idiom) stays in `apps/web`. See §1.5 below for the rationale.

> **See also.** The companion docs:
> - [`../11-packages/auth/admin.md`](../11-packages/auth/admin.md) — the plugin deep dive
> - [`../11-packages/auth/impersonation.md`](../11-packages/auth/impersonation.md) — impersonation specifics
> - [`../11-packages/auth/decisions/0002-admin-plugin-config.md`](../11-packages/auth/decisions/0002-admin-plugin-config.md) — why the plugin is configured the way it is
> - [`../10-decisions/0015-admin-routes-flat-vs-org-scoped.md`](../10-decisions/0015-admin-routes-flat-vs-org-scoped.md) — why `/admin/*` flat
> - [`./pages.md`](./pages.md) — the full web app page inventory (this doc is the deep dive for the admin slice)
> - `packages/admin/README.md` — once the package is created, its own spec doc

## 1. Package architecture (the why)

Admin is a feature with equivalent complexity to `packages/api` (13 endpoints, ~10 pages, ~20 components, ~15 server actions). Treating it as a route-scattered concern in `apps/web/src/app/(app)/admin/` would create the same problems the project avoided by extracting `api` into its own package.

```
apps/template/packages/admin/                      ← the admin feature, self-contained
├── src/
│   ├── pages/                                     ← page components, one per route
│   │   ├── dashboard.tsx                          ← /admin
│   │   ├── users/
│   │   │   ├── list.tsx                           ← /admin/users
│   │   │   ├── new.tsx                            ← /admin/users/new
│   │   │   ├── detail.tsx                         ← /admin/users/:id
│   │   │   ├── edit.tsx                           ← /admin/users/:id/edit
│   │   │   ├── password.tsx                       ← /admin/users/:id/password
│   │   │   └── sessions.tsx                       ← /admin/users/:id/sessions
│   │   └── impersonate.tsx                        ← /admin/impersonate
│   ├── components/                                ← UI primitives + composites
│   │   ├── admin-shell.tsx                        ← the layout shell (sidebar + main)
│   │   ├── admin-sidebar.tsx                      ← flat nav: Overview / Users / Impersonate
│   │   ├── user-table.tsx                         ← server, reads listUsers
│   │   ├── user-search-bar.tsx                    ← client, URL state
│   │   ├── ban-dialog.tsx                         ← Dialog shadcn + server action
│   │   ├── impersonate-confirm-dialog.tsx
│   │   └── ...
│   ├── server-actions/                            ← 13 Better Auth endpoints → typed Next.js actions
│   │   ├── user-actions.ts                        ← banUser, unbanUser, setRole, removeUser, createUser, updateUser, setUserPassword
│   │   ├── session-actions.ts                     ← revokeUserSession, revokeUserSessions
│   │   └── impersonation-actions.ts               ← impersonateUserAction, stopImpersonatingAction
│   ├── lib/
│   │   ├── guards.ts                              ← requireAdmin, assertNotSelf, assertNotAdmin
│   │   ├── queries.ts                             ← listUsersForImpersonation (with last_active JOIN), etc.
│   │   └── pagination.ts                          ← totalPages, nextOffset, prevOffset
│   ├── router.ts                                  ← matchAdminRoute(slug) → { Component, params }
│   ├── routes.ts                                  ← declarative route table
│   └── index.ts                                   ← public surface

apps/template/apps/web/src/app/(app)/admin/
├── layout.tsx                                     ← Next.js idiom: auth + role gate + <AdminShell>
├── page.tsx                                       ← optional: shortcut for /admin (delegates to router)
└── [...slug]/page.tsx                             ← ONE FILE — delegates to @deessejs/admin/router
```

### Why this pattern

1. **Consistency with `packages/api`.** The project established "complex features live as dedicated packages". Admin fits the bill.
2. **Isolation.** Remove admin by deleting the package + the route file + the workspace entry. Compare to scattered routes in `apps/web` which create import cycles.
3. **Buyer extensibility.** A buyer who wants a custom admin (Stripe Dashboard style) replaces `@deessejs/admin` with their own; the catch-all route keeps working.
4. **Tests co-located.** `packages/admin/tests/` matches `packages/auth/tests/`, `packages/api/tests/`.
5. **Dependency direction.** `packages/admin` depends on auth/database/ui/mail; the reverse is never true.

### Honest tradeoffs (accepted)

- No file-based routing inside admin. Pages live in `packages/admin/src/pages/`, not in `apps/web`.
- `params.slug` is an array — manual parsing (`slug[0]`, `slug[1]`) vs. named segments.
- No per-route `loading.tsx` / `error.tsx` / `not-found.tsx`. Must use layout-level or `error.tsx` boundary in `matchAdminRoute`.
- No parallel / intercepting routes (not needed for admin).
- Next.js devtools won't recognize sub-routes of the catch-all.

**Verdict:** acceptable for admin (rarely changes, small team, well-documented). Would be a bad pattern for the user-facing app.

### What's NOT in the package

The login flow and first-admin bootstrap are **pre-gate** — they live in `apps/web`, in a separate route group like `(admin-unprotected)`. Rationale: a user without a session can't be gated by an admin layout. Example structure:

```
apps/web/src/app/(admin-unprotected)/
├── layout.tsx                                     ← minimal shell, no AppHeader
├── login/page.tsx                                 ← /admin/login (branded "Operator Console")
└── create-first-admin/page.tsx                    ← /admin/create-first-admin (Payload-style bootstrap)
```

The `packages/admin` package contains NOTHING related to authentication bootstrap. It's post-gate only.

## 2. Route map (logical URLs)

URLs are unchanged from the user-perspective. What changes is the file location.

| URL | Page component | File (post-refactor) |
|---|---|---|
| `/admin` | `DashboardPage` | `packages/admin/src/pages/dashboard.tsx` |
| `/admin/users` | `UsersListPage` | `packages/admin/src/pages/users/list.tsx` |
| `/admin/users/new` | `UsersNewPage` | `packages/admin/src/pages/users/new.tsx` |
| `/admin/users/[id]` | `UserDetailPage` | `packages/admin/src/pages/users/detail.tsx` |
| `/admin/users/[id]/edit` | `UserEditPage` | `packages/admin/src/pages/users/edit.tsx` |
| `/admin/users/[id]/password` | `UserPasswordPage` | `packages/admin/src/pages/users/password.tsx` |
| `/admin/users/[id]/sessions` | `UserSessionsPage` | `packages/admin/src/pages/users/sessions.tsx` |
| `/admin/impersonate` | `ImpersonatePickerPage` | `packages/admin/src/pages/impersonate.tsx` |
| `/admin/login` | (pre-gate) | `apps/web/src/app/(admin-unprotected)/login/page.tsx` |
| `/admin/create-first-admin` | (pre-gate) | `apps/web/src/app/(admin-unprotected)/create-first-admin/page.tsx` |

The route table in `packages/admin/src/routes.ts` is the source of truth. Adding a new admin route = adding one entry to the table + one component file. No Next.js file changes needed.

## 3. The catch-all (the one Next.js file)

```ts
// apps/template/apps/web/src/app/(app)/admin/[...slug]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { auth } from '@deessejs/auth'
import { matchAdminRoute } from '@deessejs/admin/router'

type Params = Promise<{ slug?: string[] }>

export default async function AdminCatchAllPage({ params }: { params: Params }) {
  const { slug = [] } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(`/login?redirect=/admin/${slug.join('/')}`)

  // Layout already gated by role (this file's parent layout). session is admin.
  const { Component, params: routeParams } = matchAdminRoute(slug)
  return <Component session={session} params={routeParams} />
}
```

Plus an optional `app/(app)/admin/page.tsx` for the dashboard root (`slug === []`) — OR include the empty pattern in the routes table so `slug = []` matches `DashboardPage`.

## 4. The layout shell (the role gate)

### `app/(app)/admin/layout.tsx`

Two responsibilities, exactly as before:

1. **Auth gate** — already done by `app/(app)/layout.tsx` (parent). Inherited.
2. **Role gate** — this layout's job.

```ts
// pseudo-code — to be written in implementation
export default async function AdminLayout({ children }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login?redirect=/admin')         // shouldn't trigger — (app) parent does it
  if (session.user.role !== 'admin') notFound()           // ← notFound, not redirect

  return <AdminShell user={session.user}>{children}</AdminShell>
}
```

**Why `notFound()` not `redirect()`** — security. A non-admin trying to access `/admin` should see the same 404 as `/admin/does-not-exist`. `redirect('/dashboard')` would confirm that `/admin` exists, leaking that an email has operator privileges to anyone who can guess the URL.

Same pattern as GitHub (non-staff → 404 on `/staff`), Linear (non-admin → 404 on admin settings), Vercel.

### `AdminShell` (in `_components/admin-sidebar.tsx`)

The shell wraps the page in:

- The existing `AppHeader` from `(app)/layout.tsx` (already rendered — the admin layout is nested inside `(app)`).
- An admin-specific sidebar (left column, lg+ screens).
- The main content area (right column).

The sidebar shows:

- "Users" → `/admin/users`
- "New user" → `/admin/users/new`
- (Future: "Audit log" → `/admin/audit`, M3+)

Each nav item is labelled to disambiguate from the future org-scoped admin:

- "Global users" (not "Users")
- "Global role" in detail pages (not "Role")

## 3. The impersonation banner

The banner **does not live in `(app)/admin/layout.tsx`**. It lives in `(app)/layout.tsx`, above the `<AppHeader>`, so it appears on every authenticated page (dashboard, settings, admin, etc.).

```ts
// app/(app)/layout.tsx — add above the AppHeader
{session.session.impersonatedBy ? (
  <ImpersonationBanner
    adminId={session.session.impersonatedBy}
    onStop={stopImpersonatingAction}   // server action
  />
) : null}
```

### Reading `impersonatedBy`

It's a field on the **session**, not on the user. The session type is inferred by Better Auth (`auth.$Infer.Session.session`). The field is `string | null | undefined` — the type may be incomplete in 1.6.19 (cf. memory note about session.activeOrganizationId); handle all three.

### The banner UX

- Sticky top of the viewport, full width, distinct color (yellow/amber).
- Shows: "You are impersonating {user.name}. This session will end in {remainingTime} or when you click Stop."
- "Stop impersonating" button calls `stopImpersonatingAction`.

### `stopImpersonatingAction`

```ts
// packages/admin/src/server-actions/impersonation-actions.ts
'use server'
export async function stopImpersonatingAction() {
  await auth.api.stopImpersonating({ headers: await headers() })
  redirect('/admin/users')   // land somewhere safe
}
```

The endpoint takes no body. Better Auth handles cookie rotation.

## 4. Endpoints → UI affordances mapping

| Better Auth endpoint | UI surface | Server / Client | Component |
|---|---|---|---|
| `listUsers` | `/admin/users` | server | `user-table.tsx` |
| `getUser` | `/admin/users/[userId]` | server | `user-detail-card.tsx` |
| `createUser` | `/admin/users/new` (page) | client form + server action | `create-user-form.tsx` (in `_components/`) |
| `updateUser` | `/admin/users/[userId]/edit` | client form + server action | `update-user-form.tsx` |
| `setRole` | Dialog on `[userId]/page.tsx` | server action | `set-role-dialog.tsx` |
| `setUserPassword` | `/admin/users/[userId]/password` | client form + server action | `set-password-form.tsx` |
| `banUser` | Dialog on `[userId]/page.tsx` | server action | `ban-dialog.tsx` |
| `unbanUser` | Button on `[userId]/page.tsx` | server action | inline button + confirm popover |
| `removeUser` | Dialog with typed-email confirmation | server action | `delete-user-dialog.tsx` |
| `listUserSessions` | `/admin/users/[userId]/sessions` | server | `sessions-table.tsx` |
| `revokeUserSession` | Button per session row | server action | `revoke-session-button.tsx` |
| `revokeUserSessions` | "Revoke all" button | server action | inline button + confirm popover |
| `impersonateUser` | Dialog on `[userId]/page.tsx` | server action | `impersonate-dialog.tsx` |
| `stopImpersonating` | Banner button | server action | `stopImpersonatingAction` in `impersonation.md` |
| `hasPermission` | (no UI — internal helper) | n/a | not exposed to the buyer |

## 5. URL state for search/filter/pagination

The `listUsers` endpoint accepts a rich query object. The `/admin/users` page reads it from URL search params, not `useState`. Benefits:

- Shareable URLs (`?q=alice&filterField=banned&filterValue=true`).
- Browser back/forward works.
- Server component reads the params in one place.

```ts
// apps/web/src/app/(app)/admin/users/page.tsx — pseudo-code
type SearchParams = Promise<{
  q?: string
  searchField?: 'email' | 'name'
  searchOperator?: 'contains' | 'starts_with' | 'ends_with'
  filterField?: string
  filterValue?: string
  filterOperator?: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with'
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  offset?: string
  limit?: string
}>

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams
  // build the query, call auth.api.listUsers, render user-table
}
```

The search bar is a **client island** (`user-search-bar.tsx`) that:

- Reads current URL state via `useSearchParams`.
- Updates URL via `useRouter().replace(...)` (replace, not push — no history pollution).
- Debounces 300ms on `q` (instant search), explicit submit on other filters.

## 6. The role gate — single source of truth

The role gate lives in **one place**: `(app)/admin/layout.tsx`. Every nested page and every server action assumes it's been called.

**Do NOT add `if (user.role !== 'admin') return` to individual pages.** The layout handles it once. Pages only need to read `session.user` knowing it's already an admin.

**Do add `assertNotSelf` to every server action that mutates the current user.** See §7.

### Exception: server actions called from cross-surface components

If a future component is mounted outside `/admin/*` and triggers an admin action (e.g. a "ban user" button in a search result), it must re-verify with `requireAdmin()` (a server-side helper). The layout's role gate doesn't cover it.

## 7. Self-protection guard

An admin must not be able to lock themselves out of the system. Every server action that mutates the current user MUST guard:

```ts
async function assertNotSelf(adminId: string, targetId: string) {
  if (adminId === targetId) {
    throw new Error('FORBIDDEN_SELF_ACTION')
  }
}
```

### Actions that MUST guard

| Action | Why |
|---|---|
| `setRole` | Removing your own `admin` role leaves no operator. |
| `banUser` | Banning yourself is permanent lock-out (no one to unban you). |
| `removeUser` | Hard-deleting yourself deletes your own session. |
| `revokeUserSessions` | Revoking your own sessions logs you out (mild — recoverable by re-login, but still disorienting). |

### Actions that MUST NOT guard

| Action | Why |
|---|---|
| `listUsers`, `getUser` | Read-only. |
| `createUser` | Creates a new account, doesn't touch self. |
| `updateUser` on someone else | OK as long as the `userId` is checked. |
| `impersonateUser` | Already blocked by Better Auth default (PR #6454). |

### Where to put the guard

Centralize in `packages/admin/src/lib/guards.ts`. Import in every server action file (`packages/admin/src/server-actions/*.ts`). Do NOT duplicate the check inline.

### UI behavior for self-actions

In `packages/admin/src/pages/users/detail.tsx`, when `userId === session.user.id`:

- Disable the "Ban" button with a tooltip "You can't ban yourself."
- Disable the "Remove" button with the same.
- Disable the "Change role" select with "You can't change your own role."
- Disable the "Revoke all sessions" button.
- Disable the "Impersonate" button (already blocked, but defense in depth).

The page must still RENDER (read-only) so the admin can see their own info (sessions list, etc.).

## 8. Common gotchas

| # | Gotcha | Mitigation |
|---|---|---|
| 1 | Forgetting `adminClient` in `auth-client.ts` → `authClient.admin` is `undefined` | First step before any UI work. See [`../11-packages/auth/admin.md`](../11-packages/auth/admin.md) §4. |
| 2 | Impersonation banner shows on `/login` because of layout inheritance | The `(unprotected)` group does NOT have the banner. Verify with a manual test: impersonate, log out, log in — banner should be gone. |
| 3 | Server action forgets `revalidatePath('/admin/users')` after a mutation | Stale list until next navigation. Always revalidate the affected paths. |
| 4 | `useSearchParams` requires `<Suspense>` boundary in Next 16 | Wrap `user-search-bar.tsx` (or its parent) in `<Suspense>`. Otherwise the entire page becomes dynamic. |
| 5 | `notFound()` in a server action throws — needs `try/catch` if action is called from a form | Use `useFormState` + `useFormStatus` for error rendering. |
| 6 | Two browser sessions impersonating different users in the same browser | `cookieCache` 5-min cache can show stale "who am I" briefly. Mitigated by the cookie refresh on the next request. |
| 7 | `listUsers` returns up to 100 users by default | Pass `limit: 50` explicitly in the default page query. |
| 8 | `adminClient` types don't include custom RBAC statements (we don't have any) | If we add custom `ac`/`roles` later, must pass to BOTH server `admin({ac, roles})` AND client `adminClient({ac, roles})` — otherwise type drift. |

## 9. Build order

The implementation sequence for M2 admin. **All file paths below are in `apps/template/packages/admin/` unless noted as `apps/web/`** (the catch-all route and the role gate stay in `apps/web/`).

1. **Phase A — Foundations** (½ day)
   - **Create `packages/admin/` package skeleton** — `package.json`, `tsconfig.json`, `src/index.ts`, wire into `apps/template/pnpm-workspace.yaml` and root.
   - Add `adminClient()` to `apps/web/src/lib/auth-client.ts`.
   - Add `<ImpersonationBanner>` to `apps/web/src/app/(app)/layout.tsx` + `stopImpersonatingAction` (lives in `packages/admin/src/server-actions/impersonation-actions.ts`, imported by `apps/web`).
   - Add `(admin-unprotected)/login` and `(admin-unprotected)/create-first-admin` shells in `apps/web/` (Payload-style bootstrap; see `01-stack` if needed).
   - Manual smoke test: create an admin user via SQL, log in, verify banner absent.

2. **Phase B — Layout + overview** (1 day)
   - Create `apps/web/src/app/(app)/admin/layout.tsx` with the role gate.
   - Create `apps/web/src/app/(app)/admin/[...slug]/page.tsx` — the catch-all (delegates to `matchAdminRoute`).
   - Create `packages/admin/src/router.ts` + `routes.ts` with the initial route table (just `dashboard` for now).
   - Create `packages/admin/src/pages/dashboard.tsx` (3 counters: total / banned / active sessions).
   - Create `packages/admin/src/components/admin-shell.tsx` + `admin-sidebar.tsx`.
   - First-admin bootstrap detection in `apps/web/src/app/(app)/admin/layout.tsx` (count admins → if 0, redirect to `/admin/create-first-admin`).

3. **Phase C — Users CRUD** (2-3 days)
   - Add `users/*` routes to `packages/admin/src/routes.ts`.
   - `packages/admin/src/pages/users/list.tsx` + `components/user-table.tsx` + `components/user-search-bar.tsx`.
   - `packages/admin/src/pages/users/detail.tsx` with sections (Profile / Global role / Ban / Sessions / Danger zone).
   - `packages/admin/src/pages/users/new.tsx` + `components/create-user-form.tsx`.
   - `packages/admin/src/pages/users/edit.tsx` + `components/update-user-form.tsx`.
   - `packages/admin/src/pages/users/password.tsx` + `components/set-password-form.tsx`.
   - All user server actions in `packages/admin/src/server-actions/user-actions.ts`.
   - `packages/admin/src/lib/guards.ts` with `requireAdmin`, `assertNotSelf`.
   - Dialog components: `ban-dialog.tsx`, `set-role-dialog.tsx`, `delete-user-dialog.tsx`, `impersonate-dialog.tsx`.

4. **Phase D — Impersonate picker** (1 day)
   - Add `impersonate` route to `packages/admin/src/routes.ts`.
   - `packages/admin/src/pages/impersonate.tsx` (search-first, `role=member` default filter, last_active sort).
   - `packages/admin/src/lib/queries.ts` with `listUsersForImpersonation` (the JOIN Drizzle query).
   - `packages/admin/src/components/impersonate-search-bar.tsx` (client, debounce, URL state).
   - `packages/admin/src/components/impersonate-confirm-dialog.tsx`.
   - `impersonateUserAction` in `packages/admin/src/server-actions/impersonation-actions.ts`.
   - `packages/admin/src/pages/users/sessions.tsx` + `components/sessions-table.tsx`.
   - `revokeUserSession` + `revokeUserSessions` in `packages/admin/src/server-actions/session-actions.ts`.

5. **Phase E — Tests** (1 day)
   - `packages/admin/tests/unit/router.test.ts` — matchAdminRoute matcher unit tests.
   - `packages/auth/tests/integration/admin.test.ts` — 5-6 critical cases (admin gate, self-protection, impersonation lifecycle, ban, role change).
   - Component snapshot tests for the dialogs (vitest + happy-dom or playwright).

6. **Phase F — Polish** (1 day)
   - Empty states, loading states, error states (Suspense boundaries around catch-all).
   - Confirmation dialogs with typing-required for delete.
   - Console.log audit for destructive actions (basic; full audit log is M3+).
   - Mobile responsive (drawer for sidebar).

**Total estimated effort: 7-8 days** (was 6-7 before; +1 day for the package skeleton + catch-all scaffolding).

## Cross-references

- [`./pages.md`](./pages.md) — the full web app page inventory (admin surface added alongside this ADR)
- [`../11-packages/auth/admin.md`](../11-packages/auth/admin.md) — the plugin deep dive (endpoints, options, gotchas)
- [`../11-packages/auth/impersonation.md`](../11-packages/auth/impersonation.md) — impersonation flow (banner, security, testing)
- [`../11-packages/auth/integrations.md`](../11-packages/auth/integrations.md) — Hono mount, session middleware, cookie refresh
- [`../11-packages/auth/decisions/0002-admin-plugin-config.md`](../11-packages/auth/decisions/0002-admin-plugin-config.md) — plugin config rationale
- [`../10-decisions/0015-admin-routes-flat-vs-org-scoped.md`](../10-decisions/0015-admin-routes-flat-vs-org-scoped.md) — layout choice rationale
- [`../../product/features/21-admin-dashboard.md`](../../product/features/21-admin-dashboard.md) — product spec for the admin feature
- [`../../packages/ui/CLAUDE.md`](../../../packages/ui/CLAUDE.md) — shadcn primitive inventory (dialog, select, dropdown-menu all available)

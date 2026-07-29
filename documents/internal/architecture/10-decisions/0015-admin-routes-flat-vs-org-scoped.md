# 0015. Admin routes — flat `/admin/*` not `/[orgSlug]/admin/*`

- **Status:** Accepted
- **Date:** 2026-06-25
- **Deciders:** tech lead, founder

## Context and problem statement

The admin plugin exposes GLOBAL operator endpoints (`listUsers`, `banUser`, `setRole`, `impersonateUser`, …) that operate on the `user` table. They have **no notion of org** — an admin can ban a user across every org, impersonate any non-admin, list every user in the database. The endpoints don't read `session.activeOrganizationId`; they don't filter by org.

We must decide where to put the UI that wraps these endpoints. Three candidate layouts:

1. **Flat `/admin/*`** — no org in the URL. Admin operates globally, matching the plugin's actual scope.
2. **Nested `/[orgSlug]/admin/*`** — requires org context in the URL. Implies org-scoped admin, even though the plugin doesn't need it.
3. **Both** — `/admin/*` for global, `/[orgSlug]/admin/*` for org-scoped (member management, org transfer, billing).

`pages.md` (the web app page inventory, dated 2026-06-23) currently lists the **nested** variant as the M1/M2 plan under "Surface: Admin org" and the **flat** variant as an aspirational M3+ under "Surface: System admin". The current code (as of 2026-06-25) uses neither — admin routes don't exist yet. This ADR locks the choice.

## Considered options

### Option A — Flat `/admin/*`

```
/admin                            ← admin home (overview)
/admin/users                      ← listUsers
/admin/users/new                  ← createUser
/admin/users/[userId]             ← getUser
/admin/users/[userId]/edit        ← updateUser
/admin/users/[userId]/password    ← setUserPassword
/admin/users/[userId]/sessions    ← listUserSessions + revoke*
/admin/impersonate/stop           ← stopImpersonating
```

Nested inside `app/(app)/admin/` so it inherits the `(app)` auth gate + `AppHeader`.

**Pros:**

- URL matches the plugin's actual scope (global).
- Simpler URL model — no `[orgSlug]` segment to thread through.
- One role gate (`user.role === 'admin'`). Easier to reason about.
- The ImpersonationBanner (lives in `(app)/layout.tsx`) shows on `/admin/users/*` AND `/dashboard` etc., which is the right UX.

**Cons:**

- Looks similar to a future org-scoped admin at `/[orgSlug]/admin/*`. Risk of user confusion.
- Two distinct concepts share the word "admin": **global admin** (here) and **org admin** (future). Must be disambiguated in UI labels (e.g. "Global users" vs "Members").

### Option B — Nested `/[orgSlug]/admin/*`

```
/[orgSlug]/admin                  ← admin home (org-scoped)
/[orgSlug]/admin/users            ← listUsers filtered by org membership
/[orgSlug]/admin/users/[userId]   ← getUser + member details
/[orgSlug]/admin/members          ← org member management
...
```

**Pros:**

- URL makes org scope explicit.
- Symmetric with the future `/[orgSlug]/settings/*` org-scoped surface.

**Cons:**

- Requires an active org context (`session.activeOrganizationId`) for every admin action. The admin plugin doesn't need one — we'd be filtering client-side and re-implementing what the plugin already does globally.
- `listUsers` filtered by org membership is **not** what the plugin does. The plugin returns ALL users. We'd have to fetch all and filter, or hit the org plugin's `listMembers` (different API, different result).
- The impersonation banner can show on an org-scoped page where the user is impersonating someone OUTSIDE that org — confusing UX.
- Doesn't actually solve any problem the plugin doesn't already solve.

### Option C — Both

```
/admin                            ← GLOBAL: listUsers, banUser, impersonateUser, setRole
/[orgSlug]/admin                  ← ORG-SCOPED: listMembers, updateMemberRole, removeMember, transferOwnership, org settings
```

**Pros:**

- Each URL prefix has one clear scope.
- Org-scoped admin (member management, transfer) genuinely needs org context.
- Buyers who only need global admin can drop the `/[orgSlug]/admin/*` surface.

**Cons:**

- Two separate layouts to maintain.
- Buyer confusion: "where do I change a user's role?" Answer: depends on whether you're talking about the global operator role or the org-scoped role. Same naming collision as `user.role` vs `member.role`.
- M2 scope creep risk — building the org-scoped surface in parallel with the global one doubles the work.

## Decision

**Option A for the M2 admin sprint.** The admin plugin is global; the UI lives at `/admin/*` flat, inside `(app)/admin/`. The role gate is `user.role === 'admin'`.

**Option C is the long-term shape.** When the org-scoped surface ships (M3+), it goes at `/[orgSlug]/admin/*` for member management, transfer ownership, and org settings. The two surfaces coexist with clearly-labeled navigation entries ("Global users" vs "Members").

**Option B is rejected** for the reasons above.

## Consequences

**Positive:**

- The URL model matches the plugin's actual scope. No client-side filtering hack.
- One role gate, one sidebar, one layout.
- Impersonation UX is consistent — the banner appears on every authenticated page, including `/admin/*`.

**Negative:**

- The two "admin" surfaces (global vs org-scoped) look similar. Must disambiguate in UI labels and in the AdminSidebar's nav items.
- Future migration risk if a buyer needs an org-scoped filter on `/admin/users` (e.g. "list users in Acme Corp only") — would require either a query param or moving to Option B/C.

**Neutral:**

- The web app page inventory (`pages.md`) needs to be updated to reflect this decision (see References). The aspirational `/[orgSlug]/admin/*` and `/(system)/*` sections stay as future M3+ candidates.

## Why we might revisit

- A buyer needs regional admin (region admins who can only operate on users in their region). The flat `/admin` may need a `/admin?region=eu` scope, or split per region.
- A buyer needs "org impersonation" (impersonate a user within one org, not globally). Would push toward Option C with an org-scoped impersonation endpoint.
- Compliance regime requires org-scoped audit logs (every admin action attributed to a `(user, org)` pair). Forces Option C.

If we revisit, the new ADR supersedes this one. This file stays for history.

## References

- [`../03-web-app/pages.md`](../03-web-app/pages.md) — the page inventory, will be updated to match
- [`../03-web-app/admin.md`](../03-web-app/admin.md) — the full `/admin/*` route spec (created alongside this ADR)
- [`../11-packages/auth/admin.md`](../11-packages/auth/admin.md) — the deep dive on the admin plugin and the `user.role` vs `member.role` distinction (§6)
- [`../11-packages/auth/decisions/0002-admin-plugin-config.md`](../11-packages/auth/decisions/0002-admin-plugin-config.md) — companion ADR on the plugin config
- [`../11-packages/auth/impersonation.md`](../11-packages/auth/impersonation.md) — the impersonation flow (banner placement rationale)
- [`../product/features/21-admin-dashboard.md`](../../product/features/21-admin-dashboard.md) — the product spec for the admin feature

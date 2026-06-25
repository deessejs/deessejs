# 0002. Admin plugin config — `defaultRole: 'member'`, `adminRoles: ['admin']`, no `ac`/`roles`

- **Status:** Accepted
- **Date:** 2026-06-25
- **Deciders:** tech lead

## Context and problem statement

The `admin({...})` plugin call in `packages/auth/src/auth.ts` has three load-bearing choices that interact with the org plugin and the access-control matrix. They need to be explicit so a future bump doesn't silently change the global-vs-org role semantics, and so a new contributor can understand the intent from the ADR rather than reverse-engineering it from the code.

The three choices to lock in:

1. **`defaultRole`** — what `user.role` is assigned to a newly-created user (sign-up, admin `createUser`, OAuth).
2. **`adminRoles`** — which `user.role` values grant admin access to all `/admin/*` endpoints.
3. **Whether to pass `ac` / `roles`** — the plugin supports a custom access-control matrix (statements + roles for `user` and `session` resources). Passing nothing uses the built-in defaults.

## Considered options

### For `defaultRole`

1. **`'user'`** — Better Auth's built-in default. Generic.
2. **`'member'`** (chosen) — aligns with the org plugin's terminology, where `member` is the everyday non-admin role. New contributors don't have to learn two vocabularies.
3. **`null` / unset** — leaves `user.role` empty. Loses type-narrowing on the column.

### For `adminRoles`

1. **`['admin']`** (chosen) — single global admin tier. Simple, fits v1 scope.
2. **`['admin', 'superadmin']`** — adds a super-admin tier with extra permissions. Premature for v1 — would require custom RBAC statements we don't have.
3. **`[]`** — no global admin via role, only via `adminUserIds`. Forces every admin to be whitelisted by ID; brittle.

### For `ac` / `roles`

1. **No `ac` / `roles`** (chosen) — use the built-in statements (`user` with actions `create/list/set-role/ban/impersonate/impersonate-admins/delete/set-password/set-email/get/update`; `session` with `list/revoke/delete`). We don't have custom statements to add.
2. **Custom `ac` with project + billing statements** — duplicates what the org plugin already does. Two sources of truth = bugs.
3. **Custom `ac` extending the built-in `user`/`session`** — adds per-platform statements (e.g. `impersonate-admins`). Premature; PR #6454's default behavior (no admin-can-impersonate-admin) is what we want.

## Decision

```ts
admin({
  defaultRole: 'member',
  adminRoles: ['admin'],
}),
```

No `ac` / `roles`. The org plugin keeps its own RBAC for org-scoped roles via `access-control.ts` (which is passed to the org plugin, not the admin plugin — see `setup.md`).

The split between admin-plugin and org-plugin RBAC is intentional:

- **Admin plugin** → GLOBAL operator actions on the `user` table. No per-org scoping.
- **Org plugin** → per-org actions on the `member` table. Multi-tenant scoping.

Passing the same `ac` to both plugins would conflate the two scopes.

## Consequences

**Positive:**

- Role-name consistency between user and member scopes (`'admin'` and `'member'` both exist).
- New contributors don't need to learn two access-control matrices to understand admin operations.
- `user.role === 'admin'` is a single, clear predicate for the role gate (see `admin.md` §5).

**Negative:**

- Future maintainers might confuse `user.role` and `member.role`. The naming collision is real (see `admin.md` §6). Mitigated by UI labels and code comments — not eliminated.
- No way to grant operator permissions finer than "all of admin or none". If a buyer needs a "billing admin" (can refund but not ban), they need a custom RBAC and a new ADR.

**Neutral:**

- Custom RBAC for the admin plugin is **not** in scope for v1. The door is open for v2 if a buyer asks.

## Why we might revisit

- A buyer needs a "read-only admin" tier (can list users but cannot ban). Add custom `ac` with a `readonly` statement subset.
- A buyer needs a "billing admin" tier (can refund, can see users, cannot impersonate). Same fix.
- A buyer needs audit-log granularity per role (custom `databaseHooks` per admin action). Different ADR.

If we revisit, the new ADR supersedes this one. This file stays for history.

## References

- [`../admin.md`](../admin.md) §2 and §6 — the deep dive on the plugin and the role ambiguity
- [`../setup.md`](../setup.md) — the actual `auth.ts` config
- [`../plugins.md`](../plugins.md#admin--global-operator-surface-spec-219-220) — the index entry
- [`../access-control.ts`](../src/access-control.ts) — the org plugin's RBAC (different from admin's)
- [`../../../../10-decisions/0015-admin-routes-flat-vs-org-scoped.md`](../../../../10-decisions/0015-admin-routes-flat-vs-org-scoped.md) — companion ADR on the URL layout
- Better Auth upstream: [admin plugin](https://better-auth.com/docs/plugins/admin), [access control](https://better-auth.com/docs/plugins/access)
- Better Auth PR [#6454](https://github.com/better-auth/better-auth/pull/6454) — `feat(admin): prevent impersonating admins by default`

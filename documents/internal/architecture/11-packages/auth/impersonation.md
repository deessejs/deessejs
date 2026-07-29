# Impersonation — operator-acting-as-user

The admin plugin's `impersonateUser` + `stopImpersonating` flow. Companion to [`admin.md`](./admin.md) — this doc goes deep on the impersonation mechanics, the UI banner, and the security implications.

> **Why this doc exists.** Impersonation is the single most sensitive feature exposed by the admin plugin. An operator who clicks "Impersonate" becomes that user — same session cookie, same permissions, same data visibility. Getting the UX (clear banner) and the security (who can impersonate, audit, timeout) right is non-obvious. This doc captures the patterns.

## 1. Server-side flow

### Starting impersonation

```ts
// called from app/(app)/admin/users/[userId]/actions.ts
'use server'
export async function impersonateUserAction(formData: FormData) {
  const session = await requireAdmin()              // role gate + session
  const userId = String(formData.get('userId'))
  await assertNotSelf(session.user.id, userId)      // self-protection guard

  await auth.api.impersonateUser({
    body: { userId },
    headers: await headers(),
  })
  // ↑ does NOT auto-redirect. The new session cookie is set on the response.
  // We rely on the client to navigate, OR we throw redirect().
  redirect(`/admin/users/${userId}`)
}
```

`auth.api.impersonateUser` returns a new session with:

- `session.userId = <targetUserId>` (the impersonated user)
- `session.impersonatedBy = <adminUserId>` (the operator)
- `session.expiresAt = now + impersonationSessionDuration` (default 1h, configurable on the plugin)

The new cookie is set via the standard `set-cookie` response header, propagated through the Hono mount (cf. [`integrations.md`](./integrations.md) §2 — the `asResponse: true` workaround).

### Reading the impersonation status

The current request's session always carries `impersonatedBy` if the user is being impersonated:

```ts
const session = await auth.api.getSession({ headers: await headers() })
if (session?.session.impersonatedBy) {
  // The user in `session.user` is the impersonated target.
  // The admin who started it is `session.session.impersonatedBy`.
  // This is the banner trigger.
}
```

The two distinct user identities are critical:

- `session.user.id` — the impersonated target (whose data you see).
- `session.session.impersonatedBy` — the operator (whose permissions were used to start the session).

### Stopping impersonation

```ts
'use server'
export async function stopImpersonatingAction() {
  await auth.api.stopImpersonating({ headers: await headers() })
  redirect('/admin/users')   // land somewhere safe — operator view
}
```

The endpoint takes no body. Better Auth:

1. Deletes the impersonation session from the DB.
2. Refreshes the cookie (back to the operator's own session, or null if no other session).
3. Returns `{ success: true }`.

We redirect after — without it the user lands on whatever page triggered the action with the operator's own session.

## 2. UI: the banner

### Placement

The banner **must live in `(app)/layout.tsx`**, NOT in `(app)/admin/layout.tsx`. Reason: an impersonating operator may navigate to non-admin pages (`/dashboard`, `/settings`). The banner should follow them.

```
(app)/layout.tsx
  ├── ImpersonationBanner (if session.session.impersonatedBy)
  ├── AppHeader
  └── <main>{children}</main>
```

The check is `session.session.impersonatedBy` — falsy for normal sessions, truthy for impersonation sessions. Better Auth sets it on session creation; it doesn't change during the session.

### Banner UX

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠ You are impersonating Ada Lovelace. Their data is visible to you.  │
│ Sessions and changes will affect their account.     [ Stop ]         │
└──────────────────────────────────────────────────────────────────────┘
```

Requirements:

- **Distinct color** (amber/yellow background, not red — impersonation isn't an error).
- **Sticky** at the top of the viewport (z-index above the header).
- **Clear identity**: shows the impersonated user's name + email.
- **Single, obvious action**: "Stop impersonating" button. Big, easy to find.
- **No accidental dismissal** — the banner does NOT have a close (X) button. The only way out is "Stop".
- **Accessible**: `role="alert"` (it's interrupting the normal flow), proper `aria-live="polite"`.

### Counting down the 1-hour timeout

The default `impersonationSessionDuration` is 3600s. To show "X minutes remaining":

```ts
// client component
const expiresAt = new Date(session.session.expiresAt)
const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt.getTime() - Date.now()) / 1000)

useEffect(() => {
  const id = setInterval(() => {
    setRemaining(Math.max(0, expiresAt.getTime() - Date.now()) / 1000)
  }, 1000)
  return () => clearInterval(id)
}, [expiresAt])
```

If `remaining === 0`, show "Session ending soon — refresh to continue". This is cosmetic — the session will actually expire and the next request will redirect to login.

## 3. Security implications

### Who can impersonate whom

By default (PR #6454, accepted upstream):

- ✅ Admin can impersonate any non-admin.
- ❌ Admin CANNOT impersonate another admin (returns FORBIDDEN).

To allow admin-can-impersonate-admin, grant the `impersonate-admins` permission via custom RBAC. **We don't.** Our config (cf. [`decisions/0002-admin-plugin-config.md`](./decisions/0002-admin-plugin-config.md)) uses built-in statements, so admin-to-admin impersonation is blocked by default.

### Audit log

**Better Auth does not ship an audit log.** The impersonation events (start, stop) are not automatically recorded anywhere except:

- The `sessions` table (the `impersonatedBy` column + the `expiresAt` timestamp).
- The `users` table (`updatedAt` doesn't change, but `sessions` count for the operator increments).

For M1, this is acceptable — the impersonation session itself is the audit trail. For M2+, we add:

- A custom `databaseHooks.user.create` hook? No — that fires on user creation, not on session creation.
- A custom hook on the admin plugin's events? Better Auth exposes them as `databaseHooks.session.create` with a way to check if the new session has `impersonatedBy`. Documented pattern below.

```ts
// in auth.ts (not yet implemented — M2+ audit work)
databaseHooks: {
  session: {
    create: {
      after: async (session, ctx) => {
        if (session.impersonatedBy) {
          await db.insert(auditLog).values({
            actorId: session.impersonatedBy,
            action: 'impersonation.start',
            targetId: session.userId,
            metadata: { sessionId: session.id, ip: ctx?.request?.headers.get('x-forwarded-for') },
          })
        }
      },
    },
    update: {
      after: async (session, ctx) => {
        // 'stop impersonating' issues a session delete, not an update — covered by the delete hook
      },
    },
    delete: {
      before: async (session, ctx) => {
        if (session.impersonatedBy) {
          await db.insert(auditLog).values({
            actorId: session.impersonatedBy,
            action: 'impersonation.stop',
            targetId: session.userId,
            metadata: { sessionId: session.id },
          })
        }
      },
    },
  },
},
```

This is sketched, not committed. The audit log table + hook wiring is M2+ work — tracked separately.

### Cookie security

The impersonation session uses the **same cookie security** as any session: `SameSite=Lax`, `HttpOnly`, `Secure` in prod. It does NOT bypass the cookie attributes or grant additional privileges.

The impersonation session also goes through `cookieCache` (5-min in-memory cache). The cache key includes the impersonation session's ID, so two simultaneous impersonation sessions in the same browser don't collide.

### CSRF

The `impersonateUser` and `stopImpersonating` endpoints accept POST with the session cookie. Better Auth's CSRF protection applies — same as for any other admin endpoint.

## 4. Testing

Integration tests live in `packages/auth/tests/integration/admin.test.ts` (cf. the test plan in [`admin.md`](./admin.md)). The impersonation-specific cases:

```ts
describe('admin plugin — impersonation', () => {
  it('admin can impersonate a member', async () => {
    const admin = test.createUser({ role: 'admin' })
    await test.saveUser(admin)
    const target = test.createUser({ role: 'member' })
    await test.saveUser(target)

    const adminHeaders = await test.getAuthHeaders({ userId: admin.id })
    const impersonationSession = await auth.api.impersonateUser({
      body: { userId: target.id },
      headers: adminHeaders,
    })

    expect(impersonationSession.userId).toBe(target.id)
    expect(impersonationSession.impersonatedBy).toBe(admin.id)
  })

  it('admin cannot impersonate another admin (PR #6454)', async () => {
    const admin1 = test.createUser({ role: 'admin' })
    await test.saveUser(admin1)
    const admin2 = test.createUser({ role: 'admin' })
    await test.saveUser(admin2)

    const admin1Headers = await test.getAuthHeaders({ userId: admin1.id })
    await expect(
      auth.api.impersonateUser({ body: { userId: admin2.id }, headers: admin1Headers })
    ).rejects.toThrow(/cannot impersonate admin/i)
  })

  it('stopImpersonating clears the impersonatedBy field', async () => {
    // start impersonation, then stop, then check the session
    const admin = test.createUser({ role: 'admin' })
    await test.saveUser(admin)
    const target = test.createUser({ role: 'member' })
    await test.saveUser(target)

    const adminHeaders = await test.getAuthHeaders({ userId: admin.id })
    const impSession = await auth.api.impersonateUser({
      body: { userId: target.id },
      headers: adminHeaders,
    })

    await auth.api.stopImpersonating({ headers: adminHeaders })

    const stoppedSession = await auth.api.getSession({ headers: adminHeaders })
    expect(stoppedSession?.session.impersonatedBy).toBeNull()
  })

  it('member cannot impersonate anyone', async () => {
    const member = test.createUser({ role: 'member' })
    await test.saveUser(member)
    const target = test.createUser({ role: 'member' })
    await test.saveUser(target)

    const memberHeaders = await test.getAuthHeaders({ userId: member.id })
    await expect(
      auth.api.impersonateUser({ body: { userId: target.id }, headers: memberHeaders })
    ).rejects.toThrow()
  })

  it('impersonation session expires after impersonationSessionDuration', async () => {
    // set impersonationSessionDuration to a tiny value, start impersonation,
    // wait, then check the session is invalid
    // (this is hard to test without time-mocking — skip or use a custom auth instance)
  })
})
```

## 5. Manual smoke test (pre-deploy checklist)

Before shipping the M2 admin sprint:

- [ ] Create an admin user via direct SQL (since the signup flow doesn't expose this).
- [ ] Log in as the admin.
- [ ] Navigate to `/admin/users` — confirm no banner (not impersonating).
- [ ] Click "Impersonate" on another user — confirm banner appears, URL changes.
- [ ] As the impersonated user, navigate to `/dashboard` — confirm banner STILL appears.
- [ ] Click "Stop" on the banner — confirm URL goes to `/admin/users`, banner gone, you're back as admin.
- [ ] Log out and back in — confirm no banner.
- [ ] As the impersonated user, open DevTools → Application → Cookies — confirm the session cookie is a different token than the admin's.

## 6. Common gotchas

| # | Gotcha | Severity | Mitigation |
|---|---|---|---|
| 1 | Banner shows on `/login` because of a wrong layout nesting | HIGH | Verify the banner is in `(app)/layout.tsx`, not `(app)/admin/layout.tsx`. Test by impersonating then logging out. |
| 2 | `stopImpersonating` leaves the user on a page they can't access as the operator | MEDIUM | The server action calls `redirect('/admin/users')` after success. |
| 3 | Two browser tabs impersonating different users | LOW | The cookie refresh on the second tab overwrites the first. Document in the buyer-facing doc. |
| 4 | `impersonatedBy` field is typed `string \| null \| undefined` in Better Auth 1.6.19 (incomplete types) | LOW | Coalesce: `const adminId = session.session.impersonatedBy ?? null` and check `!== null`. |
| 5 | Cookie cache shows stale "who am I" for up to 5 minutes after stopping impersonation | MEDIUM | The cache refreshes on the next request. Most users won't notice. Document if it becomes a support issue. |
| 6 | Audit log not implemented | MEDIUM | Documented as M2+ work. Tracked in `M0-deferred-work.md` when added. |
| 7 | `impersonateUser` with `userId === session.user.id` (self-impersonation) silently no-ops | LOW | Add `assertNotSelf` guard in the server action (defense in depth; the upstream default blocks this too). |

## Cross-references

- [`./admin.md`](./admin.md) — the admin plugin deep dive (endpoints, config, role ambiguity)
- [`./integrations.md`](./integrations.md) — Hono mount + cookie refresh workaround
- [`./setup.md`](./setup.md) — `createAuth()` skeleton
- [`./decisions/0002-admin-plugin-config.md`](./decisions/0002-admin-plugin-config.md) — plugin config ADR
- [`../../03-web-app/admin.md`](../../03-web-app/admin.md) — the web app admin surface (banner placement, server actions)
- [`../../10-decisions/0015-admin-routes-flat-vs-org-scoped.md`](../../10-decisions/0015-admin-routes-flat-vs-org-scoped.md) — `/admin/*` flat layout ADR
- [`../../06-security/`](../../06-security/) — overall threat model
- Better Auth upstream: [admin plugin → impersonation](https://better-auth.com/docs/plugins/admin#impersonate-user), PR [#6454](https://github.com/better-auth/better-auth/pull/6454)

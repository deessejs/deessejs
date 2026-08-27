# Better-Auth: Database Hooks

Lifecycle hooks for database operations. See [`index.md`](./index.md) first.

**Source:** [Better-Auth docs/concepts/hooks](https://better-auth.com/docs/concepts/hooks), core hooks concept. [Better-Auth docs/concepts/database](https://better-auth.com/docs/concepts/database), databaseHooks reference.

> See [`org.md`](./org.md) (historical) for the autocreate-org pattern this template used to rely on. It's **not applicable here** since the repo is single-tenant. <!-- vale fix: Microsoft.Auto, Microsoft.Contractions -->

---

## Hook Types

Every model (`user`, `session`, `account`, `verification`) supports:

| Hook | Runs | Can modify data? | Can abort? |
|---|---|---|---|
| `model.create.before` | Before the row is written | ✅ return `{ data: ... }` | ✅ return `false` |
| `model.create.after` | After the row is written | ❌ | ❌ |
| `model.update.before` | Before the row is updated | ✅ return `{ data: ... }` | ✅ return `false` |
| `model.update.after` | After the row is updated | ❌ | ❌ |
| `model.delete.before` | Before the row is deleted | ❌ | ✅ return `false` |
| `model.delete.after` | After the row is deleted | ❌ | ❌ |

---

## Signature

```ts
databaseHooks: {
  session: {
    create: {
      before: async (session, ctx) => {
        // session: current session object being written
        // ctx: context (e.g., ctx.context.session for the calling user in update/delete hooks)
        return { data: { ...session, /* any extra fields — single-tenant: none */ } }
        // or: return false to abort
      },
      after: async (session) => {
        // session: the written row
      },
    },
  },
}
```

The `before` hook can **merge** data back into the session object via `{ data: ... }`. The `after` hook receives the final row.

**Source:** [Better-Auth docs/concepts/database](https://better-auth.com/docs/concepts/database), hook signature documentation.

---

## Session.create.before, Known Caveat ([#9070](https://github.com/better-auth/better-auth/issues/9070))

> ⚠️ **Note:** this caveat applies to any code path that touches `session.create.before`. This template is single-tenant and currently does **not** define any such hook; do not add one without first reading the upstream issue.

On signup, the execution order of the create flow is: `session.create.before` → session row written → `user.create.before` → user row written → `user.create.after`. The original report in #9070 concerned an org-auto-create flow that wrote an `activeOrganizationId` from inside this hook. That flow is org-specific and not applicable here. If you ever add a `session.create.before` for an unrelated reason, verify the user row exists at write time.

---

## User.create.after, async Side Effects

Use for fire-and-forget operations that need the committed user row:

```ts
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        // User row is now committed. Safe to query.
        void sendWelcomeEmail({ to: user.email })
      },
    },
  },
},
```

Always use `void` or `waitUntil` for async side effects. Don't await in `after` hooks as it blocks the response. <!-- vale fix: Microsoft.Contractions -->

---

## Account Hooks

Useful for linking OAuth accounts:

```ts
databaseHooks: {
  account: {
    create: {
      after: async (account) => {
        // Link is established. Trigger additional setup if needed.
      },
    },
  },
}
```

---

## Ordering Within a Create Flow

On signup, the execution order is:

1. `session.create.before`
2. Session row written
3. `session.create.after`
4. `user.create.before` (if new user)
5. User row written
6. `user.create.after` (if new user)

**Don't** assume `user` exists when `session.create.before` runs; on first signup it doesn't yet. (Step 7 from the pre-single-tenant ordering, "organization plugin creates membership row.," the team removed it.) <!-- vale fix: Microsoft.Contractions, Microsoft.Quotes, write-good.Passive -->

---

## drizzle Relations for Joins

If `experimental.joins: true`, the schema must include drizzle `relations()` for every table. Regenerate with:

```bash
pnpm auth:generate
```

Review the diff. The CLI regenerates the entire `schema/auth.ts` and may overwrite customizations.

**Source:** [Better-Auth docs/adapters/drizzle](https://better-auth.com/docs/adapters/drizzle), joins section.

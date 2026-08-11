# Better Auth test-utils

A study of the `testUtils()` plugin from better-auth, pinned
to how we use it. Built on
[better-auth.com/docs/plugins/test-utils](https://better-auth.com/docs/plugins/test-utils)
— the upstream page is the source of truth when the lib
changes; this entry exists to show what we wired where, and
why we keep the plugin out of production.

## What `testUtils()` gives us

The plugin does **not** register HTTP routes. It adds
privileged server-side helpers on `ctx.test`:

- **Factories** — `createUser`, `createOrganization` — build
  objects with sensible defaults, no DB write.
- **Database helpers** — `saveUser`, `deleteUser`,
  `addMember` — persist and remove records.
- **Auth helpers** — `login`, `getAuthHeaders`, `getCookies`
  — create authenticated sessions and return the headers
  needed to hit a protected route.
- **OTP capture** — `captureOTP: true` (we do not use this;
  see "What we use" below).

## Where it lives in this repo

The plugin is **not** in the production auth config
(`packages/auth/src/auth.ts`). It is wired in a separate
test-only auth instance at
`packages/auth/tests/setup.ts:21`, alongside its own
`postgres-js` connection to a test database.

```ts
// packages/auth/tests/setup.ts
import { betterAuth } from "better-auth"
import { testUtils } from "better-auth/plugins"
// ... drizzle setup against serverEnv.TEST_DATABASE_URL

export const auth = betterAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  // ... email + verification, same shape as the prod config
  plugins: [testUtils()],
})

export type TestHelpers = Awaited<ReturnType<typeof auth.$context>>["test"]
```

Tests import the `auth` from `@workspace/auth/tests/setup`,
not from `@workspace/auth` — the production auth does not
expose `ctx.test`, by design. The TypeScript inference is
preserved because `testUtils()` is in a statically-defined
`plugins` array (no conditional spread), per the upstream
caveat about inference.

## What we use

`packages/auth/tests/session.test.ts` and
`packages/auth/tests/email.test.ts` exercise the helpers:

```ts
// packages/auth/tests/session.test.ts
const ctx = await auth.$context
expect(ctx.test.createUser).toBeTypeOf("function")
expect(ctx.test.saveUser).toBeTypeOf("function")
expect(ctx.test.deleteUser).toBeTypeOf("function")
expect(ctx.test.login).toBeTypeOf("function")
expect(ctx.test.getAuthHeaders).toBeTypeOf("function")
```

```ts
// packages/auth/tests/email.test.ts
const user = ctx.test.createUser({ email: "reset@example.com" })
await ctx.test.saveUser(user)
// ... exercise the forgot-password flow ...
await ctx.test.deleteUser(user.id)
```

The factories return defaults that match the schema, so
`createUser()` without arguments yields a verified user
with a generated email — enough for any test that does not
care about the values.

## What we deliberately do not use

- `captureOTP: true` — the email-sending path in the test
  config is a fire-and-forget stub. Capturing OTPs in
  memory would not change the assertions we make today, so
  we do not pay the verification-hook complexity.
- `createOrganization` / `addMember` — this repo is
  single-tenant (see `docs/guides/better-auth/index.md`).
  The organization plugin is not installed, so these
  helpers are not available and not needed.
- Sharing the test auth with the production auth — the
  upstream recommendation is explicit: keep
  `testUtils()` in a separate file so it does not ship
  with the prod server. We do.

## What is not yet written

The pattern works for testing the **auth package** itself.
It does not yet work for testing **api procedures that
read user/session** — the `getProfile`-style procedures
that would benefit from `await test.login(...)` to mint a
real session and then `auth.api.getSession({ headers })`
inside the procedure.

The blocking work is twofold:

1. `packages/api/tests/` does not yet have any test that
   goes through the typed oRPC client. The PR #45 review
   surfaced this gap.
2. The test database (`TEST_DATABASE_URL`) and the
   `setup.ts` factory are wired in `packages/auth`. A
   test in `packages/api` that wants a real user would
   either need its own `setup.ts` (duplication) or a
   shared test-helper package. Neither exists yet.

The intended approach, when we get there, is:

```ts
// packages/api/tests/templates-list.test.ts (sketch, not yet written)
import { auth as testAuth } from "@workspace/auth/tests/setup"
import { call } from "@orpc/server"
import { appRouter } from "@workspace/api/router"

it("returns the templates list to an authenticated caller", async () => {
  const user = testAuth.$context.then((c) => c.test.createUser())
  const session = await testAuth.$context.then((c) => c.test.login({ userId: (await user).id }))
  // ... pass session.headers as part of the call() context ...
})
```

## What this entry is not

This is a knowledge-base entry, not an ADR. It documents how
`testUtils()` works in the current version of the lib, and
where each piece lives in our repo. The **decisions**
(which patterns we picked and why) live in
`docs/engineering/architecture/decisions/` and
`docs/engineering/architecture/rules/`. When a future
change conflicts with this entry, the entry is wrong, not
the code.

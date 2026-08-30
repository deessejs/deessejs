# Better-Auth: Client Integration

React hooks and auth client setup. See [`index.md`](./index.md) first and read [`pitfalls.md`](./pitfalls.md) before implementing anything.

> **Single-tenant:** the codebase intentionally doesn't wire the organization client plugin (`useActiveOrganization`, `authClient.organization.*`). This doc reflects that. The team removed patterns historically documented here for the org plugin. See [`org.md`](./org.md) for archived reference. <!-- vale fix: write-good.Passive -->

**Source:** [Better-Auth docs/client](https://better-auth.com/docs/client), React client reference.

---

## Auth Client Setup

```ts
// apps/app/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  // single-tenant — no plugins wired. See org.md for historical org plugin wiring.
})
```

The client is instantiated in the Next.js app. It reads from:
- `NEXT_PUBLIC_APP_URL` (for `baseURL`)
- Browser cookies (for session token)

> Single-tenant reminder: `organizationClient()` is intentionally **not** wired. Anything in `useSession().session.activeOrganizationId` will be `undefined`.

**Source:** [Better-Auth docs/client](https://better-auth.com/docs/client), `createAuthClient`.

---

## useSession

```ts
import { useSession } from "better-auth/react"

const { data: session, isLoading } = useSession()
```

Returns:
- `session.user` is the user object
- `session.session` is the session object (**doesn't** include `activeOrganizationId` in single-tenant mode)
- `session.session.expiresAt` is the session expiry
- `isLoading` is `true` while fetching session state

**Source:** [Better-Auth docs/client](https://better-auth.com/docs/client), `useSession`.

---

## useAuth

```ts
import { useAuth } from "better-auth/react"

const { user, session, isLoading } = useAuth()
```

Shorthand for `useSession()` + direct user access. `user` is `null` when not authenticated.

**Source:** [Better-Auth docs/client](https://better-auth.com/docs/client), `useAuth`.

---

## Sign In / Sign Up

```ts
// Sign in with email + password
const { data, error } = await authClient.signIn.email({
  email: "alice@example.com",
  password: "...",
})

// Sign up
const { data, error } = await authClient.signUp.email({
  email: "alice@example.com",
  password: "...",
  name: "Alice",
})
```

With error handling (important when `requireEmailVerification: true`):

```ts
await authClient.signIn.email(
  { email, password },
  {
    onError: (ctx) => {
      if (ctx.error.status === 403) {
        // Email not verified
        toast.error("Please verify your email address first.")
      }
    },
  }
)
```

**Source:** [Better-Auth docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password), `signIn.email`, `signUp.email`. [Better-Auth docs/client](https://better-auth.com/docs/client), `onError` callback pattern.

---

## Sign Out

```ts
await authClient.signOut({
  callbackUrl: "/",
})
```

**Source:** [Better-Auth docs/client](https://better-auth.com/docs/client), `signOut`.

---

## Send Verification Email

```ts
await authClient.sendVerificationEmail({
  email: "alice@example.com",
  callbackURL: `${window.location.origin}/auth/verify-email`,
})
```

**Source:** [Better-Auth docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password), `sendVerificationEmail`.

---

## Sign-out Signal

If other tabs need to react to sign-out (for example, to close WebSocket connections):

```ts
authClient.$sessionSignal.subscribe((session) => {
  if (!session) {
    // User signed out — close connections, redirect, etc.
  }
})
```

**Source:** [Better-Auth docs/client](https://better-auth.com/docs/client), `$sessionSignal` reference.

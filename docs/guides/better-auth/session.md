# Better-Auth — Session Management

Session lifecycle, cookie configuration, and expiration tuning. See [`index.md`](./index.md) first.

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — session config reference. [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies) — cookie docs. [better-auth.com/docs/concepts/session-management](https://better-auth.com/docs/concepts/session-management) — session management concept.

---

## Session Configuration

```ts
session: {
  expiresIn: 60 * 60 * 24 * 7,   // 7 days — locked in
  updateAge: 60 * 60 * 24,        // 1 day — locked in
},
```

### expiresIn

How long a session token remains valid without activity. Default: 7 days (604800 seconds). We use the default.

### updateAge

How often the session `updatedAt` is refreshed in the database. The session is only written if more than `updateAge` seconds have passed since the last update. Default: 1 day (86400 seconds). We use the default.

Shorter `updateAge` = more DB writes but faster session revocation. Longer = fewer writes but delayed revocation on logout.

### disableSessionRefresh

Set to `true` to never update `updatedAt` — session is only validated on `expiresIn`, never on `updateAge`. Useful for high-traffic read-heavy apps.

### storeSessionInDatabase

Set to `true` when using secondary storage adapters. Default: `false` (session stored in cookies only).

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — session options.

---

## Cookie Cache

Cache the session in a cookie to avoid a DB lookup on every request:

```ts
session: {
  expiresIn: 60 * 60 * 24 * 7,
  updateAge: 60 * 60 * 24,
  cookieCache: {
    enabled: true,
    maxAge: 60 * 5,  // cache for 5 minutes
  },
},
```

Cached sessions are encrypted (JWE) using the auth secret. The DB is still queried every `maxAge` interval.

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — `cookieCache`.

---

## Cookie Configuration

### Secure Cookies

Cookies are `httpOnly` and `secure` by default in production (`NODE_ENV=production`). Do **not** set `useSecureCookies: true` unconditionally — it breaks local dev without HTTPS. See [`pitfalls.md`](./pitfalls.md) §4.

**Source:** [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies) — "cookies are secure only in production by default."

### Cookie Prefix

Default prefix: `"better-auth"`. Change via:

```ts
advanced: {
  cookiePrefix: "my-app",
},
```

Resulting cookies: `my-app.session_token`, `my-app.session_data`.

**Source:** [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies) — cookie prefix.

### Cross-Subdomain Cookies

Share session across subdomains:

```ts
advanced: {
  crossSubDomainCookies: {
    enabled: true,
    domain: "app.example.com",
  },
},
trustedOrigins: [
  "https://example.com",
  "https://www.example.com",
  "https://app1.example.com",
  "https://app2.example.com",
],
```

Rules:
1. Only enable when necessary
2. Set the most specific domain possible
3. Do not share with untrusted subdomains

**Source:** [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies) — cross-subdomain cookies.

### Custom Cookie Names

```ts
advanced: {
  cookies: {
    session: { name: "my_session" },
    dontRemember: { name: "no_persist" },
  },
},
```

---

## Sign-out

Sessions are revoked by calling `auth.api.signOut()` (server) or `authClient.signOut()` (client). This deletes the session row from the DB and clears the cookie.

To revoke **all** sessions for a user (e.g., on password reset):

```ts
// In emailAndPassword.onPasswordReset callback
revokeSessionsOnPasswordReset: true,
```

Or manually:
```ts
await auth.api.deleteSession({ body: { id: sessionId }, headers })
```

**Source:** [better-auth.com/docs/concepts/session-management](https://better-auth.com/docs/concepts/session-management) — session lifecycle.

---

## Session Validation in API Routes

Use `auth.api.getSession({ headers })` to validate a session server-side:

```ts
import { auth } from "@workspace/auth"

// In a Hono/oRPC route
const session = await auth.api.getSession({ headers: request.headers })

if (!session) {
  throw new ORPCError({ code: "UNAUTHORIZED", message: "Not authenticated" })
}

// session.session and session.user are available
const { user, session: sess } = session
```

For oRPC middleware integration, see [`client.md`](./client.md) — the auth middleware wraps `getSession`.

---

## Trusted Origins

See [`setup.md`](./setup.md) for the full configuration. Always guard localhost with `NODE_ENV`:

```ts
trustedOrigins: [
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
  ...serverEnv.ALLOWED_ORIGINS,
],
```

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — `trustedOrigins` with wildcard support.

---

## Secret Rotation

better-auth supports versioned secrets for non-disruptive rotation:

```ts
export const auth = betterAuth({
  secret: "new-secret",
  secrets: ["new-secret", "old-secret-1", "old-secret-2"],
})
```

The first entry is the current key (used for signing). Older entries are decrypt-only (for validating existing sessions).

Via environment variable: `BETTER_AUTH_SECRETS=2:new,1:old`.

After rotation: keep the old secret in `secrets` for the duration of the longest session (`expiresIn`). Then remove it.

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — `secret` and `secrets` for rotation.

---
name: reference-better-auth-device-flow
description: Better Auth device authorization plugin (RFC 8628) research 2026-06-29. Use this for the `deesse auth login` CLI flow — Better Auth ships it natively, no custom OAuth code needed. Single DB table `deviceCode`, 5 endpoints (code, token, verify, approve, deny), 30min default expiration, 5s polling interval.
metadata:
  type: reference
---

Researched 2026-06-29 from `https://better-auth.com/docs/plugins/device-authorization` and the GitHub raw MDX source. **V0 fit: this is the canonical auth flow for the `deesse` CLI's `auth login` command. No need to build custom OAuth — Better Auth's plugin implements RFC 8628 (Device Authorization Grant) exactly.** Open question: separate `/device` routes vs modal-in-`/projects/[id]/cli`.

## Plugin install (server + client)

```ts
// auth.ts (server)
import { betterAuth } from "better-auth";
import { deviceAuthorization } from "better-auth/plugins";

export const auth = betterAuth({
  // ... other config
  plugins: [
    deviceAuthorization({
      verificationUri: "/device",  // must match the route of the verification page
    }),
  ],
});

// auth-client.ts (client)
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [deviceAuthorizationClient()],
});
```

Then `npx auth migrate` or `npx auth generate` to add the `deviceCode` table.

## Five endpoints (full RFC 8628 surface)

| Endpoint | Client method | Purpose |
|---|---|---|
| `POST /device/code` | `authClient.device.code()` | CLI requests device code + user code |
| `POST /device/token` | `authClient.device.token()` | CLI polls for access token |
| `GET /device` | `authClient.device()` | User verifies user code (claims it for the calling session) |
| `POST /device/approve` | `authClient.device.approve()` | User approves (requires auth) |
| `POST /device/deny` | `authClient.device.deny()` | User denies (requires auth) |

## Request / response shape

**`POST /device/code` request:**
```ts
type deviceCode = {
  client_id: string;       // required
  scope?: string;          // optional, space-separated
  user_id?: string;        // optional, pre-bind (server-side trusted only)
};
```

**Response data:**
```ts
{
  device_code: string,            // opaque, 40 chars hex by default
  user_code: string,              // short friendly code (8 chars A-Z2-9 default)
  verification_uri: string,       // e.g. "https://app.deessejs.com/device"
  verification_uri_complete: string,  // with user_code pre-filled
  expires_in: number,             // default 1800 (30min)
  interval: number,               // default 5 (seconds)
}
```

**`POST /device/token` request:**
```ts
type deviceToken = {
  grant_type: "urn:ietf:params:oauth:grant-type:device_code",
  device_code: string,
  client_id: string,
};
```

Returns `access_token` on success, error object on pending/denied/expired.

## Server configuration options (with defaults)

| Option | Default | Purpose |
|---|---|---|
| `verificationUri` | `"/device"` | URL of the verification page. Can be absolute or relative. |
| `expiresIn` | `"30m"` | Device code lifetime. |
| `interval` | `"5s"` | Minimum polling interval (enforces `slow_down` on violators). |
| `userCodeLength` | `8` | Length of the short user-facing code. |
| `deviceCodeLength` | `40` | Length of the opaque device code. |
| `generateDeviceCode` | `crypto.randomBytes(32).toString("hex")` | Override for custom entropy/format. |
| `generateUserCode` | 8 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` | Crockford-style base32 (excludes 0/O/1/I to avoid confusion). |
| `validateClient` | none | `(clientId) => boolean | Promise<boolean>` — gate which client_ids can use the flow. Always set in production. |
| `onDeviceAuthRequest` | none | `(clientId, scope?) => void | Promise` — audit/log hook. |

## Error codes (RFC 8628 compliant)

| Error | Meaning | CLI action |
|---|---|---|
| `authorization_pending` | User hasn't approved yet | continue polling |
| `slow_down` | Polling too frequently | increase interval by 5s |
| `expired_token` | Device code expired | restart flow |
| `access_denied` | User denied | exit gracefully |
| `invalid_grant` | Invalid device code or client_id | fail with diagnostic |

## Schema — single new table

**Table: `deviceCode`** (camelCase from source; Better Auth may translate to snake_case in DB — verify in the generated migration)

| Column | Type | Optional | Description |
|---|---|---|---|
| `id` | string | no | PK, unique ID for the request |
| `deviceCode` | string | no | Opaque device code (40 chars hex default) |
| `userCode` | string | no | Short friendly code (8 chars default) |
| `userId` | string | yes | User who approved/denied |
| `clientId` | string | yes | OAuth client identifier |
| `scope` | string | yes | Requested scopes |
| `status` | string | no | `pending` / `approved` / `denied` |
| `expiresAt` | Date | no | When the device code expires |
| `lastPolledAt` | Date | yes | Last poll timestamp |
| `pollingInterval` | number | yes | Min seconds between polls |

## Security properties (what Better Auth enforces for us)

1. **Rate limiting** via `interval` — polling faster returns `slow_down`
2. **Code expiration** at `expiresIn` (default 30min)
3. **Client validation** via `validateClient` — must validate in production
4. **HTTPS-only** in production (caller's responsibility)
5. **Confusion-resistant user codes** — limited charset excludes 0/O/1/I
6. **Auth required for approval** — `GET /device` claims the code for the calling session; only that session can approve/deny
7. **Pre-binding via `user_id`** — skip claiming, only that user can approve

## V0 fit — `deesse auth login` flow

The CLI flow becomes ~50 lines, no crypto, no OAuth code:

```ts
// Simplified pseudocode for `deesse auth login`
const { data, error } = await authClient.device.code({
  client_id: "deesse-cli",
  scope: "openid profile email",
});
// Show user_code, open verification_uri_complete in browser
// Poll:
const { data: token, error } = await authClient.device.token({
  grant_type: "urn:ietf:params:oauth:grant-type:device_code",
  device_code: data.device_code,
  client_id: "deesse-cli",
});
// Use the bearer access_token
```

## Open design decision for the dashboard side

The Better Auth docs assume **separate routes**:
- `/device` — page where the user types the user_code
- `/device/approve` — page where the user approves/denies
- (optionally `/device/deny`)

**For V0 this means either:**
- **(A) Add 2 routes to the inventory** → 14 routes total (auth + dashboard + projects + account + device x 2)
- **(B) Embed in `/projects/[id]/cli`** — user must be signed in (just landed from `deesse init`?), sees an inline approval modal/panel

**My recommendation: option B with a fallback to option A.** Reasoning:
- The dashboard surface is small V0; adding 2 routes for a transient flow adds maintenance
- The user flow is: `deesse init` → open dashboard → approve → done. That's one screen, one click.
- If the user opens `app.deessejs.com/device` directly (e.g., from a teammate's CLI), option A handles it via fallback

**Open question for the user:** confirm option A (separate routes) vs option B (inline approval on `/projects/[id]/cli`). This shifts the V0 inventory from 12 → 12 or 14 routes.

## Citation freshness

Sources checked 2026-06-29: docs page + `main` branch MDX on raw.githubusercontent. Plugin is on the canary branch (commit `5ded0904` for initial impl, commit `99a254a` for the session-binding fix to approval). Re-check API stability before any production binding.

Related: [[project-v0-customer-surface]] (the 12-route inventory this fits into), [[reference-template-auth-better-auth-candidate]] (broader Better Auth evaluation)
---
"app": minor
---

Adds the device authorization verification surface on the web side (ADR-020), the consumer-facing counterpart to the CLI's `deesse auth login`.

- New page at `/(unprotected)/(auth)/device` — a thin Server Component that reads `user_code` from the URL query string, validates the shape with a new Zod `userCodeSchema` (8 chars from the base32 RFC 4648 alphabet sans I, O, 0, 1), and renders the new `DeviceForm` component. Lives in the `(unprotected)/(auth)` sub-group alongside `login`, `signup`, `forgot-password`, `reset-password`, and `verify-email`, and inherits the centered `AuthContainer` layout from `(auth)/layout.tsx`.
- New `DeviceForm` client component at `apps/app/components/auth/device-form.tsx`, re-exported from the auth barrel. Owns the four device-flow states (not signed in / claimed pending / approved / denied or expired) using `@tanstack/react-query` exclusively: `useQuery` for `authClient.device({ query: { user_code } })`, two `useMutation` for `authClient.device.approve(...)` and `authClient.device.deny(...)`. No raw `useState` or `useEffect` for the state machine.
- `apps/app/lib/auth-client.ts` adds the `deviceAuthorizationClient()` Better Auth plugin so the four client methods (`authClient.device`, `device.approve`, `device.deny`, plus `device.code` and `device.token` for the CLI) are typed at the call site.
- `apps/app/app/layout.tsx` mounts a new `QueryClientProvider` at the root, mounted *outside* the theme and tooltip providers so every consumer is in scope.
- `apps/app/proxy.ts` adds `/device` to `AUTH_PREFIXES` so a user already signed in is not bounced to `/login` when the CLI opens the browser to the verification URL.

No user-visible behaviour change in normal operation. A user running `deesse auth login` on a fresh machine sees the verification page open in the browser, signs in (or is already signed in), sees an Approve / Deny panel, clicks Approve, the CLI picks up the session token on its next poll, and the user closes the tab. The page does not gate on `emailVerified` (per ADR-020); the existing email-verification gate that protects `/home` and `/settings` is unchanged.

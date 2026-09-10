---
"app": patch
---

Fixes the device verification page redirecting authenticated users to `/home` when the CLI opens the browser to `/device?user_code=XXX`. The CLI's `deesse auth login` command opens the verification URL via the OS-default browser; users already signed in to `app.deessejs.com` were bounced to `/home` instead of seeing the approve / deny panel.

Root cause: `apps/app/proxy.ts` listed `/device` in `AUTH_PREFIXES`. After ADR-022 added `/device` to the proxy's `config.matcher` so the page-level redirect (anonymous → `/login?redirect=...`) could run, the existing bounce-to-`/home` branch for authenticated users on auth pages started firing on `/device` as well — contradicting both the inline comment ("a user already signed in lands directly on the approve / deny view") and ADR-022 §"Bug B", which notes the bounce direction is wrong for this route.

Fix: remove `/device` from `AUTH_PREFIXES`. The proxy still intercepts `/device` (the matcher entry is preserved) so it can self-fetch `/api/v1/auth/get-session` and forward the session cookie, but the page-level Server Component at `app/(unprotected)/(auth)/device/page.tsx` owns the routing decision:

- Anonymous visitor → `redirect("/login?redirect=/device?user_code=<code>")` (unchanged).
- Authenticated visitor → renders `<DeviceForm userCode={userCode}>` with the approve / deny state (now reachable in practice).

No public consumer-facing API change. No new dependency. The `AUTH_PREFIXES` array's purpose — bounce authenticated users away from form-based auth pages (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`) — is unchanged; `/device` is a transactional page inside the auth flow, not an auth entry point, so it does not belong on that list. Inline comments on both `AUTH_PREFIXES` and `config.matcher` are updated to reflect the new invariant and point future readers at ADR-022 §"Bug B" for the rationale.
# Vercel + Node 20+ + Resend: outbound fetch fails silently

> Diagnosed 2026-08-06. Doc kept so the next person does not spend two hours on it again.

## Symptom

A Vercel Function that calls a third-party API (Resend in our case) intermittently fails with one of:

- `TypeError: fetch failed` (Node 18+ native fetch)
- `UND_ERR_CONNECT_TIMEOUT` (undici-specific)
- The third-party SDK returns a generic error like
  `Unable to fetch data. The request could not be resolved.` (Resend SDK).

The failure is reproducible on every request when the third-party host does not have a stable IPv6 record or when the runtime cannot reach the IPv6 path. Logs show the failure as `request failed` with no underlying error attached.

In our case, `POST https://app.deessejs.com/api/v1/auth/sign-up/email` triggered Better Auth's `sendVerificationEmail` callback, which fired-and-forgot a `sendAuthEmail(...)` call into Resend. The Resend SDK's `client.emails.send(...)` then failed with `Unable to fetch data. The request could not be resolved.`.

## Root cause

Node v20+ uses undici as its native `fetch` implementation. undici implements **Happy Eyeballs** (RFC 6555) for DNS resolution and connection setup. In Node v20+, Happy Eyeballs has a known regression:

- A (IPv4) records are tried first with a **250 ms timeout**.
- If the A lookup or connection fails (which is common on Vercel Functions, where IPv4 egress to certain destinations is restricted or slow), the lookup falls back to AAAA (IPv6).
- If the third-party host does not have an IPv6 record, or the IPv6 path is unreachable from the Vercel region, the connection fails immediately with `ENETUNREACH`.
- undici's "happy eyeballs" logic does not recover cleanly from this, and the error surfaces as a generic `fetch failed`.

The Resend SDK uses undici internally, so the same bug affects all Resend calls — not just the one we hit.

## Fix

Two environment variables on the Vercel Function runtime. **No code change required.**

| Env var | Value | Purpose |
|---|---|---|
| `NODE_OPTIONS` | `--dns-result-order=ipv4first` | Tell Node's resolver to try IPv4 before IPv6. Sidesteps the Happy Eyeballs bug. |
| `UV_THREADPOOL_SIZE` | `64` | Default is 4. With heavy concurrent I/O (e.g. Resend API calls), the threadpool can exhaust, surfacing as additional `UND_ERR_*` errors. Bumping to 64 is the standard fix cited in undici and Next.js issue threads. |

Both go in **Vercel → Project → Settings → Environment Variables → Production**. They apply to every function in the project.

A redeploy is required after setting them (Settings → Deployments → ⋯ → Redeploy).

## Verification

After the redeploy, the same `POST /api/v1/auth/sign-up/email` call succeeds. The `sendAuthEmail` flow completes without `Unable to fetch data. The request could not be resolved.`, and the verification email lands in the user's inbox.

Local repro on Node 22 confirms the same behaviour: `curl --ipv4` reaches `api.resend.com` in ~200 ms; `curl --ipv6` errors out with `Could not resolve host: api.resend.com`.

## References

- [vercel/vercel#11692 — UND_ERR_CONNECT_TIMEOUT on outbound fetch](https://github.com/vercel/vercel/issues/11692): the upstream Vercel issue with the same symptoms. Closed without a confirmed root cause.
- [nodejs/node#54359 — Happy Eyeballs timeout too short](https://github.com/nodejs/node/issues/54359): documents the 250 ms A-record timeout and the resulting `ENETUNREACH` on the AAAA fallback. The fix in this doc comes from this thread.
- [vercel/next.js#57384 — NextJS 13 returns fetch failed](https://github.com/vercel/next.js/discussions/57384): a long thread with multiple workarounds. The `dns.setDefaultResultOrder('ipv4first')` + `UV_THREADPOOL_SIZE=64` combination was the one that proved durable across multiple reporters.
- [PostHog/posthog#51661 — PostHogFetchNetworkError ETIMEDOUT on Node.js 20+](https://github.com/PostHog/posthog/issues/51661): confirms the same regression in undici's Happy Eyeballs on Node v20+, with reproducible evidence in production.
- [resend/resend-node#138](https://github.com/resend/resend-node/issues/138): the Resend SDK uses undici under the hood, so the same Node-level bug surfaces as a Resend-level error.
- [Vercel KB: troubleshooting ECONNRESET](https://vercel.com/kb/guide/troubleshooting-request-econnreset-errors): official Vercel guidance — confirms that external-service issues, IP allowlisting, and egress quirks are the usual culprits. This bug is the egress-quirks variant.

## When to suspect this bug

- The function works locally (Node 18, 20, 22 all good).
- The function intermittently fails on Vercel — sometimes 100% of the time, sometimes a flaky subset.
- The third-party SDK returns a generic "fetch failed" or "could not be resolved" with no underlying error.
- `curl <third-party-host>` works fine from the developer's laptop.
- The third-party host is behind Cloudflare, AWS CloudFront, or any CDN that may have inconsistent IPv6 reach.

If three of those four apply, suspect this bug and apply the two env vars before going deeper.

## What NOT to do

- Do **not** add retry-with-backoff on the SDK call as the first fix. Retrying in a tight loop just amplifies the load on the destination. Apply the env-var fix first, then add a one-line retry only if the error rate is still non-zero.
- Do **not** pin to a specific Vercel region "to be closer to the API". The bug is in Node, not in geographic latency.
- Do **not** add a custom `undici.Agent` to the Resend SDK without first trying the env-var fix. The custom-agent route is for the second-order case where the env vars are not enough (e.g. corporate egress proxies).

## Related code

- `packages/email/src/transports/resend.ts` — uses `Resend` SDK which uses undici internally.
- `packages/auth/src/auth.ts` — Better Auth's `sendVerificationEmail` / `sendResetPassword` callbacks invoke `sendAuthEmail`.
- `packages/email/src/index.ts` — `sendAuthEmail` is the wrapper that catches the undici error and returns the discriminated `{ ok: false, error }`.

When the env vars are set, none of these files need to change. The fix is at the runtime layer, not the application layer.

# Implementation Spec — Organizations V1 — PR-2

**Status:** ready for implementation after v15 (v14 had two residual issues: §2.5.1.1's worked example used `vi.mock("@workspace/email", () => ({ sendAuthEmail: () => smtpPromise }))` — a mock without a `vi.fn()` spy, so the subsequent `expect(sendAuthEmail).toHaveBeenCalledTimes(1)` could not pass; and §8.2's test still asserted that the captured `resolveSmtp` / `rejectSmtp` were "never called" — a redundant assertion, since the test itself owns the references and has no code that would call them. v15 replaces the factory with a `vi.hoisted(() => vi.fn(() => smtpPromise))` so the same `vi.fn()` reference is shared between the hoisted `vi.mock` factory and the test body, and removes the redundant "never called" assertion from both §8.2 and the acceptance gate. The non-blocking contract is now pinned by the structure of the test: the test owns the resolver, the callback's returned promise resolves during the test, and the resolver was never touched — the test would time out if the callback had awaited `sendAuthEmail`. v12 had earlier replaced a fragile `< 10 ms` wall-clock assertion with this by-construction check, and aligned the §3 file description with the in-process fake model)
**Parent spec:** `docs/specs/organizations-v1.md` (the post-PR-1 revision)
**Baseline:** `staging` after PR #236 (PR-1: native organization plugin wired, no application tables)
**Target branch:** `impl/223-organizations-v1/policy-and-invitation` based on `staging`
**Scope:** stateless policy helpers + invitation delivery callback + server-only auth guards. No DB changes. No new tables. No new migrations. No UI.

## 1. Goal

Add the application-layer helpers and guards that downstream PRs (3, 4b, 5, 6) consume. PR-2 ships three things:

1. A stateless policy module that validates slugs and names for the native `createOrganization` endpoint.
2. The `sendInvitationEmail` callback body, ready for PR-6 to wire the React Email template.
3. A server-only module that exposes `requireAccountSession()` and `requireOrganizationAccess(slug, action)`.

No organization lifecycle is implemented here. No members are managed here. No triggers, no migrations, no UI.

## 2. Non-goals (explicit)

- No hooks beyond `beforeCreateOrganization` in this PR. The `beforeDeleteOrganization`, `beforeRemoveMember`, `beforeUpdateMemberRole`, and `beforeUpdateOrganization` hooks are not wired. They are out of scope for PR-2; the trigger on `member` (PR-3) covers the last-owner invariant at the database layer.
- No `requireCompletedOnboarding` helper. The per-account default organization concept is removed in the post-PR-1 revision; there is no onboarding step.
- No `assertOrganizationIsDeletable`, no `assertDefaultOwnerMembershipIsRetained`, no `assertDefaultOwnerRoleIsRetained`. These guards existed in the pre-PR-1 spec to protect the per-account default; they are removed.
- No `prepareOrganizationCreation` and no onboarding protocol. The Server Action in PR-5 calls `auth.api.createOrganization` directly; no fencing token, no lease, no `accountOrganizationProvisioning` row.
- No email template, no React Email. PR-6 ships the template; PR-2 only ships the callback that will use it.
- No route additions. No `app/...` files. No `apps/app/app/(no-organization)/`. No sidebar changes. No switcher changes. PR-2 is server-only logic, with one **defensive proxy-extension** exception in §2.5.2 that may add a route-level guard to the existing `apps/app/proxy.ts` if the probe shows the option is insufficient.
- No `deliveryStatus` column, no `lastDeliveryAttempt` column, no persistent record of SMTP outcome. See §9.
- No at-least-once delivery. No queue, no worker, no "resend invitation" action. See §4.2 and §9.

## 2.5 Invitation delivery: email-verification policy (load-bearing hypothesis)

The PR-1 plugin config (in `packages/auth/src/auth.ts` → `packages/auth/src/organization/plugin.ts`) already passes `requireEmailVerificationOnInvitation: true` to `organization({...})`. PR-2 documents why this option is part of the contract, but the resolved behavior on the **locked 1.7.7 version** is treated as a hypothesis until §2.5.1 (the probe protocol) confirms it. PR-2 does not assume the option alone is sufficient.

**Threat model.** An unverified account holds the URL of an invitation it received — either because the email is delivered to the address the user controls even before they verify, or because the URL leaks through a different channel (referrer logs, chat, screenshot). Without an explicit gate, the native `acceptInvitation` endpoint can be called by an unverified session whose email matches `invitation.email`, creating the membership. The inviter believes the email is verified; the platform stores a membership tied to an address the user has not proven control of.

**Current option in config.** `requireEmailVerificationOnInvitation: true` is set in PR-1's `plugin.ts`. The Better Auth documentation recommends this option for this configuration. The option is **load-bearing** for the documented contract; flipping it off is out of scope for PR-2 and for any later PR. Removing or downgrading it must go through a separate review.

**What is NOT assumed.** The specific behavior of the locked 1.7.7 version on three points is **not** assumed by PR-2:

1. That `requireEmailVerificationOnInvitation: true` causes `acceptInvitation` to reject an unverified session. (The doc recommends it; the handler is not read yet.)
2. That `createInvitation` returns the same HTTP response shape on SMTP success and SMTP failure. (The native `sendInvitationEmail` contract is `Promise<void>`; the endpoint's response on resolve is not read yet.)
3. That the row is persisted **before** the callback runs (so a thrown callback would not write a partial record) versus **after** (so a thrown callback would still leave a row). The schema and the handler's order are not read yet.

Each of these three points is a load-bearing assumption for downstream behavior. PR-2 will not assume them; it will **measure** them.

### 2.5.1 Probe protocol (must run before §4.2 ships)

The probe is the empirical test of the three load-bearing assumptions above. It runs in **two independent artifacts**, each with its own execution model, both producing transcript rows that compose the final report:

- **Artifact A: Vitest test (`packages/auth/tests/organization/invitation-probe-a.test.ts`).** A committed Vitest test, discovered by the existing test runner (`pnpm --filter @workspace/auth test`). It uses `vi.mock` to stub `packages/email` and a controlled `serverEnv.APP_URL` per case. It exercises the **production** `invitation.ts` module through the deep path `@workspace/auth/organization/invitation`. It runs in CI on every push, and is the regression net for the three `error_reason` values (`config_invalid`, `smtp_threw`, `dispatch_rejected`) and the fire-and-forget contract. It does not toggle the `requireEmailVerificationOnInvitation` option (Mode A does not measure the option — it measures the callback).
- **Artifact B: standalone probe (`packages/auth/src/organization/__probes__/invitation-contract.probe.ts`).** A one-shot tsx script, **not** committed to the repo (the `__probes__/` directory is `.gitignore`d). It spawns `next dev` against a fake SMTP server, runs the five cases × 2 option values = 10 scenarios, writes a JSON transcript. The probe requires the email package to read its SMTP transport from env vars; if it does not, the probe fails fast with a clear error.

Neither artifact requires a change to `invitation.ts` or the auth package's exports to run. Artifact B relies on `plugin.ts` reading `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION` from the env (the only change `plugin.ts` makes for the probe); without this read, Artifact B cannot toggle the option. A `pnpm build` from a clean clone succeeds without any probe artifact. The Vitest test runs in CI like every other test in the package.

#### 2.5.1.1 Artifact A: Vitest test (callback-level)

The test lives at `packages/auth/tests/organization/invitation-probe-a.test.ts` (committed). It is a standard Vitest test that:

1. **Imports** `dispatchInvitationEmail` and `sendInvitationEmail` from `@workspace/auth/organization/invitation` (the deep path added in §6).
2. **Mocks `packages/email`** via `vi.mock("@workspace/email", ...)` at the top of the file. The mock exposes a controllable `sendAuthEmail` that resolves `{ ok: true }`, resolves `{ ok: false, error: "smtp_unavailable" }`, or rejects with an Error, per case. Vitest's module-mock machinery runs inside the test worker only and does not affect the production bundle of `invitation.ts`.
3. **Stubs `serverEnv.APP_URL`** per case via `vi.mock("@workspace/env", ...)`.
4. **Drives the four cases** (C1, C2, C3, C5) for `dispatchInvitationEmail`. Each case awaits the function directly and captures: resolution, log output (via `vi.spyOn(console, "error")`), and `sendAuthEmail` call shape.
5. **Drives the four cases for `sendInvitationEmail`** by calling it with the same data and asserting the dispatch happened through **observable side effects** (not by spying the `dispatchInvitationEmail` import — `sendInvitationEmail` and `dispatchInvitationEmail` live in the same module, and Vitest's `vi.spyOn` cannot intercept calls between functions of the same module). The two observable effects are:
   - **`sendAuthEmail` was called** (verifiable via the `vi.mock("@workspace/email", ...)` spy). If the callback is wired correctly, the mailer is invoked with the right recipient, subject, link, and tags.
   - **The structured log has the correct `error_reason`** (verifiable via `vi.spyOn(console, "error")`). The log is emitted by the single catch in `sendInvitationEmail`; its presence and shape prove that the dispatch ran and reached the catch path (for failure cases) or resolved cleanly (for success cases, where the test asserts no log was emitted).

   The non-blocking contract is asserted by **construction**, not by a wall-clock threshold and not by inspecting the SMTP promise's state (a JavaScript `Promise` has no public API to read its state synchronously, and `Promise.race` against a timeout does not observe state — it observes what happens after the timeout elapses, which is not the same thing). The test holds the SMTP resolver in its own scope and never calls it. The mock factory must use `vi.hoisted` so the `vi.fn()` reference is shared between the hoisted `vi.mock` factory and the test body:

   ```ts
   // vi.hoisted runs before vi.mock is hoisted, so the same sendAuthEmail
   // reference is available to the factory and to the test body.
   const sendAuthEmail = vi.hoisted(() => {
     let resolveSmtp!: () => void
     let rejectSmtp!: (e: unknown) => void
     const smtpPromise = new Promise<{ ok: true }>((res, rej) => {
       resolveSmtp = res
       rejectSmtp = rej
     })
     const fn = vi.fn(() => smtpPromise)
     return { fn, smtpPromise, resolveSmtp, rejectSmtp }
   })

   vi.mock("@workspace/email", () => ({
     sendAuthEmail: sendAuthEmail.fn,
   }))

   // ... in the test body ...
   const result = sendInvitationEmail(data)
   await result  // resolves successfully
   expect(sendAuthEmail.fn).toHaveBeenCalledTimes(1)
   // The test never calls sendAuthEmail.resolveSmtp or sendAuthEmail.rejectSmtp;
   // if sendInvitationEmail had awaited smtpPromise, the `await result` above
   // would never have settled (the resolver is in the test's hand, untouched).
   // The fact that result resolved proves the callback did not wait for SMTP —
   // by construction, not by observation.
   ```

   The property holds by the structure of the test: the test owns the resolver, never calls it, and the callback's returned promise resolves. If the callback had awaited `sendAuthEmail`, the `await result` would hang (the resolver is in the test's hand, untouched). The test does not pretend to inspect the SMTP promise's internal state; it observes the callback's behavior under a controlled setup. This pins the non-blocking contract without the fragility of a wall-clock threshold that can false-fail under CI load.

   The test also asserts: on a thrown transport, no unhandled-rejection event is emitted (pinned by registering a `process.on("unhandledRejection")` listener for the duration of the test and asserting it never fires).

The test asserts, for each case, exactly which of the three `error_reason` values (`config_invalid`, `smtp_threw`, `dispatch_rejected`) is emitted, and that no second log is emitted (the centralization in §4.2 guarantees at most one log per invitation — see §9). The Vitest test fails the build if any case produces a wrong `error_reason`, no log, or two logs.

#### 2.5.1.2 Artifact B: endpoint-level probe

The probe source lives at `packages/auth/src/organization/__probes__/invitation-contract.probe.ts` (gitignored; the file is regenerated by `packages/auth/scripts/run-invitation-probe.ts` on each invocation from an inlined template, so the repo never carries a stale copy). It is a tsx script that:

1. **Starts a fake SMTP server in-process** by importing `startFakeSmtpServer` from `packages/auth/src/organization/__probes__/fake-smtp-server.ts` (gitignored, regenerated by the runner from an inlined template — the repo never carries a stale copy). The fake server is a **module TypeScript**, not a subprocess: the runner and the fake share the same Node process, and the `next dev` server is the only subprocess the runner spawns. The fake listens on a free local port (e.g. `127.0.0.1:0`); the runner captures the chosen port from the return value of `startFakeSmtpServer()` and passes it to `next dev` via `EMAIL_SERVER_PORT`. The fake implements the minimum SMTP state machine that a real client expects (RFC 5321 §3.5 / §4.5). Without an initial `220` greeting, the client times out waiting for the banner and the probe blocks before reaching any test case. The state machine is:

   - **On connect**: send `220 127.0.0.1 ESMTP probe ready\r\n` immediately. The client will not send `EHLO` until it has received this greeting.
   - **On `EHLO` / `HELO`**: respond `250-127.0.0.1\r\n250 OK\r\n` (no extensions advertised; the client does not read the list).
   - **On `MAIL FROM`**: respond `250 OK\r\n` (success path) or `451 4.7.0 temporary error\r\n` and close the socket (C2 / fail path) or close the socket abruptly without a response (C3 / throw path) or hold the connection without responding (C5 / defer path). The behavior for the **next** connection is driven by the probe via the `control` object returned by `startFakeSmtpServer()` (see below).
   - **On `RCPT TO`**: same response set as `MAIL FROM`, but driven by the same `nextRespond` decision for the current connection (one decision per connection, not per command).
   - **On `DATA`**: respond `354 Send data, end with <CR><LF>.<CR><LF>\r\n`. After the client sends the data and the terminating `<CR><LF>.<CR><LF>`, respond `250 OK\r\n` (success) or `451 4.7.0 temporary error\r\n` and close (fail) or close abruptly (throw) or hold 5 s before responding (defer).
   - **On `QUIT`**: respond `221 Bye\r\n` and close cleanly.
   - **On any other command**: respond `500 Unrecognized command\r\n` (defensive; the real client should not send anything else).

   **Control API.** `startFakeSmtpServer()` returns an object:

   ```ts
   interface FakeSmtpControl {
     /** The TCP port the fake server is listening on. */
     readonly port: number
     /**
      * Set the behavior for the NEXT connection. The decision is consumed
      * atomically when the next `MAIL FROM` arrives; subsequent commands
      * on the same connection use the same decision. Calling
      * `nextRespond` again before the next connection arrives replaces
      * the pending decision.
      */
     nextRespond(behavior: "ok" | "fail" | "throw" | "defer"): void
     /** Connection statistics: total connections, last response sent, total bytes received. */
     getStats(): { connections: number; lastResponse: string | null; bytesReceived: number }
     /** Stop the server and release the port. Called on probe exit. */
     stop(): Promise<void>
   }
   ```

   The control object is the **only** way to drive the fake. There is no `globalThis.__smtpProbe` (an earlier draft of the spec mentioned this; it was ambiguous because `globalThis` is per-process, and the fake is in the same process as the runner, so the control object is direct and simpler). The runner imports `startFakeSmtpServer`, captures the returned `FakeSmtpControl`, and calls `control.nextRespond(...)` between cases. The runner never spawns the fake as a subprocess, never uses IPC, and never goes through `globalThis`.

2. **Spawns `next dev` twice** — once with `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION` unset (the production default, which is `true`, and which `next dev` reads with no extra env vars beyond `EMAIL_SERVER_HOST` / `EMAIL_SERVER_PORT`); and once with `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false` (the baseline, which the startup guard in `plugin.ts` accepts because `NODE_ENV` is unset and Next.js defaults to `development` in that case — the guard only blocks `false` when `NODE_ENV=production`). **Both spawns leave `NODE_ENV` unset**, so `next dev` runs in `development` mode and loads `.env.local` / `.env.development` as a normal dev server would. Neither spawn needs an opt-in variable to set `false`; the `development` environment is the implicit opt-in. Both spawns include `EMAIL_SERVER_HOST=127.0.0.1` and `EMAIL_SERVER_PORT=<captured port>`. The probe waits for each dev server to be ready on its configured port.

   The `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION` env var is added to `packages/env/src/schema.ts` as `z.enum(["true", "false"]).default("true")`. The schema is strict (no `z.coerce.boolean()` — `"false"` must not be coerced to `true`; the only acceptable values are the literal strings `"true"` and `"false"`). The schema entry is the single point where the production default is documented.

   **`plugin.ts` reads the validated value via `serverEnv` (so the schema's default applies) and enforces a startup guard** that prevents the test-only override from leaking into production. The guard has **no exception clause**: there is no environment variable, no combination of variables, and no `NODE_ENV` value other than `production` that permits `false` in production. The probe runs in `development` and does not need any opt-in.

   ```ts
   import { serverEnv } from "@workspace/env"

   // Read the validated value via `serverEnv`. The schema's default
   // ("true") applies when the env var is absent, so this is never
   // `undefined`. The string-typed value is then validated by the guard.
   const raw = serverEnv.REQUIRE_EMAIL_VERIFICATION_ON_INVITATION
   if (raw !== "true" && raw !== "false") {
     // Defense in depth: the schema should have already caught this.
     throw new Error(
       `[auth] REQUIRE_EMAIL_VERIFICATION_ON_INVITATION must be "true" or "false" (got ${JSON.stringify(raw)}). Refusing to start.`,
     )
   }
   if (raw === "false" && process.env.NODE_ENV === "production") {
     throw new Error(
       `[auth] REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false is not allowed in production. ` +
       `This is a test-only override and the contract is that production is "true". Refusing to start.`,
     )
   }
   const requireEmailVerificationOnInvitation = raw === "true"
   ```

   The guard **fails closed and is absolute**: an unknown value throws at startup (the process never serves traffic); `false` combined with `NODE_ENV=production` throws **with no exception** (no opt-in variable, no two-key, no environment where this is allowed); the `true` value is accepted everywhere; the var-absent case starts successfully with `true` (the schema default). The contract is "production is `true`", full stop. A Vercel production environment that sets `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false` (via project-level or team-level env vars) will refuse to start, with a clear error message, regardless of any other variable the operator might also set. The protection is one-way: the only direction the contract permits is from `false` to `true`, and the guard enforces that direction at startup.

3. **Seeds two accounts and an organization** by direct DB writes (not by HTTP signup, which would require email verification of the test accounts and pollute the transcript). The probe opens a `pg` connection to the same database the dev server uses (read from `DATABASE_URL`, passed through to the probe process) and inserts the rows directly.
4. **Runs the four cases for the read path** (C4) and the write path (C1, C2, C3, C5) by issuing real HTTP requests to each spawned dev server with the seeded users' session cookies (obtained by direct DB inspection: the probe reads the `session` token for each user and uses it in the `Cookie` header). For each case, the probe:
   - Configures the fake SMTP server's next-response behavior.
   - Issues the HTTP request.
   - Captures the response (status, body, wall-clock duration).
   - Reads the `invitation` and `member` rows from DB to confirm side effects.
5. **Shuts down** the dev servers and the fake SMTP server on exit (success or failure).

Artifact B measures what `next dev` actually does on the locked 1.7.7 version, with the production `plugin.ts` and `invitation.ts` unchanged except for the test-only env var. The env var is documented as test-only in the schema and is the only mechanism by which Mode B can toggle the option.

The probe's two artifacts produce two JSON transcripts: the Vitest test writes its captured cases to `packages/auth/tests/organization/invitation-probe-a.transcript.json` (gitignored alongside the `__probes__/` directory; the test generates it on each run), and Artifact B writes `packages/auth/src/organization/__probes__/invitation-contract.transcript.json` (gitignored). Both are committed to the PR description as fenced blocks.

#### 2.5.1.3 Five case matrix

The probe runs these five cases for **each value** of `requireEmailVerificationOnInvitation` (`true` and `false`), giving 10 scenarios in Artifact B. Artifact A runs the same SMTP cases (C1, C2, C3, C5) without the option toggle — Artifact A measures the callback, not the option.

| Case | Caller | SMTP server behavior | Endpoint | Artifact |
|------|--------|----------------------|----------|----------|
| C1   | verified user (inviter)         | responds `250 OK`              | `POST /api/auth/organization/create-invitation` | A + B |
| C2   | verified user (inviter)         | responds `451 temporary error` (deferred) | same | A + B |
| C3   | verified user (inviter)         | closes socket on first command (transport-thrown) | same | A + B |
| C4   | unverified user (recipient)     | n/a (no SMTP run)              | `POST /api/auth/organization/accept-invitation` (uses the invitation row created in C1) | B only |
| C5   | verified user (inviter)         | holds connection open for 5 s without responding | `POST /api/auth/organization/create-invitation` | A + B |

For each case, the probe asserts and reports:

- **C1, C2, C3 (write path)**:
  - HTTP status of `createInvitation` (Artifact B) or resolution of `dispatchInvitationEmail` (Artifact A).
  - Response body / resolved value.
  - Whether the `invitation` row exists in DB after the call.
  - For C2 / C3: whether the response is the same shape as C1 (best-effort hides the failure from the client), or whether a different status / body indicates the failure was surfaced to the client.
  - For C3: whether any unhandled-rejection event was emitted on the Node process (Artifact A) or the `next dev` process (Artifact B, via the captured stderr).
  - The exact `error_reason` of the structured log. The probe asserts **exactly one** log per call (the centralization in §4.2 — see §9).

- **C4 (read path, Artifact B only)**:
  - HTTP status of `acceptInvitation`.
  - Response body.
  - Whether a `member` row was created for the unverified user.
  - This is the case that exercises the load-bearing `requireEmailVerificationOnInvitation` option: with the option `true`, the membership **must not** be created; with the option `false`, the probe records the baseline (the membership is created), establishing the gap that B1 or B2 in §2.5.2 would close.

- **C5 (slow SMTP, write path)**:
  - Wall-clock duration of the response.
  - Whether the response returns within the expected bound (~50 ms for non-blocking) or blocks on the SMTP server (~5 s for blocking).
  - This is the case that exercises the `waitUntil` / detached-Promise decision in §4.2.

#### 2.5.1.4 Probe output

The probe writes two JSON transcripts (one per artifact) and a human-readable summary to stdout. Each transcript row contains:

- The artifact (A or B).
- The `requireEmailVerificationOnInvitation` value (Artifact B only; Artifact A does not toggle the option).
- The case ID (C1…C5).
- The HTTP status (Artifact B) or the resolution (Artifact A).
- The response body or resolved value.
- Wall-clock duration.
- The `invitation` row state.
- For C4 (Artifact B), the `member` row state.
- For C3, whether the process emitted an unhandled-rejection event.
- The fake SMTP server's connection count and response shape.
- The `error_reason` of the (single) structured log, if any.

**Both transcripts are committed to the PR description** (as fenced JSON blocks) so reviewers can see the resolved behavior on the locked 1.7.7 version without re-running the probe. If Artifact A fails in CI, the implementer does not open the PR — the test is gating. If Artifact B fails to start, the implementer escalates; the implementation in §4.2 does not proceed on a missing probe result.

Artifact A is a permanent Vitest test; it runs on every CI push and gates the merge. Artifact B is a one-shot measurement run during PR-2 development; the `__probes__/` directory is `.gitignore`d so the transcript and any probe artifacts do not pollute the repo.

### 2.5.2 Degraded contract: route-level mitigation if the option is insufficient

If the probe in §2.5.1 shows that `requireEmailVerificationOnInvitation: true` does **not** cause `acceptInvitation` to reject an unverified session on locked 1.7.7, PR-2 must add a **route-level** mitigation. A Server Action wrapper is **not** sufficient on its own because the native `/api/auth/organization/accept-invitation` route is independently callable from any client; a wrapper around `auth.api.acceptInvitation` is bypassed by a direct call to the route.

#### 2.5.2.1 Branch decision rule

The branch is selected by the §2.5.1 probe output. The PR description must state which branch was taken, with the transcript as evidence.

- **Branch A (probe confirms the option works).** No route-level mitigation. PR-2 ships the §4.2 callback and the §5 hook only. PR-6 re-checks `emailVerified` server-side in its Server Action as defense in depth. The C4 row of the transcript shows no `member` row created with the option `true`; the C4 row with the option `false` shows the baseline membership creation.

- **Branch B (probe shows the option is insufficient on the native route).** PR-2 adds **one** of the following two mitigations — the implementer chooses based on what 1.7.7 supports and what fits the existing auth routing:
  - **B1: extend `apps/app/proxy.ts`.** The repo is on Next.js 16, which uses the `proxy.ts` convention (replacing `middleware.ts`, deprecated in 16). The proxy file already exists and is loaded for every request to `apps.app`. PR-2 extends the existing `proxy()` export with a precise matcher entry for `/api/auth/organization/accept-invitation` and a guard that short-circuits with `403` if `emailVerified !== true`. The proxy must continue to pass through all other routes; the matcher is precise to the accept-invitation path. The proxy uses a **self-fetch** to `/api/v1/auth/get-session` (the same pattern the existing proxy already uses for `/home`, `/settings`, `/admin`, etc.) — it does not import `auth` or `@workspace/auth` directly, because Turbopack cannot bundle better-auth for the proxy runtime (the comment in `apps/app/proxy.ts:36-42` documents this constraint, and the same constraint applies to B1). The proxy is the **only** code path that decides whether an unverified session can call the native route; the Better Auth handler is not modified.
  - **B2: route disable.** If Better Auth 1.7.7 supports disabling a specific plugin route (e.g. `acceptInvitationDisabled: true` or equivalent on the plugin options, **verified against the locked types before relying on it**), the route is disabled and the only entry point is a Server Action that re-verifies `emailVerified` before calling `auth.api.acceptInvitation`. The Server Action lives under `apps/app/lib/accept-invitation-action.ts` and is the only way to accept invitations.

  Branch B1 is the default. Branch B2 is chosen only if B1 is not feasible (e.g. the proxy matcher is not precise enough to leave other `/api/auth/*` routes working, or the proxy is replaced by something that breaks the self-fetch pattern in `apps/app/proxy.ts:36-42`).

The Server Action wrapper alone (the v3 §2.5.2) is **not** an acceptable mitigation and is removed from the spec. A wrapper around `auth.api.acceptInvitation` does not protect against a direct call to the native route.

#### 2.5.2.2 What §2.5.2 does not do

- It does not modify the Better Auth handler. The plugin config keeps `requireEmailVerificationOnInvitation: true` regardless of the branch.
- It does not add a session-level check that applies to other plugins' routes. The proxy extension (B1) is scoped to `/api/auth/organization/accept-invitation` only — the matcher entry is precise, the rest of the proxy's existing matchers (`/home`, `/settings`, `/admin`, `/login`, etc.) are unchanged.
- It does not add a "resend" or "re-verify" path. The threat model is about an unverified session calling `acceptInvitation`; the mitigation blocks that session, it does not help them re-verify.

## 3. Files

`+` = new, `~` = modified.

- `~ packages/auth/src/organization/policy.ts` (currently holds only `assertOrganizationSlug`; PR-2 adds `assertOrganizationName`)
- `+ packages/auth/src/organization/invitation.ts` (defines both `sendInvitationEmail` — the Better Auth callback, `Promise<void>` — and `dispatchInvitationEmail` — the internal implementation that returns the unawaited dispatch Promise, used by tests and the §2.5.1 probe)
- `~ packages/auth/src/organization/plugin.ts` (extends `beforeCreateOrganization` to call `assertOrganizationName`; replaces the no-op `sendInvitationEmail` with the new module)
- `+ apps/app/lib/organization-auth.ts`
- `~ apps/app/proxy.ts` (only if §2.5.2 Branch B1 is taken; see §2.5.2.1 — extend the existing proxy with a precise matcher entry and an `emailVerified` guard; do not create a new `middleware.ts`, which is the deprecated Next.js 15 convention)
- `+ apps/app/lib/accept-invitation-action.ts` (only if §2.5.2 Branch B2 is taken; see §2.5.2.1)
- `~ packages/auth/package.json` (adds subpath exports for the new modules; existing entries are preserved)
- `+ packages/auth/tests/organization/policy.test.ts` (unit tests for `assertOrganizationSlug` and `assertOrganizationName`)
- `+ packages/auth/tests/organization/plugin-hook.test.ts` (unit tests for the `beforeCreateOrganization` hook as a whole, including the raw-input guarantee — see §8.1.1)
- `+ packages/auth/tests/organization/invitation-callback.test.ts` (unit tests for `dispatchInvitationEmail` — origin validation, success path, SMTP failure swallow, structured log shape; and for `sendInvitationEmail` — non-blocking dispatch, uniform `.catch`, `waitUntil` integration)
- `+ packages/auth/tests/organization/invitation-probe-a.test.ts` (Artifact A — committed Vitest test, see §2.5.1.1; runs in CI on every push)
- `+ packages/auth/tests/organization/plugin-option-guard.test.ts` (startup guard tests for `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION` — see §2.5.1.2; pins the "fail closed" property for unknown values and the "false forbidden in production" rule)
- `+ packages/auth/tests/organization/plugin-access.test.ts` (unit tests for `requireOrganizationAccess` — see §8.3)
- `+ packages/auth/src/organization/__probes__/invitation-contract.probe.ts` (Artifact B — one-shot endpoint-level probe, see §2.5.1.2; gitignored, generated by `run-invitation-probe.ts` from an inlined template)
- `+ packages/auth/src/organization/__probes__/fake-smtp-server.ts` (the local SMTP server with the full state machine described in §2.5.1.2; gitignored, generated by `run-invitation-probe.ts` from an inlined template)
- `+ packages/auth/scripts/run-invitation-probe.ts` (the committed probe runner for Artifact B; inlines the templates for the two gitignored files, ensures `__probes__/` exists, imports and starts the fake SMTP server in-process (see §2.5.1.2 for the `FakeSmtpControl` object), spawns `next dev` twice, writes the JSON transcript; invoked as `pnpm --filter @workspace/auth run-invitation-probe`)
- `~ packages/env/src/schema.ts` (adds one test-only env var: `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION: z.enum(["true", "false"]).default("true")`; no `z.coerce.boolean()`, see §2.5.1.2)
- `~ packages/auth/src/organization/plugin.ts` (reads the env var via `serverEnv` at module load, enforces the startup guard that fails closed on unknown values and refuses `false` when `NODE_ENV=production` with no exception clause, then passes the boolean to `organization({ requireEmailVerificationOnInvitation })`)
- `~ .gitignore` (adds `packages/auth/src/organization/__probes__/` if not already covered)

Note: tests live under `packages/auth/tests/` so they sit next to the module they exercise and can import the deep paths without crossing the ESLint boundary. The parent spec's `apps/app/tests/` directory remains the home for end-to-end integration tests (added in PR-7), not for unit tests of `packages/auth` helpers.

## 4. Helpers

### 4.1 `packages/auth/src/organization/policy.ts`

The module is reachable from Better Auth's runtime and does **not** import `server-only`. It can be unit-tested in isolation.

`assertOrganizationSlug(slug)` — already shipped in PR-1, unchanged.

- Regex: `^[a-z0-9](?:[a-z0-9-]{0,36}[a-z0-9])$` (mandatory trailing class; 2–38 chars).
- Reserved list: 11 top-level application segments (`account`, `admin`, `onboarding`, `accept-invitation`, `api`, `login`, `signup`, `forgot-password`, `reset-password`, `verify-email`, `device`) plus 2 product names (`deessejs`, `nesalia`).
- Throws `APIError("BAD_REQUEST", { code: "invalid_slug", message })` on either failure.

`assertOrganizationName(name)` — new.

Behavior: **validate only, do not normalize.** The function never mutates its argument. Surrounding whitespace and control characters are rejected; the original string is not modified. The trim-and-retry responsibility belongs to the **caller**, not to this helper. The Server Action in PR-5 is the only production caller and trims before calling; no caller in PR-2 trims before calling this helper (the hook in §5 is a defensive boundary and intentionally does not trim — see §5).

Contract (must be applied consistently by every caller):

- Reject any name that has leading or trailing whitespace. The helper does not trim; it rejects and lets the caller decide. The production caller (PR-5's Server Action) trims before passing the value to `auth.api.createOrganization`; the caller's contract is independent of this helper.
- Reject any name containing C0 controls (U+0000–U+001F), DEL (U+007F), or C1 controls (U+0080–U+009F). The check runs on the **original** string, before any other check.
- Reject empty, whitespace-only, or 101+-code-point names. Length is measured in **code points**, not UTF-16 code units.

```ts
export function assertOrganizationName(name: unknown): asserts name is string {
  if (typeof name !== "string") {
    throw new APIError("BAD_REQUEST", { code: "invalid_name", message: "Organization name must be a string" })
  }
  // 1. Reject control characters on the original string. C0 (U+0000–U+001F),
  //    DEL (U+007F), C1 (U+0080–U+009F). `for…of` iterates code points so
  //    surrogate pairs are handled correctly.
  for (const ch of name) {
    const cp = ch.codePointAt(0)!
    if ((cp >= 0x00 && cp <= 0x1f) || cp === 0x7f || (cp >= 0x80 && cp <= 0x9f)) {
      throw new APIError("BAD_REQUEST", { code: "invalid_name", message: "Organization name contains control characters" })
    }
  }
  // 2. Reject leading/trailing whitespace. The function does not trim; it
  //    rejects and lets the caller decide. This is a hard rule, not a hint:
  //    " Acme" and "Acme " are invalid names. The production caller
  //    (Server Action in PR-5) is responsible for trimming before calling.
  if (name !== name.trim()) {
    throw new APIError("BAD_REQUEST", { code: "invalid_name", message: "Organization name must not have leading or trailing whitespace" })
  }
  // 3. Length measured in code points. `String#length` counts UTF-16 code
  //    units, which would miscount astral characters (emoji, CJK extensions
  //    B–G) as two. The spread operator iterates code points.
  const codePoints = [...name]
  if (codePoints.length === 0 || codePoints.length > 100) {
    throw new APIError("BAD_REQUEST", { code: "invalid_name", message: "Organization name must be 1–100 code points" })
  }
}
```

Notes:

- The function does **not** mutate `name`. The trim-and-retry responsibility belongs to the caller, not to the helper. This is a single, non-contradictory rule: validate the input as given, do not silently fix it.
- Surrogate pairs are handled by `for…of` (control-character loop) and by `[...name]` (length measurement). Astral characters count as one each, so 100 emoji are within the limit.
- The function throws on the **first** failure it detects, in this order: non-string → control character → surrounding whitespace → length. The order matters only for which error message a malformed input produces; each condition is independent and exhaustive.

### 4.2 `packages/auth/src/organization/invitation.ts`

The `sendInvitationEmail` callback body. Wired in `organization/plugin.ts` to the native `organization({ sendInvitationEmail })` option. The module is reachable from Better Auth's runtime; it does **not** import `server-only`. It does **not** render React Email (PR-6 owns the template). For now, the email body is a plain text string that the existing `sendAuthEmail` helper will deliver.

The callback's argument shape is dictated by Better Auth 1.7.7. Verified against `node_modules/.pnpm/better-auth@1.7.7*/dist/plugins/organization/types.d.mts` (line 214): the function receives `{ id, role, email, organization, invitation, inviter }` where `inviter` is `Member & { user: User }` and `invitation` carries `expiresAt: Date`. The implementation re-derives the same type from the plugin's exported type so the implementation stays in sync with the lockfile.

The module exports **two** functions:

- `sendInvitationEmail(data)` — the Better Auth callback. Signature: `Promise<void>`. Resolves immediately after dispatching the work. The internal dispatch is wrapped in a `safeDispatch` Promise whose `.catch` is attached **before** the Promise is passed to `waitUntil` (Vercel) or detached (off-Vercel); both paths share the same `safeDispatch` so neither path can produce an unhandled rejection. The response does not block on SMTP, on either host. **This is what the plugin wires.**
- `dispatchInvitationEmail(data)` — the internal implementation. Signature: `Promise<void>` (resolves when the SMTP call settles, success or failure). Returns the awaited-outcome Promise so the unit tests and the §2.5.1 probe can `await` it and assert the SMTP call's behavior, including timing.

```ts
import type { OrganizationOptions } from "better-auth/plugins/organization"
import { APIError } from "better-auth/api"
import { waitUntil } from "@vercel/functions"

type SendInvitationData = Parameters<
  NonNullable<OrganizationOptions["sendInvitationEmail"]>
>[0]

// `InvitationError` is a typed error thrown by `dispatchInvitationEmail`
// to signal a specific failure category to the Better Auth callback
// (`sendInvitationEmail`). The `kind` field carries the `error_reason`
// taxonomy, and the callback is the only place that emits structured
// logs. This guarantees **at most one** log per invitation — see §9.
// The `cause` field preserves the underlying error for debugging.
export class InvitationError extends Error {
  constructor(
    public readonly kind: "config_invalid" | "smtp_threw",
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message)
    this.name = "InvitationError"
    if (options?.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

// Exported for the unit tests in §8.2 and Artifact A in §2.5.1. The
// Better Auth callback (`sendInvitationEmail`) wraps this function with
// `waitUntil` on Vercel or with a `.catch`'d detached Promise elsewhere.
// Tests and the probe await the returned Promise directly, which lets
// them assert SMTP success, SMTP failure, and exception paths
// deterministically.
//
// `dispatchInvitationEmail` does **not** call `console.error`. It only
// throws typed errors or resolves. The single point of logging is
// `sendInvitationEmail`. This avoids the double-log problem (one log
// from the dispatch path, one from the catch-all in the callback) that
// would otherwise contradict the "at most one log per invitation"
// contract in §9.
export async function dispatchInvitationEmail(data: SendInvitationData): Promise<void> {
  // 1. Validate opaque id
  if (typeof data.id !== "string" || data.id.length === 0) {
    throw new InvitationError("config_invalid", "Invitation id is missing")
  }

  // 2. Validate origin — origin-only, no path/query/fragment/credentials.
  //    The contract is "reject" not "normalize": any non-origin component is
  //    a configuration error. The implementation parses APP_URL, asserts
  //    that path, query, fragment, and credentials are all empty, and only
  //    then uses the parsed protocol + host to root the invitation link.
  //    We do **not** rely on `URL#origin` to silently discard these
  //    components — that would accept misconfigurations and produce a
  //    surprising success where the operator expected an explicit failure.
  //
  //    On any `config_invalid` failure, throw an `InvitationError` with
  //    `kind: "config_invalid"`. The callback (`sendInvitationEmail`)
  //    catches it and emits the structured log.
  let parsed: URL
  try {
    parsed = new URL(serverEnv.APP_URL)
    if (parsed.username !== "" || parsed.password !== "") {
      throw new InvitationError("config_invalid", "APP_URL must not include credentials")
    }
    if (parsed.pathname !== "/" && parsed.pathname !== "") {
      throw new InvitationError("config_invalid", "APP_URL must be origin-only (no path)")
    }
    if (parsed.search !== "") {
      throw new InvitationError("config_invalid", "APP_URL must be origin-only (no query string)")
    }
    if (parsed.hash !== "") {
      throw new InvitationError("config_invalid", "APP_URL must be origin-only (no fragment)")
    }
    // Protocol rule: HTTPS everywhere, except HTTP on loopback hosts in
    // development. The exception is narrow on purpose — it tolerates the
    // local dev server, not arbitrary non-HTTP schemes on a public host.
    // `ftp://localhost` is rejected. `http://example.com` is rejected.
    // `https://localhost` is accepted (the protocol takes priority over the
    // host when the host is a loopback).
    const isLoopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLoopback)) {
      throw new InvitationError("config_invalid", "APP_URL must be HTTPS (HTTP only on localhost or 127.0.0.1)")
    }
  } catch (error) {
    // Wrap the `URL` parse error (a `TypeError`) as a `config_invalid`
    // if it wasn't already typed. The URL constructor throws
    // `TypeError: Invalid URL` for malformed input, which is a
    // configuration error from the operator's perspective.
    if (error instanceof InvitationError) throw error
    throw new InvitationError("config_invalid", "APP_URL is not a valid URL")
  }

  // 3. Build the URL on the validated origin. The origin is constructed
  //    explicitly from the validated protocol + host, not from
  //    `URL#origin`. The earlier validation has already rejected any
  //    path/query/fragment/credentials, so the explicit construction is
  //    equivalent to `parsed.origin` for valid inputs and would surface
  //    a future URL-parsing regression in tests rather than silently.
  const origin = `${parsed.protocol}//${parsed.host}`
  const link = new URL("/accept-invitation/" + encodeURIComponent(data.id), origin).toString()

  // 4. Send the email. The function awaits `sendAuthEmail` and returns
  //    when the call settles (success, failure, or thrown). The caller
  //    (`sendInvitationEmail` for the Better Auth path; tests and the
  //    probe for the measurement path) decides whether to await.
  let result: { ok: true } | { ok: false; error: string }
  try {
    result = await sendAuthEmail({
      to: data.email,
      subject: `Invitation to join ${data.organization.name}`,
      text:
        `You have been invited to join ${data.organization.name} on DeesseJS.\n\n` +
        `Accept the invitation: ${link}\n\n` +
        `This invitation expires on ${data.invitation.expiresAt.toISOString()}.`,
      tags: [{ name: "flow", value: "organization-invitation" }],
    })
  } catch (error) {
    // 5a. Thrown transport: throw a typed `InvitationError` with
    //     `kind: "smtp_threw"`. The callback catches it and emits the
    //     structured log. We do **not** log here.
    throw new InvitationError(
      "smtp_threw",
      error instanceof Error ? error.message : String(error),
      { cause: error },
    )
  }

  // 5b. Resolved transport: `ok: false` is an SMTP-level failure. We
  //     resolve (no throw, no log) — the callback does not see a
  //     rejection on this path. The callback will not emit a log line
  //     for a successful resolution; the SMTP `ok: false` outcome is
  //     **not** currently logged.
  //
  //     This is a deliberate trade-off: `ok: false` from the mailer
  //     means the provider rejected the message before transport
  //     (e.g. invalid recipient, rate limit). It is the mailer's
  //     classification of the failure, not a transport error, and the
  //     provider's own logs are the natural place to look. PR-2 does
  //     not add a fourth log line for this case; if a future increment
  //     wants to surface it, the change is to throw a typed
  //     `InvitationError("smtp_failed", ...)` here and let the
  //     callback's single catch emit the log.
  if (!result.ok) {
    return
  }
}

// The Better Auth callback. Signature is fixed by the plugin: Promise<void>.
// This wrapper ensures the native `createInvitation` endpoint does not
// block on SMTP latency and does not surface transport errors to the
// client. It is also the **single point of structured logging** for the
// invitation flow: at most one log per invitation, with the `error_reason`
// chosen from a three-value taxonomy (see §9): `config_invalid`,
// `smtp_threw`, or `dispatch_rejected`. The `error_reason` is
// derived from the `kind` of a typed `InvitationError` when one is
// thrown, and from the generic `dispatch_rejected` bucket for any other
// unexpected runtime error.
//
// Both paths (Vercel and off-Vercel) share the same `safeDispatch`
// Promise: a `.catch` is attached **before** the dispatch is passed to
// `waitUntil` (Vercel) or detached (off-Vercel). This guarantees that no
// rejection ever reaches `waitUntil` unhandled, and that no detached
// Promise ever produces an unhandled-rejection event. The Vercel docs
// state that `waitUntil` keeps the function alive until the Promise
// settles, but they do not state that it absorbs rejections — and on
// Node 20+ a rejected Promise held only by `waitUntil` can still trigger
// an unhandled-rejection event when the function reaches its max
// duration. Attaching the `.catch` first removes the risk.
export function sendInvitationEmail(data: SendInvitationData): Promise<void> {
  const safeDispatch = dispatchInvitationEmail(data).catch((error: unknown) => {
    // Single point of logging. The `error_reason` is derived from the
    // typed `InvitationError.kind` when one is thrown. For any other
    // unexpected runtime error, the bucket is `dispatch_rejected`. The
    // log line is emitted exactly once per invitation, regardless of
    // which path the failure came from.
    let errorReason: "config_invalid" | "smtp_threw" | "dispatch_rejected"
    let errorMessage: string
    if (error instanceof InvitationError) {
      errorReason = error.kind
      errorMessage = error.message
    } else {
      errorReason = "dispatch_rejected"
      errorMessage = error instanceof Error ? error.message : String(error)
    }
    console.error(
      "[auth] organization-invitation failed",
      JSON.stringify({
        recipient_email: data.email,
        inviter_user_id: data.inviter.user.id,
        organization_id: data.organization.id,
        error_reason: errorReason,
        error: errorMessage,
      }),
    )
  })
  if (process.env.VERCEL === "1") {
    waitUntil(safeDispatch)
    return Promise.resolve()
  }
  // Off Vercel: `safeDispatch` already has its `.catch` attached, so the
  // detached Promise resolves cleanly. The `void` keeps the lint rule
  // happy about the unawaited Promise.
  void safeDispatch
  return Promise.resolve()
}
```

Notes:

- The type is derived from `OrganizationOptions["sendInvitationEmail"]`. If the lockfile bumps to a version that adds a new field, the type updates with it; no manual sync.
- `data.invitation.expiresAt` is the canonical expiry source — the invitation row is the source of truth, not a server clock.
- The text body is a placeholder. PR-6 replaces it with a call to `templates.OrganizationInvitation(...)`. The structured log fields and the `error_reason` taxonomy stay identical.
- The callback **resolves** on SMTP success and on SMTP `ok: false` (case 5b, which deliberately does not throw and does not log; see the comment in step 5b for the rationale). It rejects on two paths: a thrown transport (case 5a, throws a typed `InvitationError("smtp_threw", ...)`) and a `config_invalid` from the APP_URL check (step 2, throws a typed `InvitationError("config_invalid", ...)`). The rejections are caught by the **single** `.catch` attached to `safeDispatch` **before** the Promise is passed to `waitUntil` (Vercel) or detached (off-Vercel). The catch inspects `error.kind` to pick the `error_reason` (`config_invalid` or `smtp_threw`); for any other unexpected runtime error, the bucket is `dispatch_rejected`. **Exactly one** structured log is emitted per failed invitation, regardless of which path produced the failure. The caller of `sendInvitationEmail` (Better Auth) never sees a rejection, and no unhandled-rejection event is ever emitted, on either host. The HTTP response of `createInvitation` is identical across all three (the best-effort contract — see §9).
- **Best-effort contract (see §9):** the HTTP response of `createInvitation` is independent of SMTP latency and SMTP outcome. A thrown transport is logged but does not roll back the persisted invitation. At-least-once delivery is out of scope for V1.
- `dispatchInvitationEmail` is the function the unit tests and the §2.5.1 probe import. They `await` it directly, which gives deterministic assertions on the success / failure / thrown paths and on the log shape.

### 4.3 `apps/app/lib/organization-auth.ts`

The module is server-only. The `import "server-only"` marker is a **build-time** guard: Next.js's bundler refuses to import a file marked `server-only` from a Client Component, so the import fails the build rather than leaking the module to the browser. This is the authoritative boundary for the module; an ESLint rule is not added for this layer (see §7). The module is allowed to be imported by Server Components and Server Actions within `apps/app`; it is not allowed to be imported by Client Components, route handlers that pass through the client boundary, or anything else that would bundle for the browser.

```ts
import "server-only"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@workspace/auth"
import { db } from "@workspace/database"
import { and, eq } from "drizzle-orm"
import { organization, member } from "@workspace/database/schema/auth"

export type AccountSession = { userId: string; emailVerified: boolean }

export async function requireAccountSession(): Promise<AccountSession> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect("/login")
  return {
    userId: session.user.id,
    emailVerified: session.user.emailVerified === true,
  }
}

// Better Auth's default built-in roles. The member table column is `text`
// (verified against better-auth 1.7.7: `role: z.string()`), so the application
// must validate at runtime — a value outside this set is treated as
// "no membership sufficient for any protected action".
const KNOWN_ROLES = ["owner", "admin", "member"] as const
type OrgRole = typeof KNOWN_ROLES[number]

const ROLE_RANK: Record<OrgRole, number> = { member: 1, admin: 2, owner: 3 }

function isOrgRole(value: string): value is OrgRole {
  return (KNOWN_ROLES as readonly string[]).includes(value)
}

export type OrgAccessAction =
  | "view"
  | "view-members"
  | "manage-invitations"
  | "manage-settings"
  | "delete-organization"

// Closed list of allowed actions, used to validate at runtime. The TypeScript
// union above is the static side; this array is the runtime side. They must
// stay in sync — adding an action requires updating both, which is the
// intent: a new action is a deliberate change, not a free addition.
const KNOWN_ACTIONS: readonly OrgAccessAction[] = [
  "view",
  "view-members",
  "manage-invitations",
  "manage-settings",
  "delete-organization",
]

function isOrgAccessAction(value: string): value is OrgAccessAction {
  return (KNOWN_ACTIONS as readonly string[]).includes(value)
}

const ACTION_MIN_RANK: Record<OrgAccessAction, number> = {
  view: ROLE_RANK.member,
  "view-members": ROLE_RANK.member,
  "manage-invitations": ROLE_RANK.admin,
  "manage-settings": ROLE_RANK.admin,
  "delete-organization": ROLE_RANK.owner,
}

export type OrgAccess = { userId: string; organizationId: string; slug: string; role: OrgRole }

export async function requireOrganizationAccess(
  slug: string,
  action: string,
): Promise<OrgAccess> {
  // Validate the action at runtime. The static type narrows the call site,
  // but the function accepts `string` so a future caller that forwards a
  // dynamic value (e.g. from a query parameter) cannot bypass the rank
  // table by passing a value the union does not cover. An unknown action
  // is treated as a server-side configuration error: we log and redirect
  // to `/error?reason=misconfigured` (NOT to `/no-organization` — a bug
  // in the caller's hard-coded action list is not the same as a missing
  // organization, and the user-facing message should reflect the
  // distinction). The redirect target `/error` is added in PR-4b.
  if (!isOrgAccessAction(action)) {
    console.error(
      "[organization-auth] unknown action",
      JSON.stringify({ action, slug }),
    )
    redirect("/error?reason=misconfigured")
  }

  const { userId } = await requireAccountSession()

  // Query the organization and the active membership in a single round-trip.
  // Never use `auth.api.getOrganization({ organizationSlug })` because of the
  // active-selection side effect (see parent spec §4.2).
  const rows = await db
    .select({
      organizationId: organization.id,
      slug: organization.slug,
      role: member.role,
    })
    .from(organization)
    .innerJoin(member, and(eq(member.organizationId, organization.id), eq(member.userId, userId)))
    .where(eq(organization.slug, slug))
    .limit(1)

  const row = rows[0]
  if (!row) {
    // Distinguish "no such org" from "no membership". The org-only probe
    // runs only when the join returned nothing; a missing organization is
    // a 404-style condition (redirect to /no-organization), a missing
    // membership is a 403-style condition (redirect to /${slug}/forbidden).
    // The code below is the source of truth: §8.3 mirrors it.
    const orgRow = await db.select({ id: organization.id }).from(organization).where(eq(organization.slug, slug)).limit(1)
    if (!orgRow[0]) redirect("/no-organization")
    redirect(`/${slug}/forbidden`)
  }

  // Reject any role that is not in KNOWN_ROLES. The DB column is unconstrained;
  // a value like "guest" would otherwise pass through with rank `undefined` and
  // be granted access to every action (since `undefined < N` is false for any N).
  if (!isOrgRole(row.role)) {
    console.error(
      "[organization-auth] unknown role",
      JSON.stringify({ role: row.role, organizationId: row.organizationId, userId }),
    )
    redirect(`/${slug}/forbidden`)
  }

  if (ROLE_RANK[row.role] < ACTION_MIN_RANK[action]) {
    redirect(`/${slug}/forbidden`)
  }

  return { userId, organizationId: row.organizationId, slug: row.slug, role: row.role }
}
```

Notes:

- The `KNOWN_ROLES` array and the `isOrgRole` type guard are the runtime check. The `as OrgRole` cast is gone. The function never widens a DB value to `OrgRole` without validation.
- The 403 redirect target is `/${slug}/forbidden`. That page is added in PR-4b alongside the rest of the workspace shell. PR-2 does not create it. Until PR-4b lands, the redirect 404s — acceptable because the only callers (PR-5, PR-6) are not deployed yet.
- The 404 redirect target is `/no-organization`. Same comment: the page is added in PR-4b. PR-2 does not create it.
- The `/error?reason=misconfigured` redirect target is added in PR-4b as well, in the same batch as `/no-organization`.
- The `OrgAccessAction` type is closed; new actions require updating `ACTION_MIN_RANK`. This is intentional: it forces a review when a new action is added.

## 5. `packages/auth/src/organization/plugin.ts` changes

Two changes:

1. The `beforeCreateOrganization` hook (already wired in PR-1) is extended. The hook operates on the **raw** `input.name` (which is the value Better Auth parsed from the request body) — it does **not** trim before validation, and it does **not** mutate the value in place. Better Auth's hook contract (verified in `node_modules/.pnpm/better-auth@1.7.7*/dist/plugins/organization/types.d.mts` lines 296–334) is to throw to abort, or to return `{ data: { ...overrides } }` to override the persisted record. The hook uses both forms:
   - Throw on any validation failure.
   - On success, return `{ data: { name: input.name } }` so the persisted record carries the validated name. The validation above has already established that `input.name === input.name.trim()` (the no-surrounding-whitespace rule) and that `input.name` contains no control characters, so the override is a no-op for any input that reaches this branch. The explicit return is what tells Better Auth (and the next reader) that the persisted value is the validated name, with no implicit normalization.

   The order of checks matters: control characters and surrounding whitespace are checked on the **raw** input. A name like `"\nAcme\n"` is rejected by the control-character check (the leading and trailing `\n` are U+000A, a C0 control), not silently trimmed and persisted. A name like `" Acme "` is rejected by the no-surrounding-whitespace check. Neither value ever reaches the override.

   The hook body:

   ```ts
   beforeCreateOrganization: async ({ organization: input, user }) => {
     // 1. Narrow the optional fields. The native type marks `name` and
     //    `slug` optional, but the create endpoint parses both as
     //    required strings; reject if either is missing or wrong type.
     if (typeof input.name !== "string") {
       throw new APIError("BAD_REQUEST", { message: "Invalid organization name" })
     }
     if (typeof input.slug !== "string") {
       throw new APIError("BAD_REQUEST", { message: "Invalid organization slug" })
     }
     // 2. Run validation on the RAW input. assertOrganizationName
     //    rejects control characters and surrounding whitespace.
     //    A name like "\nAcme\n" is rejected here, before any trim.
     //    The hook does NOT trim before calling the helper — the
     //    helper is the validator, not the normalizer.
     assertOrganizationName(input.name)
     assertOrganizationSlug(input.slug)
     if (user.emailVerified !== true) {
       throw new APIError("FORBIDDEN", { message: "Email verification is required" })
     }
     if (input.metadata != null) {
       throw new APIError("BAD_REQUEST", { message: "Organization metadata is not editable" })
     }
     // 3. Return the validated name as the override. The override is
     //    a no-op by construction: the helper has already established
     //    that input.name === input.name.trim() and that input.name
     //    contains no control characters, so the value we return is
     //    identical to what was passed in. The explicit override
     //    documents the contract — the persisted record carries the
     //    validated name, with no implicit normalization step.
     return { data: { name: input.name } }
   }
   ```

   The `name: input.name` assignment is intentional: at this point the validation has already established that `input.name === input.name.trim()` and that `input.name` contains no control characters, so the override is a no-op. The explicit return is what tells Better Auth (and the next reader) that the persisted value is the validated name, with no implicit normalization.

2. The no-op `sendInvitationEmail` body in the same file is replaced with `sendInvitationEmail: sendInvitationEmail` (imported from `./invitation.js`).

The plugin order constraint is unchanged: `nextCookies()` remains the last entry. `organization` (with the new `sendInvitationEmail` wiring) is the entry immediately before it.

The `packages/auth/src/auth.ts` file imports `organizationPlugin` from `./organization/plugin.js`; no direct change to `auth.ts` is required by PR-2.

## 6. `packages/auth/package.json` exports map

The `exports` map already exists. PR-2 **adds** the new subpath entries; existing entries are preserved.

```jsonc
{
  "exports": {
    // ... existing entries are preserved ...
    "./organization/policy": "./src/organization/policy.ts",
    "./organization/invitation": "./src/organization/invitation.ts"
  }
}
```

The barrel stays clean for client-side consumers. Tests under `packages/auth/tests/` import via the deep paths. The implementation verifies the existing exports map shape during the change and merges rather than replaces.

The `scripts` field is also updated to expose the probe runner:

```jsonc
{
  "scripts": {
    // ... existing scripts are preserved ...
    "run-invitation-probe": "tsx scripts/run-invitation-probe.ts"
  }
}
```

The probe is invoked as `pnpm --filter @workspace/auth run-invitation-probe`. The `tsx` dependency is already in the auth package's devDependencies (verified against the lockfile during implementation); if not, this PR adds it.

## 7. `packages/eslint-config/base.js` rule

The previous draft proposed a `no-restricted-imports` rule that contradicted the test plan. The rule is replaced with a smaller, correct shape:

- The `no-restricted-imports` rule from the parent spec continues to apply to the **existing** deep paths in the auth package, **unchanged**. PR-2 does not add new restricted imports.
- The new deep paths (`@workspace/auth/organization/policy`, `@workspace/auth/organization/invitation`) are not restricted. They are importable from any server-side file in the monorepo, including the unit tests under `packages/auth/tests/`.
- The boundary for `apps/app/lib/organization-auth` is enforced by `import "server-only"` at the top of the file. Next.js's bundler refuses to import a `server-only` module from a Client Component, which catches accidental client imports at **build time**. No ESLint rule is needed for this layer.

This is a deliberate simplification: ESLint is a code-review aid, `server-only` is a hard build-time guard. The previous draft tried to make ESLint do both jobs and ended up blocking legitimate imports.

## 8. Tests

### 8.1 `packages/auth/tests/organization/policy.test.ts`

Unit tests for `assertOrganizationSlug` and `assertOrganizationName`. No DB, no server, no network.

`assertOrganizationSlug`:

- Accepts a well-formed slug: `"acme"`, `"acme-corp"`, `"a1"`, `"a-b-c-d"`.
- Rejects empty string, single character, 39+ characters, uppercase, non-ASCII, leading hyphen, trailing hyphen, double hyphen, space inside, reserved names (`"admin"`, `"deessejs"`, …).
- Throws `APIError` with status `BAD_REQUEST` and code `invalid_slug`.

`assertOrganizationName`:

The contract is: **validate only, do not normalize.** The function does not trim, does not mutate its argument, and rejects any name that the caller should have trimmed before calling.

- Accepts ASCII name (`"Acme Corp"`), Unicode name (`"Société Générale"`), single-char name (`"a"`), emoji (`"🚀 Studio"`), names with internal whitespace (`"a b"`).
- Accepts a name whose length in **code points** is exactly 100 (the boundary case). Build with 100 `"a"` characters → accepted.
- Accepts a name of 100 astral-plane characters (each emoji is one code point, U+1F680). Build with `"🚀".repeat(100)` → accepted. This is the test that pins the code-point measurement: `String#length` would return 200 and the previous draft would have rejected it.
- Rejects a name of 101 code points (the boundary case). Build with 101 `"a"` characters → rejected.
- Rejects a name of 101 astral-plane characters (each emoji is one code point). Build with `"🚀".repeat(101)` → rejected.
- Rejects:
  - `null`, `undefined`, number, object.
  - Empty string, whitespace-only (`"   "`).
  - **Leading whitespace**: `" Acme"` is rejected with `invalid_name`. This is the test that pins the "no surrounding whitespace" rule. The caller is expected to trim before calling.
  - **Trailing whitespace**: `"Acme "` is rejected with `invalid_name`. Same reasoning.
  - Control characters anywhere in the string: `"\u0000"`, `"\u0001"`, `"\u001f"`, `"\u007f"`, `"\u0080"`, `"\u009f"`. The check runs on the **original** string, before any length measurement.
  - **Surrounding whitespace plus control character**: `" \u0000 "` is rejected (the control character is detected on the original string; if the test were re-ordered, the function would have rejected for the wrong reason).
- Throws `APIError` with status `BAD_REQUEST` and code `invalid_name`.
- The function does **not** mutate its argument. Verify by passing a string with surrounding whitespace (`" Acme "`) and asserting that the original is unchanged after the call returns (the function rejects with `invalid_name`; the assertion confirms the rejection path did not silently trim and store the trimmed form).

### 8.1.1 `packages/auth/tests/organization/plugin-hook.test.ts`

Tests that exercise the `beforeCreateOrganization` hook end-to-end, **not** the `assertOrganizationName` helper in isolation. The hook is the entry point; if the helper is correct but the hook trims before calling, a name like `"\nAcme\n"` slips through. The previous draft did not have this test; PR-2 adds it.

The test calls the hook with a hand-built `data` argument (matching the Better Auth `beforeCreateOrganization` type signature, verified in `node_modules/.pnpm/better-auth@1.7.7*/dist/plugins/organization/types.d.mts` lines 296–334) and asserts:

- **`"\nAcme\n"`** (leading and trailing newline, U+000A): the hook **throws** `APIError("BAD_REQUEST", { code: "invalid_name" })`. The newline is detected on the **raw** input, before any normalization. The hook does **not** trim. The hook does **not** return `{ data: { name: "\nAcme\n" } }` — the trim was never applied.
- **`" Acme "`** (leading and trailing space): the hook throws `APIError("BAD_REQUEST", { code: "invalid_name" })`. The space is detected on the raw input. Same reasoning.
- **`"Acme"`** (no surrounding whitespace, no controls): the hook **resolves** to `{ data: { name: "Acme" } }`. The override is a no-op (the raw input is already trimmed and control-free), and the returned data echoes the validated name.
- **`"A\u0000cme"`** (control character mid-string): the hook throws. The control character is detected on the raw input, regardless of position.
- **Missing `input.name`**: `input.name` is `undefined`. The hook throws `APIError("BAD_REQUEST", { message: "Invalid organization name" })` (the type-narrowing branch in step 1 of §5).
- **`user.emailVerified !== true`**: the hook throws `APIError("FORBIDDEN", { message: "Email verification is required" })`. This is the existing PR-1 behavior; the test pins it across the PR-2 changes.
- **`input.metadata != null`**: the hook throws `APIError("BAD_REQUEST", { message: "Organization metadata is not editable" })`. Same as above; existing PR-1 behavior pinned by the test.

The test does **not** mock or stub `assertOrganizationName`; it calls the hook directly. The hook is the unit under test. The helper is reachable through the hook, and the hook's behavior on each input is what matters in production.

### 8.2 `packages/auth/tests/organization/invitation-callback.test.ts`

Unit tests for `dispatchInvitationEmail` (the internal implementation) and `sendInvitationEmail` (the Better Auth callback). The mailer is mocked; `serverEnv.APP_URL` is injected per test. The test pins the **single-point-of-logging** contract: `dispatchInvitationEmail` does not call `console.error`; `sendInvitationEmail` calls it at most once per failed invitation, with the right `error_reason`.

**For `dispatchInvitationEmail`:**

- **Origin validation** (the contract is **reject**, not normalize — see §4.2 and §9). On any failure, the function throws a typed `InvitationError("config_invalid", message)` — **not** an `APIError`, **not** a generic `Error`. The test asserts `error instanceof InvitationError && error.kind === "config_invalid"` for each case.
  - Throws `config_invalid` when `APP_URL` is unset, malformed, includes credentials (`https://user:pass@x.com`), includes a path (`https://example.com/foo`), query (`https://example.com?x=1`), or fragment (`https://example.com#x`). The mailer is **not** called in any of these cases; the function fails before reaching the mailer.
  - **Protocol rule** (per §4.2):
    - `https://example.com` → accepted (resolves).
    - `http://localhost` → accepted (resolves).
    - `http://127.0.0.1` → accepted (resolves).
    - `https://localhost` → accepted (resolves).
    - `ftp://localhost` → **rejected** with `config_invalid`.
    - `http://example.com` → rejected with `config_invalid`.
    - `ftp://example.com` → rejected with `config_invalid`.
  - Resolves the call and dispatches the email when the origin is valid.
  - The accept-invitation link is built on the origin constructed from the validated components. The test asserts the link's protocol and host match the configured `APP_URL`'s protocol and host.
- **SMTP success**: `sendAuthEmail` returns `{ ok: true }`; the function resolves. The mailer was called with the right recipient, subject, link, and tags.
- **SMTP failure (`ok: false`)**: `sendAuthEmail` returns `{ ok: false, error: "smtp_unavailable" }`; the function **resolves** (does not throw, does not log). The test asserts no `console.error` was called. This is the deliberate trade-off in step 5b of §4.2.
- **SMTP throws**: `sendAuthEmail` rejects with an `Error`; the function throws a typed `InvitationError("smtp_threw", error.message, { cause: error })`. The test asserts `error instanceof InvitationError && error.kind === "smtp_threw"`, and that `error.cause` is the original Error. The test asserts no `console.error` was called from inside `dispatchInvitationEmail`.
- **Empty invitation id**: throws `InvitationError("config_invalid", "Invitation id is missing")`.
- **Type fidelity**: the mock receives a `SendInvitationData` argument whose shape matches `Parameters<NonNullable<OrganizationOptions["sendInvitationEmail"]>>[0]`. The test asserts that the `data.inviter.user.id`, `data.organization.id`, and `data.invitation.expiresAt` fields are read from the right place.
- **No `console.error` from `dispatchInvitationEmail`**: across all cases, the test asserts that `console.error` was **not** called by `dispatchInvitationEmail`. This pins the centralization of logging in `sendInvitationEmail`.

**For `sendInvitationEmail` (the Better Auth callback):**

- **Resolves without waiting for SMTP** (asserted by construction, not by wall-clock or promise-state inspection): the test configures `sendAuthEmail` to return a `Promise` whose resolver and rejecter the test captures in local variables via `vi.hoisted` (so the same `vi.fn()` reference is shared between the `vi.mock` factory and the test body — see the worked example in §2.5.1.1). The test calls `sendInvitationEmail(data)` and awaits the returned promise. The test then asserts:
  - The `sendInvitationEmail` returned promise resolved successfully.
  - The `sendAuthEmail` mock was called exactly once (proves the dispatch started and reached the mailer).
  - The structured log is absent (success case) or present with the expected `error_reason` (failure cases — pinned separately below).

  The test does **not** spy on the captured `resolveSmtp` / `rejectSmtp` and does **not** assert they were never called. The test itself owns these references and has no reason to call them; asserting "they were never called" would be redundant (the test is the only thing that could have called them, and the test does not). The non-blocking property holds by the structure of the test: the test owns the resolver, the callback's returned promise resolves during the test, and the resolver was never touched by the test. If the callback had awaited `sendAuthEmail`, the `await` on the callback's returned promise would have hung (the resolver is in the test's hand, untouched) — the test would time out. The test pins the non-blocking contract by the structure of the test itself, not by reading the SMTP promise's internal state (which has no public API in JavaScript) and not by a wall-clock threshold.
- **No log on success**: the test asserts that `console.error` was **not** called when the underlying dispatch resolves successfully.
- **Exactly one log on `config_invalid`**: the test configures an invalid `APP_URL`; the test asserts that the callback resolves (does not reject) and that `console.error` was called **exactly once** with `error_reason: "config_invalid"` and the specific check message. The test pins both the `error_reason` and the "exactly one log" property.
- **Exactly one log on `smtp_threw`**: the test configures `sendAuthEmail` to reject; the test asserts that the callback resolves, and that `console.error` was called **exactly once** with `error_reason: "smtp_threw"` and the mailer's error message. No unhandled-rejection event is emitted.
- **Exactly one log on `dispatch_rejected`**: the test injects a synthetic non-`InvitationError` throw into the dispatch (e.g. by stubbing `URL` to throw a plain `Error`); the test asserts the callback resolves and `console.error` was called **exactly once** with `error_reason: "dispatch_rejected"`. The test pins the catch-all bucket.
- **No log on `ok: false`**: the test configures `sendAuthEmail` to resolve `{ ok: false, error: "smtp_unavailable" }`; the test asserts the callback resolves and `console.error` was **not** called. The `ok: false` outcome is the mailer's own classification; the platform does not log it.
- **Waits for the dispatch on Vercel**: with `process.env.VERCEL = "1"`, the test asserts that the `waitUntil` call was made (by spying on the imported `waitUntil`). The dispatch is not awaited directly; the test asserts the side effect (the `waitUntil` call) and that the function returned a resolved Promise.
- **No `waitUntil` off Vercel**: with `process.env.VERCEL` unset, the test asserts that `waitUntil` was **not** called. The dispatch Promise is detached with `void`, and its `.catch` is the same `.catch` that the Vercel path uses.
- **Type fidelity**: the test asserts that the callback's argument has the same shape as `dispatchInvitationEmail`'s argument.

### 8.3 `packages/auth/tests/organization/plugin-access.test.ts`

Unit tests for `requireOrganizationAccess`. The test sets up a SQLite-in-memory DB (or the test harness already used by `packages/auth/tests/`) and seeds an `organization` and `member` row for each case. `auth.api.getSession` is stubbed to return a fixed session per case.

**Session and membership cases:**

- **No session** (`getSession` returns `null`): the function calls `redirect("/login")`. The membership query is not executed. Pinned by spying on the `redirect` import.
- **Organization absent**: the `organization` row for the slug does not exist. The function calls `redirect("/no-organization")` (after the org-only probe, which returns no row). The membership query returns no row, the org-only probe returns no row, the redirect is `/no-organization`.
- **Organization present, no membership**: the `organization` row exists, but no `member` row links the user to it. The function calls `redirect("/${slug}/forbidden")` (after the org-only probe confirms the org exists). The membership query returns no row, the org-only probe returns a row, the redirect is `/${slug}/forbidden`. This case is what v3 of the spec mis-stated as `/no-organization`; the test pins the correct target.

**Role × action matrix (15 cases — the full 3 × 5):**

| Role \ Action | view | view-members | manage-invitations | manage-settings | delete-organization |
|---------------|------|--------------|--------------------|-----------------|---------------------|
| owner         | ✅   | ✅           | ✅                 | ✅              | ✅                  |
| admin         | ✅   | ✅           | ✅                 | ✅              | ❌ → `/${slug}/forbidden` |
| member        | ✅   | ✅           | ❌ → `/${slug}/forbidden` | ❌ → `/${slug}/forbidden` | ❌ → `/${slug}/forbidden` |

Each cell is a separate test. The eight `❌` cells assert the redirect target. The seven `✅` cells assert the function returns an `OrgAccess` value with the expected `role`. Together, the 15 cases pin:

- `view` and `view-members` are the only actions a `member` can perform (rank `1`).
- `manage-invitations` and `manage-settings` are admin-only (rank `2`).
- `delete-organization` is owner-only (rank `3`).
- An `owner` can do anything in the matrix.

**Threshold tests** (separate, named to make the invariants explicit):

- `member` can do `view-members` (rank `1`) but not `manage-invitations` (rank `2`). The boundary is between rank `1` and rank `2`.
- `admin` can do `manage-settings` (rank `2`) but not `delete-organization` (rank `3`). The boundary is between rank `2` and rank `3`.

These two threshold tests are the **minimum** that pins the rank table; the 15-case matrix is exhaustive on top of them. If the rank table is edited in the future, the threshold tests catch off-by-one rank errors; the matrix catches typos in `ACTION_MIN_RANK` mappings.

**Unknown values:**

- **Unknown role** (the `member.role` column holds `"guest"`): the function logs `[organization-auth] unknown role` and calls `redirect("/${slug}/forbidden")`. The redirect does **not** go to `/no-organization` — a foreign role in the DB is a permission issue, not a missing-org issue.
- **Unknown action** (the caller passes a typo like `"manage-invitation"` instead of `"manage-invitations"`): the function logs `[organization-auth] unknown action` and calls `redirect("/error?reason=misconfigured")`. The redirect does **not** go to `/no-organization` — an unknown action is a server-side configuration error, not a missing-org condition, and the user-facing page should reflect the distinction. The `/error?reason=misconfigured` page is added in PR-4b alongside `/no-organization` and `/${slug}/forbidden`.

## 9. Decision produit: SMTP failure is logged only, every pending invitation shows the same status, delivery is best-effort

The decision for V1 is the **second** of the two options the previous draft left open. The choice is made in PR-2 and is **not deferred**:

- PR-2 does **not** add a `deliveryStatus` column, a `lastDeliveryAttempt` column, a sibling table, or any other persistent record of the delivery outcome. A timestamp is not enough — even with a timestamp, the UI cannot tell "delivered" from "delivery failed"; both look like "an attempt was made at T". The only way to record the outcome durably is a separate `deliveryStatus` column, which is a migration.
- The callback resolves on both success and SMTP failure. The native `createInvitation` endpoint writes the row, runs the callback (non-blocking — see §4.2), and returns. The HTTP response is the same shape regardless of what happens inside the callback.
- The invitation status column carries one of `pending | accepted | rejected | canceled` (verified in `node_modules/.pnpm/better-auth@1.7.7*/dist/plugins/organization/schema.mjs`). Every `pending` invitation looks the same in the UI. The UI **cannot** distinguish "delivered" from "delivery failed"; the structured log is the only signal.
- The callback logs `[auth] organization-invitation failed` with `error_reason: "smtp_threw"` on a thrown SMTP transport and `error_reason: "config_invalid"` on an APP_URL misconfiguration. **At most one** log is emitted per failed invitation, and only when there is a failure to report. Successful resolutions (SMTP `ok: true` or `ok: false`) produce no log line. Operators correlate by `recipient_email` + `organization_id` + approximate timestamp. The observer of the log is the operator, not the inviter.

**Best-effort delivery contract.** The HTTP response of `createInvitation` does not wait for SMTP. A failed SMTP delivery does not roll back the persisted invitation. A thrown SMTP transport is logged but does not propagate to the client. In serverless environments, the dispatch is bound to `waitUntil` to keep the function alive; in long-lived Node processes, the dispatch is a detached Promise with an explicit `.catch`. **Delivery is best-effort**: the platform does not promise at-least-once, does not promise that the email reaches the inbox, and does not promise a manual "resend" path. The UI shows "invitation sent — check your spam folder" without offering a retry. If the email is lost (process killed between dispatch and SMTP completion on a long-lived Node host, or function instance recycled before `waitUntil` settled on Vercel), the row is the audit trail and the operator's log is the diagnostic.

If a future product increment needs at-least-once delivery or a UI-distinguishable delivery status, that increment must add a queue and a worker (for at-least-once) and / or a migration (for the UI status). Both are out of scope for V1 and out of scope for PR-2.

Rationale for the "log only, no retry" choice:

- The Better Auth `sendInvitationEmail` contract is `Promise<void>`; the resolved value carries no signal to the native endpoint. The native endpoint does not roll back the persisted invitation on resolve. The empirical verification on the locked 1.7.7 version is the responsibility of the §2.5.1 probe. PR-2 does not assume either behavior.
- The callback runs non-blocking. The HTTP response of `createInvitation` is independent of SMTP latency and SMTP outcome. A failed SMTP delivery does not roll back the persisted invitation: the inviter's intended state is "I invited this person", not "I forgot I invited this person". The row is the audit trail.
- A delivery failure is transient. The structured log is the diagnostic signal; an operator with access to the log transport can correlate and (if a future increment adds a resend action) re-trigger. PR-2 does not add the resend action; the UI shows "invitation sent (check your spam folder)" without offering a manual retry.

What is **not** in PR-2:

- No retry with exponential backoff.
- No replay path.
- No persistent record of delivery outcome (no new column, no new table, no new index).
- No UI status beyond the native `status` field on the invitation. The UI shows `Pending` for every `pending` row regardless of delivery outcome.
- No "resend invitation" action. The UX does not promise a manual retry path.
- No at-least-once delivery. No queue, no worker.

What is **in** PR-2:

- The non-blocking dispatch with a single `.catch` attached to the dispatch Promise **before** the host branch (§4.2 `sendInvitationEmail`). The `.catch` is the **only** place that calls `console.error` in the invitation flow.
- The structured log line, emitted **at most once per invitation**, with `error_reason` chosen from a three-value taxonomy:
  - `config_invalid`: an APP_URL misconfiguration (invalid URL, credentials, path, query, fragment, wrong protocol). The check is in `dispatchInvitationEmail` step 2, which throws a typed `InvitationError("config_invalid", message)`. The catch in `sendInvitationEmail` reads `error.kind` and emits the log.
  - `smtp_threw`: `sendAuthEmail` rejected with an Error. `dispatchInvitationEmail` step 5a throws a typed `InvitationError("smtp_threw", message, { cause })`. The catch reads `error.kind` and emits the log.
  - `dispatch_rejected`: any other unexpected runtime error from the dispatch (e.g. an exception thrown by a future refactor that is not an `InvitationError`). The catch uses this bucket as the default.

  The three values are mutually exclusive. The order of the dispatch path is `config_invalid` check → mailer call → result handling, so the first failure emits the corresponding log. Successful resolutions (SMTP `ok: true` or `ok: false`) produce no log line — `ok: false` is the mailer's classification of the failure (e.g. invalid recipient, rate limit) and lives in the mailer's own logs; PR-2 deliberately does not add a fourth log line for it. A future increment that wants to surface `ok: false` in the platform's logs can throw `InvitationError("smtp_failed", ...)` from step 5b without changing the catch in `sendInvitationEmail`.
- The resolvable behavior on SMTP failure and on a thrown transport.
- The best-effort contract documented here and exposed to the user through the UI copy.

## 10. Acceptance gates

Before PR-2 is marked ready for review:

- [ ] Artifact A (the §2.5.1.1 committed Vitest test `invitation-probe-a.test.ts`) passes in CI, and its captured transcript is committed to the PR description.
- [ ] Artifact B (the §2.5.1.2 endpoint-level probe) has run against the locked 1.7.7 version, and its JSON transcript is committed to the PR description. The PR description states which branch of §2.5.2 was taken (no mitigation, B1 proxy extension, or B2 route disable) and cites the transcript rows for cases C1, C2, C3, C4, C5 as evidence.
- [ ] `packages/env/src/schema.ts` declares `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION: z.enum(["true", "false"]).default("true")` (no `z.coerce.boolean()`). The schema test in `packages/env/tests/` asserts that the value `"false"` is parsed as `"false"` (not coerced to `true`), the value `"true"` as `"true"`, and an absent env var defaults to `"true"`.
- [ ] `plugin.ts` reads `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION` via `serverEnv` (not via `process.env` directly), so the schema's `.default("true")` applies when the env var is absent. The startup guard in §2.5.1.2 enforces: an unknown value (anything other than the literal strings `"true"` and `"false"`) throws at module load; the combination `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false` AND `NODE_ENV=production` throws **with no exception clause**; the value `true` is accepted in all environments; the var-absent case starts successfully with `true` (pinned by the test in `plugin-option-guard.test.ts`). The guard fails closed and is absolute: there is no opt-in variable, no two-key, no environment in which `false` is permitted in production. A Vercel production environment that sets the var to `false` will refuse to start, with a clear error message, regardless of any other variable the operator might also set. `INVITATION_PROBE_ALLOW_INSECURE` does not exist in the schema, in `plugin.ts`, or in the probe — it is not a configuration knob.
- [ ] Artifact B's probe spawns `next dev` with `NODE_ENV` **unset** (so Next.js runs in `development` mode and loads `.env.local` / `.env.development` as a normal dev server). The `false`-baseline spawn sets `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false`; the production-shape spawn sets nothing. Neither spawn uses `NODE_ENV=test`, which would make Next.js load `.env.test` and ignore the dev config. The `development` environment is the implicit opt-in for the `false` baseline; the production-shape spawn (no var, `true` default) does not need an opt-in.
- [ ] `pnpm --filter @workspace/auth typecheck` passes.
- [ ] `pnpm --filter @workspace/auth lint` passes.
- [ ] `pnpm --filter @workspace/database typecheck` passes (no schema change but the build chain may still need re-running).
- [ ] `pnpm --filter apps/app typecheck` passes.
- [ ] `pnpm --filter apps/app lint` passes. The `import "server-only"` marker in `apps/app/lib/organization-auth.ts` is verified by Next.js's bundler.
- [ ] `pnpm --filter @workspace/auth build` produces no warnings.
- [ ] The new unit tests pass: `pnpm --filter @workspace/auth test -- organization/policy organization/plugin-hook organization/invitation-callback organization/invitation-probe-a organization/plugin-option-guard organization/plugin-access`.
- [ ] Existing tests pass: `pnpm test` at the repo root.
- [ ] No new tables, no new migrations. One new test-only env var is added to `packages/env/src/schema.ts`: `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION` (default `true`). The startup guard in `plugin.ts` reads it via `serverEnv`, fails closed on unknown values, and refuses to start the process if `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false` AND `NODE_ENV=production`. The contract is "production is `true`", enforced at startup with **no exception clause**. There is no other variable, no two-key, and no environment where `false` is permitted in production.
- [ ] The plugin order in `packages/auth/src/auth.ts` is unchanged: `deviceAuthorization`, `bearer`, `admin`, `organization` (with the new `sendInvitationEmail` wiring), `nextCookies` last.
- [ ] The `beforeCreateOrganization` hook validates the **raw** `input.name` (control characters, surrounding whitespace, length) before any override. The hook does **not** trim before calling `assertOrganizationName`. The override `{ data: { name: input.name } }` is a no-op that documents the contract; it is reached only when validation has already established `input.name === input.name.trim()` and `input.name` contains no control characters. Pinned by the test in §8.1.1.
- [ ] `assertOrganizationSlug` is unchanged from PR-1 (the same regex, the same reserved list, the same error code).
- [ ] The barrel `packages/auth/src/index.ts` does **not** re-export `organization/policy` or `organization/invitation`.
- [ ] The placeholder text body in `dispatchInvitationEmail` is annotated with a `TODO` (or equivalent) that points at PR-6 for the React Email template.
- [ ] The `SendInvitationData` type is derived from `OrganizationOptions["sendInvitationEmail"]`, not hand-written.
- [ ] The `OrgRole` cast is gone. `isOrgRole` validates the value at runtime before any rank lookup.
- [ ] The `OrgAccessAction` runtime check is in place: `isOrgAccessAction` rejects unknown actions with a redirect to `/error?reason=misconfigured` (NOT `/no-organization`) and a structured log line. The static union is the development-time guard; the runtime guard is the production-time guard. Pinned by the test in §8.3.
- [ ] The `requireOrganizationAccess` test in §8.3 covers all 15 role × action combinations (3 roles × 5 actions) plus the two threshold tests plus the three session / membership / unknown-role / unknown-action branches. The "organization present, no membership" case asserts the redirect target is `/${slug}/forbidden`, **not** `/no-organization`.
- [ ] The `dispatchInvitationEmail` callback rejects `APP_URL` values that include a path, query, fragment, or credentials. The rejection happens **before** the mailer is called. There is no path through the callback where a non-origin `APP_URL` is silently normalized.
- [ ] The protocol rule is **HTTPS everywhere, except HTTP on loopback**. `ftp://localhost` and `http://example.com` are both rejected. `https://localhost` and `http://localhost` are accepted. `http://127.0.0.1` is accepted. Pinned by a test in §8.2.
- [ ] `sendInvitationEmail` (the Better Auth callback) does not block on SMTP latency. The unit test in §8.2 holds the `sendAuthEmail` resolver in a local variable (via `vi.hoisted` so the same `vi.fn()` reference is shared between the `vi.mock` factory and the test body) and never calls it; the test asserts (a) the `sendInvitationEmail` returned promise resolved during the test, (b) the `sendAuthEmail` mock was called exactly once. The test does not assert anything about the captured resolver (the test owns it and has no reason to call it — an "it was never called" assertion would be redundant). If the callback had awaited `sendAuthEmail`, the test's `await` on the callback's returned promise would have hung (the resolver is in the test's hand, untouched) — the test would time out. The non-blocking property is asserted by the structure of the test, not by reading the SMTP promise's internal state (which has no public API in JavaScript) and not by a wall-clock threshold.
- [ ] `sendInvitationEmail` attaches a `.catch` to the dispatch Promise **before** branching on the host. The same `safeDispatch` is used for both the Vercel path (passed to `waitUntil` from `@vercel/functions`) and the off-Vercel path (detached with `void`). The `.catch` inspects `error.kind` to choose the `error_reason`: `config_invalid` (typed `InvitationError("config_invalid", ...)`), `smtp_threw` (typed `InvitationError("smtp_threw", ...)`), or `dispatch_rejected` (any other unexpected error). The catch emits **at most one** structured log per invitation, and no unhandled-rejection event is emitted on either path. Both paths are pinned by tests in §8.2.
- [ ] `sendInvitationEmail` is the **single point of structured logging** for the invitation flow. It emits **at most one** log per failed invitation, with `error_reason` chosen from a three-value taxonomy: `config_invalid` (APP_URL misconfiguration — typed `InvitationError("config_invalid", ...)` thrown in step 2), `smtp_threw` (transport rejected — typed `InvitationError("smtp_threw", ...)` thrown in step 5a), or `dispatch_rejected` (any other unexpected runtime error caught by the single `.catch`). Successful resolutions produce no log. Each value is pinned by a test in §8.2; the "exactly one log" property is pinned by an additional test that asserts the log count is `0` for success and `1` for each failure path. The HTTP response of `createInvitation` is identical across all three failure modes (best-effort contract — §9).
- [ ] `assertOrganizationName` measures length in **code points** (`[...name].length`), not UTF-16 code units (`String#length`). The boundary tests (100 and 101 code points, ASCII and astral) pin this.
- [ ] `assertOrganizationName` rejects leading and trailing whitespace without mutating its argument. The trim is the caller's responsibility.
- [ ] `requireEmailVerificationOnInvitation: true` is in the PR-1 plugin config and is preserved by PR-2. The option is documented in §2.5 as load-bearing for the contract. The behavior is treated as a hypothesis until §2.5.1 confirms it; §2.5.2 is implemented only if the probe shows the option is insufficient, and the §2.5.2 mitigation is **route-level** (extension of `apps/app/proxy.ts` on the native route, or route disable), never a Server Action wrapper alone.
- [ ] The `import "server-only"` marker in `apps/app/lib/organization-auth.ts` is the build-time boundary; this is documented in §4.3 and §7, not described as a "runtime guard".

## 11. Rollout

PR-2 has no runtime impact on deployed users. The native `organization` plugin was already wired in PR-1; the policy validation and the email delivery callback are additive. The `sendInvitationEmail` no-op in PR-1 is replaced with the real callback in PR-2, but no invitation flow is user-reachable until PR-6 lands (the `/accept-invitation/[id]` page is created in PR-6; the Server Action that calls `auth.api.createInvitation` is created in PR-6).

If §2.5.2 Branch B1 is taken, the existing `apps/app/proxy.ts` is extended with a precise matcher entry for `/api/auth/organization/accept-invitation` and an `emailVerified` guard. The proxy is loaded on every request to `apps.app`; the new branch only fires when the path matches, so all other routes pass through. The extension runs after the build is deployed; until the build is deployed, the native route is unmediated, which is acceptable because no invitation flow is user-reachable before PR-6.

Artifact B is invoked by running `pnpm --filter @workspace/auth run-invitation-probe`. The script is declared in `packages/auth/package.json` (see §6) and runs the runner via `tsx`. The runner is the single entry point for the probe; the gitignored files under `__probes__/` are produced by the runner on its first run and regenerated on each subsequent run.

No env var changes for production. One new test-only env var is added to `packages/env/src/schema.ts`: `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION` (default `true`). The var is read by `plugin.ts` at module load via `serverEnv`. The startup guard (see §2.5.1.2) refuses to start the process if `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false` AND `NODE_ENV=production`. The contract is "production is `true`", enforced at startup with **no exception clause**. A Vercel production environment that sets `REQUIRE_EMAIL_VERIFICATION_ON_INVITATION=false` (via project-level or team-level env vars) will fail to start, with a clear error message, regardless of any other variable the operator might also set. No secret rotations. No DB migrations. No Vercel environment configuration (the Vercel detection is via `process.env.VERCEL`, which is automatic).

## 12. References

- Parent spec: `docs/specs/organizations-v1.md` (post-PR-1 revision)
- PR-1: `impl/223-organizations-v1/refactor` (merged as PR #236)
- `packages/auth/src/auth.ts` — current plugin stack, TS2883 rationale
- `packages/auth/src/organization/plugin.ts` — current `beforeCreateOrganization` hook (extended in PR-2)
- `packages/auth/src/host-allowlist.ts` — apex + wildcards
- `packages/email/src/index.ts` — `sendAuthEmail` discriminated union
- `packages/env/src/schema.ts` — `APP_URL`
- `apps/app/lib/admin-auth.ts` — server-only guard pattern; `headers: await headers()` forwarding
- `packages/database/src/schema/auth.ts` — `organization` and `member` table shapes used by `requireOrganizationAccess`
- Better Auth 1.7.7 organization plugin types: `node_modules/.pnpm/better-auth@1.7.7*/dist/plugins/organization/types.d.mts` (line 214: `sendInvitationEmail` callback shape; lines 296–334: `beforeCreateOrganization` hook contract)
- Better Auth 1.7.7 organization plugin schema: `node_modules/.pnpm/better-auth@1.7.7*/dist/plugins/organization/schema.mjs` (lines 14–34: `role: z.string()`, `expiresAt: z.date()`)
- Better Auth docs on invitation: <https://better-auth.com/docs/plugins/organization>
- Better Auth docs on email and serverless: <https://better-auth.com/docs/concepts/email> and <https://better-auth.com/docs/infrastructure/services/email> (recommendation to use `waitUntil` or an equivalent in serverless environments; recommendation not to block the HTTP response on SMTP latency)
- Better Auth security advisory GHSA-fmh4-wcc4-5jm3 (cited in §2.5.2: route-level mitigation is the recommended pattern when the plugin's option is insufficient)
- Vercel `waitUntil` documentation: <https://vercel.com/docs/functions/functions-api-reference#waituntil>
- Next.js `server-only` package: documented in `https://nextjs.org/docs/app/getting-started/server-and-client-components` — the build refuses to bundle a `server-only` module into a Client Component, which is the authoritative build-time boundary for the new `apps/app/lib/organization-auth.ts` module.

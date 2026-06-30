# C1 — V0 customer surface

> **Source:** Cloud tech lead, 2026-06-29.
> **Inputs:** V0 scope clarification (project mgmt + CLI link + license verification + analytics), Better Auth org plugin (off in V0), `apps/app/` scaffolding (post cloud→app rename).
> **Scope:** enumerate the user-facing routes for V0. List the 12 pages we ship, the 3 we defer, and the open questions to resolve before build.
>
> **VERDICT (one line up front):** V0 ships **14 routes** in 5 buckets — 5 auth + 2 device auth + 1 dashboard + 5 projects + 1 profile. No landing, no onboarding wizard, no billing in `apps/app/` — all three either live in `apps/web/` (marketing) or are deferred to V1.

---

## 1. V0 scope recap (what we're building toward)

V0 is **not** the managed hosting tier. V0 is the minimum loop that lets a DeesseJS user register a project, link the `deesse` CLI to it, and see basic analytics.

- **Auth** — sign up / sign in (Better Auth, single user per workspace, no org plugin)
- **CLI auth** — `deesse auth login` uses Better Auth's **device authorization plugin** (RFC 8628) with separate `/device` and `/device/approve` routes (option A — see §4.1)
- **Projects** — CRUD a project, get a project key, link it from the CLI
- **License** — per-project key validated at each CLI call (HTTP check, no crypto in V0)
- **Analytics** — events emitted by `deesse` CLI / template, stored in a shared DB, read by the dashboard

What V0 does **NOT** include:
- Per-tenant Vercel project provisioning
- Per-tenant Turso DB provisioning
- PASETO `DEESSEJS_SECRET` envelope (that's V1)
- Stripe Connect / billing
- Resend subdomains
- Multi-user workspaces / invitations
- Per-tenant DB browser (Drizzle Studio embed)
- Better Auth admin view
- Trigger.dev background jobs
- Upstash realtime / counters

---

## 2. The 14 routes we ship

### 2.1 Auth (5)

| Route | Purpose |
|---|---|
| `/login` | Sign in (email + password) |
| `/signup` | Create account |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password (token from email) |
| `/verify-email` | Confirm email (only if Better Auth enforces verification in V0 — see §5) |

### 2.2 Device auth (2)

Used by the `deesse auth login` flow. See §4.1 for the full RFC 8628 flow.

| Route | Purpose |
|---|---|
| `/device` | User lands here from the CLI. Enters the user code shown in the terminal. If not signed in, redirect to `/login` with return URL, then back here. The `GET /device` endpoint claims the code for the calling session. |
| `/device/approve` | User clicks **Approve** or **Deny** after entering the code. Requires authentication. On success, the CLI's polling loop receives an `access_token`. |

### 2.3 App shell (1)

| Route | Purpose |
|---|---|
| `/dashboard` | Overview: list of user's projects + recent events across all projects |

### 2.4 Projects (5)

| Route | Purpose | Notes |
|---|---|---|
| `/projects` | Full list with filters (search by name, sort by last activity) | |
| `/projects/new` | Create form. Returns project key + next-step instructions on success | First project triggers inline onboarding |
| `/projects/[id]` | Single project view: overview, license status, recent events | Analytics is folded into a tab here (no separate route) |
| `/projects/[id]/cli` | **The heart of V0.** Copy-paste `deesse init` command + project key + CLI status (linked or not). Does **not** host the device approval — that's on `/device` + `/device/approve` (see §4.1). | |
| `/projects/[id]/settings` | Rename, regenerate key (destructive — invalidates CLI sessions), delete (modal) | |

### 2.5 Account (1)

| Route | Purpose |
|---|---|
| `/profile` | Name, email, password change, delete account |

---

## 3. Routes we DO NOT ship in V0

| Route | Status | Why |
|---|---|---|
| `/` (landing / marketing) | Lives in `apps/web/`, not `apps/app/` | The marketing site is its own app; the dashboard redirects to `/dashboard` if signed in, `/login` if not |
| `/onboarding` | No — inline on `/dashboard` empty state | A single CTA "Create your first project" is sufficient for V0 |
| `/billing` | No — V0 license is free during beta | Defer until we have a paid tier (V1) |
| `/projects/[id]/analytics` | Folded into `/projects/[id]` as a tab | V0 analytics is shallow; one tab keeps the route count down |
| Multi-user / team management | No | V0 is single user per workspace; no org / no invitations |
| Workspace settings (`/settings`) | No | No org-level config in V0; profile lives at `/profile` |

---

## 4. Auth pages — reuse vs build

The template ships `LoginCard` / `SignupCard` / `ForgotPasswordCard` (commit `4712a92` in `apps/template/apps/web/`).

**Recommendation:** reuse the same visual pattern in `apps/app/`. Copy the card components, adapt copy for the dashboard context, ship with Better Auth's built-in handlers. Saves ~1-2 days vs designing from scratch.

**Open decision:** brand the auth pages as "DeesseJS App" or keep generic. Recommend "DeesseJS App" since this is a different product surface than the marketing site.

### 4.1 CLI auth — Better Auth device authorization (RFC 8628)

The `deesse auth login` command uses **Better Auth's native device authorization plugin**. We do **not** write any custom OAuth code — the plugin implements RFC 8628 (Device Authorization Grant) for us.

**Flow:**
1. CLI calls `authClient.device.code({ client_id: "deesse-cli" })` → gets a `user_code` + `verification_uri`
2. CLI prints the user code and opens `verification_uri_complete` in the user's browser
3. User lands on `/projects/[id]/cli` (or `/login` if not signed in, with redirect back)
4. User enters the user code in the inline panel
5. User clicks **Approve** (or **Deny**)
6. CLI is polling `authClient.device.token({...})` in the background
7. On success, CLI receives an `access_token` it can use as a Bearer for subsequent calls (e.g., `deesse status`, `deesse init`)

**Defaults from Better Auth:**
- Device code expires after **30 minutes** (configurable via `expiresIn`)
- Minimum polling interval **5 seconds** (configurable via `interval`)
- User code = **8 chars** base32 (charset excludes 0/O/1/I)
- Device code = **40 chars** hex (256 bits entropy)
- Errors follow RFC 8628: `authorization_pending`, `slow_down`, `expired_token`, `access_denied`, `invalid_grant`

**One new DB table:** `deviceCode` (10 columns, managed by the plugin). Add via `npx auth migrate`.

**Route decision (resolved 2026-06-29):**
Better Auth's docs assume two separate routes (`/device` and `/device/approve`). We chose **option A — separate routes**, lifting the V0 surface to 14 routes:
- The dashboard follows Better Auth's expected pattern; less custom UI to build for the device flow itself
- `/projects/[id]/cli` stays focused on **CLI instructions** (copy-paste `deesse init` + project key + linked status) — it does not host the approval UX
- The `/device` page is the standard "enter your code" screen, `/device/approve` is the standard "approve this device" screen — both implemented as Better Auth's expected pattern

**Effort delta:** +1 wk for the two device routes (vs +0.5 wk for an inline panel on `/projects/[id]/cli`).

Full reference in `documents/internal/product/app/` → see [[reference-better-auth-device-flow]] in memory.

---

## 5. Open questions (decide before build)

1. ~~**CLI auth route strategy**~~ — **RESOLVED 2026-06-29:** option A (separate `/device` + `/device/approve` routes). Documented in §4.1. Inventory lifted from 12 → 14 routes.

2. **Email verification** — does Better Auth enforce email verification in V0?
   - If yes: ship `/verify-email` → 12 routes.
   - If no: drop it → 11 routes.
   - Recommendation: **yes**, ship `/verify-email`. License analytics attribution requires a verified email.

3. **Single project view layout** — one tab (overview + analytics merged) vs two tabs (overview | analytics)?
   - Recommendation: **two tabs**. Keeps the overview scannable and gives analytics its own breathing room.

4. **Regenerate key UX** — confirm modal? Destructive enough to warrant one?
   - Recommendation: **yes**, modal. Regenerate invalidates any CLI currently linked — user must re-run `deesse init`.

5. **Delete project** — modal from `/projects/[id]/settings`?
   - Recommendation: **yes**, modal. Type-project-name to confirm.

6. **Empty states** — what does `/dashboard` show for a brand-new user with zero projects?
   - Recommendation: empty state with illustration + CTA "Create your first project" → `/projects/new`.

---

## 6. Effort estimate (V0, given the 14 routes)

Roughly **7-9 engineer-weeks** end-to-end:
- Auth surface (5 routes + Better Auth wiring): 1 wk
- Device auth surface (2 routes — `/device` + `/device/approve`): 1 wk
- Dashboard + projects list + create form: 1.5 wk
- Single project view (overview + analytics tab): 1 wk
- CLI linking page (the heart of V0): 1 wk
- Settings (rename / regenerate / delete): 0.5 wk
- Profile + delete account: 0.5 wk
- Empty states + polish + tests: 1-1.5 wk

Assumes the template's auth card components are reused. Add 1-2 wk if we design fresh.

---

## 7. What this gives us

A V0 surface that's:
- **Minimum viable loop** — sign up → create project → link CLI → see analytics. Nothing else.
- **Cheap to ship** — 12 routes, no per-tenant provisioning, no crypto, no Stripe, no Vercel API.
- **Easy to extend** — the deferred routes (`/billing`, `/onboarding`, multi-user) are explicit V1 add-ons, not refactors.
- **Decoupled from marketing** — `apps/web/` for content, `apps/app/` for the dashboard. Different audiences, different cadences.

---

## 8. Out of scope for this doc

- V1 managed hosting tier (see `tech-2026-06.md` and the existing A/B docs)
- Per-tenant DB browser (Drizzle Studio embed — V1, see `B3-secret-lifecycle.md` context)
- Better Auth admin view for cross-tenant ops (V1+)
- CLI command surface (separate doc needed — `deesse auth login`, `deesse init`, etc.)
- Pricing model (owned by the user, flagged not authored here)
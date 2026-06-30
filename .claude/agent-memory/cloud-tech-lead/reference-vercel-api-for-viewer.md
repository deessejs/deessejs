---
name: reference-vercel-api-for-viewer
description: Vercel REST API endpoint mapping for the read-only "Cloud viewer" tier (proposed 2026-06-26). Lists which endpoints power which viewer features, plus what's NOT possible via the API. Companion to [[project-cloud-viewer-tier-idea]].
metadata:
  type: reference
---

Compiled 2026-06-26 in support of the viewer-tier proposal ([[project-cloud-viewer-tier-idea]]). Maps Vercel REST API endpoints to the specific features a read-only dashboard would need. **All endpoints confirmed available as of 2026-06-26.** Rate limits and OAuth scope details marked **[non vérifié]** need pre-build verification.

## Auth — Sign in with Vercel

- `POST https://vercel.com/oauth/authorize` — redirect user to consent
- `POST https://api.vercel.com/login/oauth/token` — exchange code for tokens
- `GET https://api.vercel.com/login/oauth/userinfo` — user identity
- `POST https://api.vercel.com/login/oauth/token/introspect` — RFC 7662 introspection
- `POST https://api.vercel.com/login/oauth/token/revoke` — revoke

**Tokens:** ID Token (JWT) + Access Token (1h bearer) + Refresh Token (30d, rotating)
**Scopes:** `openid email profile offline_access` (openid required, others optional)
**PKCE:** S256 required
**Env vars convention:** `VERCEL_APP_CLIENT_ID`, `VERCEL_APP_CLIENT_SECRET`
**Callback URL:** `{origin}/api/auth/callback`

**In Better Auth:** configured via `socialProviders.vercel` (PR #6316, merged 2025-11-26). 3-step setup per Better Auth docs.

## Listing user data

| Viewer feature | Endpoint | Notes |
|---|---|---|
| List user's Vercel teams | `GET /v2/teams` | Needs auth via user's access token |
| Team details | `GET /v1/teams/{teamId}` | |
| Team members | `GET /v1/teams/{teamId}/members` | Optional — not needed for MVP |
| List team's projects | `GET /v11/projects?teamId={teamId}` | Paginated, filterable |
| Project details | `GET /v11/projects/{idOrName}` | Framework, git repo, createdAt, etc. |
| Project deployments | `GET /v11/projects/{idOrName}/deployments` | Paginated, can filter by state |
| Deployment detail | `GET /v11/deployments/{id}` | state, url, createdAt, buildingAt, ready |
| Build logs | `GET /v1/projects/{idOrName}/deployments/{id}/logs` | Build output |
| Runtime logs | `GET /v1/projects/{idOrName}/logs` | Filter by time range, status code |
| Analytics / usage | `GET /v1/projects/{idOrName}/analytics/endpoints/logs.all` | SQL-style query interface |
| Analytics aggregate | `GET /v1/projects/{idOrName}/analytics` | Bandwidth, invocations, build minutes |

## Real-time updates (webhooks)

Subscribe at `POST /v11/projects/{idOrName}/webhooks` per-project.

**Relevant events for viewer:**
- `deployment.created` — new build kicked off
- `deployment.succeeded` / `deployment.ready` — deployment live
- `deployment.failed` / `deployment.error` — deployment broken
- `project.created` / `project.removed`
- `domain.created` / `domain.verification` / `domain.verified`
- `check.completed` (cron-based health checks)

**Signing:** HMAC-SHA1, header `x-vercel-signature`, secret `WEBHOOK_SECRET` configured at create.
**Timeout:** 30s for 2xx response. After that, retry.
**Retry:** up to 24h with exponential backoff. Implement dedup table on `(webhook_id, delivery_id)`.

## What's NOT possible via the API (limitations of the viewer)

### ❌ No unified "user → all projects across teams" endpoint

The viewer must chain:
1. Sign in → user identity
2. List teams → user's teams
3. For each team, list projects
4. For each project, list deployments

N+1 queries expected on the listing screen. **Mitigation:** cache aggressively (teams/projects change slowly; deployments change frequently).

### ❌ No "view as user X" admin impersonation

Vercel uses the OAuth token of the authenticated user. No operator-side override. **Implication:** the viewer can ONLY show projects the user has consented to share. If a user has 3 Vercel teams, they must consent to each separately.

### ❌ No log streaming time réel

The logs API is query-based, not stream-based. For "watch this build live," need either aggressive polling (every 2-3s during active build) or WebSocket connection (existence **[non vérifié]**).

### ❌ No source code access

The API shows git repository linkage but not file content. To browse code, the user goes back to GitHub/GitLab.

### ❌ No "this is a DeesseJS project" indicator from Vercel

Vercel doesn't know what framework a project uses beyond `framework` (e.g., "nextjs"). The viewer must detect DeesseJS via a marker file placed in the template.

**Recommended marker:** `deessejs.config.json` at the project root, or a specific entry in `package.json` (e.g., `"@deessejs/template": "x.y.z"`). The viewer fetches the repo's `package.json` via GitHub/GitLab OAuth to check.

### ❌ No publicly documented rate limits for viewer-critical endpoints

The Limits page lists hundreds of quotas per endpoint family but doesn't isolate `/v11/projects?teamId=` or `/v11/projects/{id}/deployments`. **Pre-build verification:** benchmark these endpoints with a test account before committing to the MVP scope.

## Proposed viewer architecture

```
┌──────────────────────────────────────────────────────────┐
│  app.deessejs.com (CF Workers Edge — existing control plane)  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Better Auth handler                                 │   │
│  │  socialProviders.vercel                              │   │
│  │  → access_token + refresh_token in Better Auth      │   │
│  │    session (encrypted)                              │   │
│  └────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Viewer endpoints (Hono routes)                     │   │
│  │  GET /api/teams            (uses stored token)     │   │
│  │  GET /api/projects/:team   (proxies Vercel)        │   │
│  │  GET /api/deployments/:id  (proxies Vercel)        │   │
│  │  POST /api/webhooks/vercel (receives Vercel events)│   │
│  │  GET /api/analytics/:id    (proxies Vercel)        │   │
│  └────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Cache layer (Upstash Regional — already in stack) │   │
│  │  Teams: 1h TTL                                      │   │
│  │  Projects: 5min TTL                                 │   │
│  │  Deployments: 30s TTL (or invalidate via webhook)  │   │
│  │  Analytics: 1h TTL                                  │   │
│  └────────────────────────────────────────────────────┘   │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Worker (Trigger.dev v4 — already in stack)         │   │
│  │  Weekly email digest via Resend (already in stack)  │   │
│  │  Anomaly detection: 5+ failed deploys in 1h → email│   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**No new vendors.** CF Workers + Better Auth + Upstash + Trigger.dev + Resend = all from the existing 8-vendor stack baseline. The viewer is a **configuration of the existing control plane**, not a new product.

## Effort estimate

5-7 engineer-weeks for MVP. Detailed breakdown in [[project-cloud-viewer-tier-idea]].

## Open questions for pre-build verification

1. WebSocket endpoint for live log streaming — does it exist? (try `wss://api.vercel.com/v1/projects/{id}/logs?follow=true` — **[non vérifié]**)
2. Exact rate limits on `/v11/projects` list and `/v11/projects/{id}/deployments` list
3. Required OAuth scopes to access team projects (likely `team:read` + `project:read` — verify)
4. Whether Vercel accepts third-party OAuth apps from arbitrary publishers (vs partners only)
5. Marker file strategy: `deessejs.config.json` vs `package.json` entry vs git tag — what's least invasive

Related: [[project-cloud-viewer-tier-idea]] (the strategic idea), [[research-snapshot-2026-06-26]] (vendor sources), [[reference-template-auth-better-auth-candidate]] (Better Auth × Vercel OAuth)
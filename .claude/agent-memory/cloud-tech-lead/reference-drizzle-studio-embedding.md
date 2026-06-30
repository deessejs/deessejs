---
name: reference-drizzle-studio-embedding
description: Drizzle Studio research 2026-06-26 — three offerings (local dev / embeddable component / Drizzle Gateway), pricing model, embedding pattern. Relevant for step 2 of viewer-first roadmap (Turso + Drizzle Studio embedded).
metadata:
  type: reference
---

Researched 2026-06-26 in support of step 2 proposal for the viewer-first Cloud roadmap (see [[project-cloud-viewer-tier-idea]]).

## Three Drizzle Studio offerings

### A. `drizzle-kit studio` — local dev (free, not for prod)

- CLI: `npx drizzle-kit studio`
- Default server: `127.0.0.1:4983`
- Config via `drizzle.config.ts` (`dialect`, `dbCredentials.url`)
- Configurable host/port via flags
- `--verbose` flag for SQL logging
- Safari/Brave need mkcert for HTTPS local
- **Explicitly not for production / remote use** per official docs

### B. `@drizzle-team/studio` — embeddable component (B2B, closed source)

**This is the option relevant for step 2.**

- Framework-agnostic web component (React, Vue, Svelte, VanillaJS)
- Distributed as **private npm package** with company branding: `@drizzle-team/your-company-studio`
- Usage pattern (React):
```tsx
import StudioScript from '@drizzle-team/your-company-studio?raw';

<drizzle-studio
  ref={studioRef}                                          // programmatic control
  css-variables={JSON.stringify(theme === 'light' ? light : dark)}  // theming
  title="Drizzle Studio"
  style={{ flexGrow: 1, minHeight: 0 }}
/>
```

**Features :**
- Programmatic ref API (reload, execute query, navigate)
- Custom theming via CSS variables (light/dark)
- **Opt-in SQL query runner** (can be disabled)
- In-place editable JSON support
- Advanced filtering
- Custom branding per customer

**Pricing :** opaque, "contact sales". Depends on:
- Platform size (we'd be small for v0)
- Customer-facing vs internal use (we'd be customer-facing = higher)
- Sponsorship tier (reduced pricing if we sponsor Drizzle OSS)

**Notable customers (validates the pattern) :**
- **Turso** — first customer since Oct 2023
- **Neon** (Postgres)
- **SQLite Cloud**
- **Replit, Deno, Kinsta, Create.xyz, Sevalla, Netlify, QwikBuild, Specific**
- **AI platforms** (Replit, Deno, Kinsta, Create.xyz) — same playbook we'd follow

**License:** NOT open source. "Open sourcing would've broken our ability to provide B2B offerings and monetise it."

**Contact:** DM `aleksandrblokh@gmail.com` or Discord `#drizzle-studio` channel.

### C. Drizzle Gateway — Dockerized self-hosted (alpha)

- `gateway.drizzle.team`
- Dockerized version of Drizzle Studio designed for VPS deployment
- **Alpha status — not production-ready**
- Could be a fallback if `@drizzle-team/studio` pricing is prohibitive
- Risk: alpha software for a customer-facing product is risky

## Pairing with Turso (perfect match)

For step 2, we pair Drizzle Studio embedded with Turso scoped per-tenant tokens. Confirmed capabilities from `docs.turso.tech`:

| Capability | How |
|---|---|
| Mint per-DB token | `POST /v1/organizations/{org}/databases/{db}/auth/tokens` |
| Read-only scope | `?authorization=read-only` |
| Full-access scope | `?authorization=full-access` |
| Expiration | `?expiration=15m` (or `7d`, `30d`, `never`) |
| Fine-grained permissions | `-p all:data_read -p comments:data_add,data_update` |
| Returned as | JWT (`{ "jwt": "..." }`) |
| Revoke all | `POST /v1/.../auth/rotate` (invalidates ALL, brief downtime) |

**Security model for step 2:**
- Mint short-lived (15min) read-only token when user opens studio
- Token scoped to one DB
- Auto-expire or rotate via auth/rotate on sign-out
- Drizzle Studio component receives URL + JWT, talks to Turso directly
- If read-only bypass risk materializes → proxy via CF Workers that filters writes

## Step 2 flow (when viewer user opens DB browser)

```
1. User signed in with Vercel via Better Auth
   - Vercel access_token, user_id, teams list cached

2. User clicks "Browse DB" on a DeesseJS project

3. Viewer (CF Workers) checks:
   - Does this Vercel user own this tenant DB?
   - Look up mapping table: vercel_user_id + vercel_team_id → tenant_id → turso_db_name
   - If no mapping → "Link your Vercel team to your DeesseJS project" UI

4. If mapping OK:
   POST https://api.turso.tech/v1/organizations/{op-org}/databases/{tenant-db}/auth/tokens
     ?expiration=15m
     &authorization=read-only
   → { jwt: "..." }

5. Render Drizzle Studio embed with URL + token:
   <drizzle-studio
     dbUrl={tursoUrl}
     authToken={jwt}
     title={`${tenantName} DB`}
   />

6. At T+15min or on sign-out:
   - Revoke: POST /v1/.../auth/rotate
   - User must re-mint to continue browsing
```

## Risks for step 2 (must resolve before ship)

1. **Drizzle Studio pricing** — opaque, contact sales. DM Drizzle Team with our numbers (30 tenants, customer-facing). If prohibitive, fallback to Drizzle Gateway (alpha) or fork the local-dev version.
2. **Read-only enforcement** — verify Drizzle Studio respects read-only Turso tokens. Test in sandbox. If bypass, proxy through CF Workers or build custom query UI.
3. **Auth mapping** — "who owns which DB". Recommended: read tenant DB name from Vercel env vars (`TURSO_DB_NAME` + `VERCEL_TEAM_ID`) via Vercel REST API. Fallback: manual user declaration.

## Effort estimate

6-7 engineer-weeks for step 2 MVP, on top of step 1's 5-7 weeks.

## Open questions

- **[non vérifié]** Exact Drizzle Studio embeddable pricing for our use case
- **[non vérifié]** Does Drizzle Studio respect Turso read-only tokens?
- **[non vérifié]** Can Drizzle Studio be themed to match DeesseJS Cloud branding fully?
- **[non vérifié]** Does Drizzle Studio work against libSQL/Turso over HTTP, or only WebSocket?

Related: [[project-cloud-viewer-tier-idea]] (the strategic idea + roadmap), [[reference-vercel-api-for-viewer]] (step 1 API mapping)
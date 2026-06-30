---
name: project-cloud-viewer-tier-idea
description: Strategic idea proposed 2026-06-26 — start "DeesseJS Cloud" as a read-only viewer for DeesseJS users to see their Vercel projects + deployments, as a funnel toward the managed hosting tier. User explicitly said "don't change anything yet" — this is an idea to revisit, not a decision.
metadata:
  type: project
---

On 2026-06-26, after we finished the Better Auth × Vercel research, the user proposed a strategic idea: **start DeesseJS Cloud as a read-only viewer** for DeesseJS users to see their DeesseJS projects and Vercel deployments if they host on Vercel. The user asked for my opinion, then said "don't change anything, I want your opinion."

**Current state of this idea:** **PROPOSED, NOT DECIDED.** No docs to amend yet. No code. Just an idea to revisit when the user is ready.

## The idea in one paragraph

Instead of shipping the full managed hosting tier (operator provisions per-tenant Vercel projects, mints secrets, etc.), ship a **free, read-only viewer** first. The viewer lets any DeesseJS user sign in with their Vercel account and see their DeesseJS-related Vercel projects + deployments + usage. The viewer is the **funnel** to the managed hosting tier (which remains the paid product).

## My opinion (delivered 2026-06-26)

**Yes, this is strategically sound, AS A FUNNEL not a replacement.** Three reasons:
1. **PLG (product-led growth) pattern** — proven by Vercel itself (deploy button first, hosting later), Stripe (API first, Atlas later), Linear (free first, enterprise later).
2. **Validates demand cheaply** — 5-7 engineer-weeks for MVP vs 3-6 months for managed hosting.
3. **Reuses existing infra** — Sign in with Vercel + Vercel REST API + CF Workers = no new vendors.

## Product positioning if we go this way

**"DeesseJS Cloud" = two tiers, same brand:**

| Tier | Price | Surface | Target |
|---|---|---|---|
| **Viewer** | Free | Read-only dashboard DeesseJS+Vercel | All DeesseJS users deploying on Vercel |
| **Managed Hosting** | $99/mo (existing plan) | Provisioning + ops + support | Design partners wanting outsourced infra |

**Viewer is the marketing of Managed Hosting.** Not a standalone destination.

## What the viewer would need

**Auth:** Sign in with Vercel via Better Auth (PR #6316 — already merged).

**Data sources:** Vercel REST API at `api.vercel.com/v1` and `/v11` — for listing projects, deployments, analytics. Detailed endpoint mapping in [[reference-vercel-api-for-viewer]].

**Infra:** Same CF Workers control plane planned for managed hosting. The viewer becomes the management UI for the managed hosting tier — same code base, two positionings.

**Detection:** A marker file (e.g., `deessejs.config.json`) in the DeesseJS template that the viewer can detect to filter "this is a DeesseJS project" from "all Vercel projects the user has."

## Scope (what's IN)

- "Sign in with Vercel" button
- List user's Vercel teams
- For each team: list projects, filter for DeesseJS-detected ones
- For each DeesseJS project: latest 5 deployments + status, basic analytics (bandwidth, invocations)
- Webhooks subscription for real-time deployment notifications
- Email digests via Resend (weekly summary of deployments)

## Scope (what's OUT — explicitly)

- Provisioning new projects (managed hosting tier)
- Secret minting, env var editing (managed hosting tier)
- Live log streaming (API doesn't support cleanly; defer to v2)
- Source code viewing (Vercel API doesn't expose Git content)
- Admin override / view as user (Vercel doesn't support impersonation)

## Risks I flagged

1. **Revenue timeline** — viewer = freemium = $0 until managed hosting ships. Don't let it eat engineering time past 6 weeks.
2. **Scope creep** — don't become "the Vercel dashboard for DeesseJS users." Strict scope on DeesseJS-detected projects only.
3. **"Sign in with Vercel" ≠ ownership** — OAuth gives user identity, but accessing projects requires per-team consent. Handle the consent flow correctly.
4. **No "this is a DeesseJS project" indicator from Vercel** — detection requires the marker file in the template. Without it, viewer is useless.
5. **Don't pivot away from managed hosting** — viewer is an additional entry point, not a replacement. Roadmap stays: viewer (Q3 2026) → managed hosting beta (Q4 2026 → Q1 2027).

## Effort estimate (MVP)

5-7 engineer-weeks total, including:
- Sign in with Vercel via Better Auth: 0.5 wk
- List teams + projects + deployments: 1 wk
- DeesseJS-detection filtering: 0.5 wk
- Webhooks deployment.*: 0.5 wk
- UI dashboard (table, filters, status): 1-2 wk
- Analytics / usage display: 1 wk
- Polish + tests: 1 wk

## Trigger to revisit

The user said "don't change anything yet." So this is parked. Triggers to revisit:
- User decides on the product roadmap (Q3 2026 planning?)
- A design partner asks "can I see my DeesseJS deploys somewhere?"
- The managed hosting beta gets delayed and we need a faster path to user value
- Marketing wants a PLG top-of-funnel for the Cloud brand

## What NOT to do

- ❌ Don't amend any A/B/C docs until the user decides
- ❌ Don't change the vendor stack baseline (8-vendor managed hosting stays as-is)
- ❌ Don't start building the viewer without explicit go-ahead
- ❌ Don't rename "DeesseJS Cloud" — it should hold both "viewer" and "managed hosting" meanings

## What TO do

- ✅ Keep this idea visible (this memory)
- ✅ Reference [[reference-vercel-api-for-viewer]] when feasibility is questioned
- ✅ Reference [[research-snapshot-2026-06-26]] for the vendor sources
- ✅ When the user opens this conversation again, surface this idea + ask if they want to act

## Roadmap (proposed 2026-06-26)

| Phase | Quand | Surface | Effort |
|---|---|---|---|
| **Step 1 : Viewer Vercel** | Q3 2026 | Sign in with Vercel + list projects + list deployments + basic analytics | 5-7 sem |
| **Step 2 : DB browser** | Q4 2026 | `drizzle-studio-middleware` (MIT) + Turso scoped tokens + auth mapping | 4.5-5.5 sem |
| **Step 3 : Managed hosting beta** | Q1-Q2 2027 | Provisioning, secret minting, control plane actions (per the original vendor stack) | TBD |
| **Step 4 : Enterprise tier** | Q3 2027+ | Better Auth Cloud Enterprise centralisé + SSO/SAML/audit unifié | TBD |

## Step 2 — Viewer + Turso + Drizzle Studio embedded (added 2026-06-26)

After step 1 ships, the natural progression is **database visibility** : same user can browse their DeesseJS project's DB through the same viewer surface.

**How it works :**
- Viewer user (already signed in via Vercel OAuth) clicks "Browse DB"
- Viewer checks mapping table: does this Vercel user own this tenant DB?
- If yes: viewer mints a **short-lived (15min) read-only Turso token** for that DB
- Embeds Drizzle Studio component (from `@drizzle-team/studio`) with the token
- User browses schema, runs queries, views data
- On sign-out or T+15min: viewer revokes the token via `auth/rotate`

**Vendors involved :**
- **Drizzle Studio** (embedded component, `@drizzle-team/studio` — B2B, pricing opaque, contact sales)
- **Turso** (already in stack — per-DB scoped tokens, read-only, expiration all built-in)
- All other infra (CF Workers, Better Auth, Vercel REST) already in stack

**Three risks to resolve before ship :**
1. **✅ Drizzle Studio pricing** — RESOLVED. Use `drizzle-studio-middleware` (MIT) + CDN frontend (free). Path B per [[reference-drizzle-studio-embedding]].
2. **⚠️ Frontend CDN dependency** — `local.drizzle.studio` is closed source but free. Mitigation: self-host CDN assets if needed.
3. **⚠️ Read-only enforcement** — sandbox test "does Drizzle Studio respect Turso read-only token?"
4. **⚠️ Auth mapping** — recommend reading tenant DB name from Vercel env vars via REST

**My opinion :** **yes, this is the right step 2** if the three risks resolve acceptably. The pattern is validated by Turso themselves (first Drizzle Studio embed customer since Oct 2023). Reuses everything from step 1. Same DX win philosophy. Full detail in [[reference-drizzle-studio-embedding]].

Related: [[reference-vercel-api-for-viewer]] (step 1 API mapping), [[reference-drizzle-studio-embedding]] (step 2 Drizzle Studio + Turso tokens), [[reference-template-auth-better-auth-candidate]] (Better Auth × Vercel OAuth for step 1 auth), [[research-snapshot-2026-06-26]] (vendor sources), [[project-cloud-vendor-stack]] (managed hosting baseline — unchanged)
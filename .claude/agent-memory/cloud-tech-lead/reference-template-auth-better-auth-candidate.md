---
name: reference-template-auth-better-auth-candidate
description: Better Auth evaluated 2026-06-26 (round 3 — with Vercel OAuth). Better Auth has Sign in with Vercel as a native OAuth provider (PR #6316, merged 2025-11-26). Vercel's IdP is a real OIDC provider. Template can ship "Continue with Vercel" out of the box.
metadata:
  type: reference
---

**Round 3 (2026-06-26 — after user question about OAuth2 Vercel):** User asked if Better Auth has a feature for OAuth2 with Vercel. Confirmed: **Better Auth has added "Sign in with Vercel" as a first-class OAuth provider** via PR #6316 (merged 2025-11-26, locked 2026-04-01). The user knew this was a thing before I looked.

## What I found

### Vercel side — "Sign in with Vercel" is a real OIDC provider

**Sources :** `vercel.com/docs/sign-in-with-vercel`, `vercel.com/docs/sign-in-with-vercel/getting-started`, `vercel.com/changelog/sign-in-with-vercel`.

- **Generally available** (changelog: "Sign in with Vercel now generally available").
- **OAuth 2.0 + OIDC** — standard framework, not custom.
- **For end users** — anyone with a Vercel account can use it to sign in to third-party apps. Different from OIDC Federation (service-to-service).
- **Authorization URL:** `https://vercel.com/oauth/authorize`
- **Token endpoint:** `POST https://api.vercel.com/login/oauth/token`
- **Token revocation:** `POST https://api.vercel.com/login/oauth/token/revoke`
- **Userinfo:** `GET https://api.vercel.com/login/oauth/userinfo`
- **Token introspection:** `POST https://api.vercel.com/login/oauth/token/introspect` (RFC 7662)
- **Required scopes:** `openid email profile offline_access` (`openid` required, others optional)
- **PKCE:** S256 **required**
- **Callback URL:** `{origin}/api/auth/callback`
- **Tokens:**
  - **ID Token:** signed JWT, identifies user
  - **Access Token:** 1 hour, bearer, for Vercel REST API
  - **Refresh Token:** 30 days, rotates on use
- **Env vars convention:** `VERCEL_APP_CLIENT_ID` + `VERCEL_APP_CLIENT_SECRET`

### Better Auth side — Vercel is now a built-in social provider

**Source:** `github.com/better-auth/better-auth/pull/6316` (merged 2025-11-26).

- **Provider ID:** `vercel`
- **Configured via:** `socialProviders.vercel` in `auth.ts`
- **Scopes:** `openid`, `email`, `profile`, `offline_access` (configurable)
- **PKCE required** (Vercel mandate)
- **Callback URL:** `/api/auth/callback/vercel`
- **Supports `mapProfileToUser`** for custom field mapping
- **Tests cover:** PKCE, scopes, callbacks, existing-user flows
- **Demo app** has a "Sign in with Vercel" button already
- **Configuration builder** in Better Auth docs includes the Vercel icon

**Setup (3 steps per Better Auth docs):**
1. Register a Vercel App at vercel.com dashboard, set redirect URL `/api/auth/callback/vercel`
2. Set env vars `VERCEL_APP_CLIENT_ID`, `VERCEL_APP_CLIENT_SECRET`
3. Add to auth.ts:
```ts
socialProviders: {
  vercel: {
    clientId: process.env.VERCEL_APP_CLIENT_ID,
    clientSecret: process.env.VERCEL_APP_CLIENT_SECRET,
  }
}
```

## Why this matters for DeesseJS Cloud

### Use cases in our model

1. **"Continue with Vercel" button in tenant apps.** Any tenant app can add a third OAuth button alongside Google/GitHub. Especially powerful for **developer-targeted tenants** (which is most of our design partner profile).

2. **Auto-provisioning from Vercel team membership.** If a tenant's customer uses "Continue with Vercel", Better Auth gets their email + (potentially) Vercel team info via the access token. The tenant app could then map that to the `organization` plugin (Better Auth's built-in multi-tenancy primitive). Auto-link the Vercel team → tenant's organization.

3. **Zero-friction onboarding for Vercel users.** A developer who already has a Vercel account can sign up to a tenant app in 2 clicks — no new password.

### What it does NOT replace

- **Vercel OIDC Federation** (service-to-service auth) is a separate product. Different endpoints (`oidc.vercel.com/[team]`), different tokens (RS256 JWT with `owner:team:project:env` subject), different lifetime (1h prod/preview). Used for tenant app → control plane auth.
- **"Sign in with Vercel"** (user-facing OAuth) is what we just discussed. Used for end users → tenant app auth.
- **Do NOT conflate the two.** They serve different purposes and live at different URLs.

### Per-tenant OAuth app registration

Each tenant needs to:
1. Register their own OAuth app on vercel.com (manual step, dashboard)
2. Get their own `VERCEL_APP_CLIENT_ID` + `VERCEL_APP_CLIENT_SECRET`
3. Set as env vars in their Better Auth config

This is **not shareable across tenants** — each tenant has its own OAuth app, its own client credentials. This is **good** for security (no shared secrets) but means we can't pre-bake credentials in the template.

**Possible Cloud-level automation (v2):**
- If Vercel exposes an API for programmatic OAuth app registration (need to verify — [non vérifié])
- The control plane could pre-register the OAuth app on behalf of each tenant during provisioning
- Inject the credentials into the Better Auth config
- Today: manual step

### Impact on Cloud vendor stack

**Zero impact on v0.** "Sign in with Vercel" is a feature of the tenant app (template scope), not the Cloud control plane. The Cloud 8-vendor stack baseline remains unchanged.

**For the template (buyer-template scope — escalate to tech-lead):**
- Recommend Better Auth + pre-enable "Sign in with Vercel" for developer-targeted tenants
- Document the manual OAuth app registration step in the template README
- This is a **DX win for free** — no additional vendor cost

## Lessons captured

- **When researching a vendor's feature list, also check their native integrations.** Better Auth + Vercel having a first-class integration means less custom code per tenant.
- **"Sign in with X" and "OIDC Federation with X" are different products.** Don't conflate them — different endpoints, different tokens, different use cases.
- **OAuth app registration is per-tenant, not per-operator.** We can't share OAuth client credentials across tenants. Each tenant manages their own.
- **The control plane might automate OAuth app registration in v2 if Vercel exposes the API.** Verify when designing B5 or the v2 provisioning flow.

## Open questions (Exa credit limits blocked some fetches)

- **[Non vérifié]** Does Vercel expose a programmatic API for OAuth app registration? (would let control plane auto-register per tenant)
- **[Non vérifié]** Does Better Auth's "Sign in with Vercel" expose the Vercel team info via the access token's userinfo endpoint, or only the basic profile?
- **[Non vérifié]** What's the rate limit on the Vercel OAuth endpoints?

## When to escalate / revisit

- **Now:** escalate to `tech-lead` that "Sign in with Vercel" should be a documented option in the buyer-template.
- **v2:** if we automate per-tenant OAuth app registration, this needs to be in the Cloud provisioning flow.
- **v2:** if a design partner asks for "single sign-on with our Vercel team", Better Auth + Vercel OAuth + `organization` plugin can deliver this.

## Related memories

- [[project-cloud-vendor-stack]] (unchanged — Cloud stack doesn't include Better Auth)
- [[project-supabase-evaluated-rejected]] (parallel precedent: vendor research round)
- [[project-fresh-exa-credit-limits-2026-06-26]] (research gaps to retry)
- [[feedback-no-deep-mode-on-fresh]] (user directive on research mode)
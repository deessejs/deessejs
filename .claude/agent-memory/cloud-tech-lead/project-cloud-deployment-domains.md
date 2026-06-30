---
name: project-cloud-deployment-domains
description: Cloud lives at app.deessejs.com (operator-owned wildcard *.deessejs.com). Web (marketing) lives at deessejs.com. Confirmed by user on 2026-06-30.
metadata:
  type: project
---

## The split

| Domain | App | Purpose | Auth |
|---|---|---|---|
| `deessejs.com` | `apps/web` (web-tech-lead) | Marketing site, blog, changelog, public docs | None — public, SEO-driven |
| `app.deessejs.com` | `apps/app` (cloud-tech-lead) | Cloud v0 buyer app (managed hosting) | Required for all routes except `(unprotected)/` auth flow |

The operator owns a wildcard `*.deessejs.com` DNS zone under Cloudflare, so `app.deessejs.com` doesn't need per-tenant DNS — see [[project-cloud-vendor-stack]] for the DNS primitive.

**Why:** The marketing site (web) and the buyer app (Cloud) are two different products targeting two different audiences (prospects vs customers). Sharing a domain would force the marketing team to coordinate every route with Cloud's auth surface. Splitting them keeps each team's blast radius small.

## How to apply

- **Cloud code (`apps/app`)** — assume the host is `app.deessejs.com`. Auth callback URLs, OAuth redirects, `metadataBase`, and any absolute URL must use that host, not `deessejs.com`.
- **Web code (`apps/web`)** — leave alone (web-tech-lead's scope). Touching apps/web for Cloud concerns is out of scope.
- **Cross-app links** — `apps/web` may link to `app.deessejs.com/login` for "Sign in" CTAs. `apps/app` should not link back to the marketing site except for "Learn more" docs-style anchors.

## What's still pending

- `metadataBase` in `apps/app/src/app/layout.tsx` is still the create-next-app default. When Cloud branding lands, set it to `new URL("https://app.deessejs.com")`.
- `apps/web/src/app/(unprotected)/(auth)/login/page.tsx` currently has no awareness of the cross-domain jump — when a buyer signs in via the marketing site's "Sign in" button, they'll need a redirector (out of scope here, owned by web-tech-lead).
- Per-tenant eject domains (once buyer leaves Cloud) are independent of this split — see [[project-cloud-portability-tax]] for that flow.

Related: [[project-apps-cloud-scope-and-boundaries]] (apps/app ownership), [[project-cloud-vendor-stack]] (DNS primitive), [[project-cloud-v0-private-beta]] (the v0 plan)
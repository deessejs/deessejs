# DeesseJS Cloud

> This document sets the scope of the Cloud product. Cloud is the runtime that backs the Pro templates, not a separate SaaS.

This document is strategy. Implementation lives in `apps/app/` and the CLI.

## Context

Templates ship as code. The Pro layer needs somewhere to put the code that the Open Community and the Pro Education layers do not see. Cloud is that place. Cloud also authenticates the CLI for the buyer, so the buyer can pull the code they paid for.

## Scope V1

Three jobs, no more:

- **Authenticate the CLI.** The buyer proves they own a Pro license.
- **Host the Pro template source.** Private code, separate from Open Community.
- **Grant access on payment.** When the buyer pays, Cloud provisions the access.

Out of scope for V1:

- Hosting the buyer's app.
- Observability on the buyer's app.
- Scaling, queues, cron, realtime.
- Multi-region.

These belong to a separate Cloud subscription product, deferred to v2.

## Repository layout

Two repos live in the deessejs org:

- `deessejs/templates` — public. Open Community + Pro Education. MIT.
- `deessejs/pro-templates` — private. DeesseJS Pro only. License-bound.

The public repo carries the full code for every Pro template, gated by a license file. The license file is a sentinel that the buyer must hold, in the form of a Cloud-verified license token. The V1 mechanism is grep-able and ugly. It works because the Pro templates have a marker that the Open Community templates do not. The V2 mechanism is a proper split, see the "Split repos" open question.

## Identity model

One buyer, one account. The license is bound to the buyer, not to a team or an org. The buyer shares the code with their client only by editing the brand strings the buyer is allowed to rebrand under the Pro terms.

A buyer holds:

- a Cloud account (`cloud.deessejs.com`)
- a license token (issued by Cloud on first purchase)
- a CLI session (issued by Cloud on `deessejs auth login`)

## Auth flow

The CLI uses the [better-auth device-authorization](https://www.better-auth.com/docs/plugins/device-authorization) flow:

1. Buyer runs `deessejs auth login`.
2. CLI prints a short code and a URL (`https://auth.deessejs.com/device`).
3. Buyer opens the URL in their browser, pastes the code.
4. The browser confirms the device. CLI polls Cloud, gets the session token.
5. The CLI stores the token locally. Future runs do not re-authenticate until the token expires.

This is the same flow as `gh auth login`. Buyers on a remote workstation copy-paste a code; buyers on the same workstation can complete the loop without leaving the terminal.

## Provisioning flow

When the buyer pays for a Pro template, Stripe sends a webhook to Cloud. Cloud runs a side-effect:

1. Bind the Stripe customer to a Cloud account (create the account if missing).
2. Issue a license token for the paid template.
3. Grant the buyer access to the private repo (`deessejs/pro-templates`).
4. Send the buyer the welcome email with the auth URL and the install command.

The buyer's `deessejs init <pro-slug>` then resolves to the private repo, not the public one. The CLI's auth check confirms the license is bound to the current account.

This is the only way Pro templates are gated. The license check happens at the CLI, not in the source code. The source code stays clean.

## CLI surface

Three commands, no more, for V1:

- `deessejs auth login` — open the device flow, write the token locally.
- `deessejs auth status` — show the current account and the licenses bound to it.
- `deessejs init <pro-slug>` — fetch the template. Uses the local token. Fails early if the license is missing.

Open Community templates continue to work without an account. Pro Education templates require a verified student account. Pro templates require a paid license.

## Pricing integration

Cloud basics — auth, repo access, license check — are included in the Pro template price. The buyer pays for the template, gets the Cloud access for that template as part of the deal. No separate Cloud SKU for the basics.

A separate Cloud subscription product, deferred to v2, covers the scale-up features:

- observability
- queues
- staging environments
- runbooks
- priority support

The pricing doc (`pricing.md`) lists this as the v2 subscription. The math is open.

## What Cloud is not

Cloud is not a hosting platform. The buyer deploys the Pro template themselves or hires Nesalia Inc. separately. Cloud is not a code-review service. Cloud is not a marketplace. Cloud is not an analytics dashboard. All of these are tempting features to fold in. None of them belong to the V1 scope.

## Open questions

1. **Split repos.** Currently the public repo carries the full code for every Pro template, gated by a license file. A proper split would put the Pro templates in a separate repo that the public repo cannot see. The split is the more secure shape. The single-repo shape is the simpler one to ship. Defer until the first Pro template ships.
2. **Refund provisioning.** When the buyer refunds under the 14-day window, Cloud must revoke the access. The Stripe webhook handler needs a `charge.refunded` branch. Trivial but worth a test.
3. **License transfer.** If a buyer sells the codebase to a third party, does the third party get Cloud access? The pricing doc says re-sale is allowed, but the license is bound to the buyer's account. A clean transfer would need a `deessejs auth transfer` command. Defer.
4. **Multi-environment.** The buyer may want to install the same template in CI, on staging, on a colleague's machine. Each machine is a separate session. The refresh token model handles this. Worth a test before the v1 ship.
5. **Pro Education auth.** Verified students need a Cloud account. The verification flow reuses the Pro Education path from the pricing doc. Worth a dedicated auth flow or a shared one with Pro.
6. **Identity provider.** better-auth supports OAuth, magic link, password, and more. The V1 surface is the device-authorization plugin only. Worth picking a primary identity provider (GitHub?) for the buyer experience beyond the CLI.

## Cross-references

- [pricing.md](./pricing.md) — pricing model, the three layers, the v2 subscription
- [architecture.md](./architecture.md) — stack reference (Cloud is `apps/app`, source in the repo)
- [README.md](./README.md) — product brief
- [build-roadmap.md](./build-roadmap.md) — feature sequencing
- [documents/internal/marketing/](../marketing/) — surface plan
- [packages/api/src/templates.ts](../../../packages/api/src/templates.ts) — current template registry (Pro attribution goes here once the schema lands)
- [packages/auth/](../../../packages/auth/) — better-auth setup, device-authorization plugin lives here

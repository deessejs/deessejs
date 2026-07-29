# DeesseJS — Onboarding

> **The buyer's first hour, designed.** Onboarding is itself a product surface — Apple-positioned means the wizard is polished, the docs first-hour is a feature, and the buyer goes from clone to first deploy in 30 minutes.

## Why onboarding is load-bearing

DeesseJS ships with 6 external services to provision (Postgres + Upstash Redis + R2 + Stripe + Resend + Trigger.dev) plus 4 internal features to configure (Better Auth, Fumadocs, oRPC contracts, Hono routes). The first hour determines whether the buyer keeps going or gives up.

**The competitor baseline:** most templates ship a README that says "set up these env vars." The buyer spends 2-4 hours wiring services, hits errors, asks on Discord, gives up at hour 3. The product is dead.

**The DeesseJS bar:** clone → wizard → 30 minutes → first deploy. Every friction point is a feature bug.

## The wizard structure

**Multi-step setup wizard** + **post-signup checklist**.

### Wizard (runs once, on first run)

1. **Welcome** — what DeesseJS is, what you're about to do, time estimate (30 min)
2. **Database** — choose Postgres host (Neon / Supabase / Railway / own), paste connection string
3. **Upstash Redis** — sign up, create Redis DB, paste REST URL + token
4. **Cloudflare R2** — sign up, create bucket, generate API token, paste credentials
5. **Stripe** — test mode first (live mode is a separate step), paste secret + webhook secret
6. **Resend** — sign up, verify domain (or use the sandbox domain for dev), paste API key
7. **Trigger.dev** — sign up, create project, paste secret + URL
8. **App config** — app name, primary domain, default locale, brand color
9. **Done** — runs the verification script, shows what's working, links to the docs

Each step:
- Has a "why we need this" tooltip
- Has a direct link to the service's signup page
- Has a "skip for now" (except Database — required)
- Validates the credentials before allowing the next step

### Post-signup checklist (persistent in the admin sidebar)

Persistent until 100% complete. Tracks:

- [ ] Connect a domain
- [ ] Set up the first org
- [ ] Create your first product
- [ ] Send a test email
- [ ] Process a test Stripe payment
- [ ] Run a test background job
- [ ] Upload a file to R2
- [ ] Test a real-time notification
- [ ] Customize the landing page copy
- [ ] Read the "Deleting features" doc

## The 6 services, ranked by setup friction

| Service | Friction | Order in wizard |
|---|---|---|
| **Postgres** | Low — Neon / Supabase / Railway all have 1-click signup + free tier | 2 |
| **Upstash Redis** | Low — Upstash signup, 1-click DB create, copy 2 strings | 3 |
| **Cloudflare R2** | Medium — R2 requires a Cloudflare account, manual bucket creation, API token generation | 4 |
| **Stripe** | Low (test mode) — Stripe signup, copy test secret + webhook secret | 5 |
| **Resend** | Low — Resend signup, copy API key (domain verification can wait) | 6 |
| **Trigger.dev** | Medium — Trigger.dev signup, project create, paste secret | 7 |

**Why this order:** each step's output is a single string (or two) to paste. The wizard doesn't try to provision the services for the buyer (that requires OAuth flows we don't want to build). It walks them through *manual* provisioning in the easiest order.

## The buyer's first hour (the narrative arc)

**Minute 0-5: Clone + first run**
- Buyer runs `git clone`, `pnpm install`, `pnpm dev`
- The wizard launches in the browser at `localhost:3000/setup`
- The buyer is welcomed with a 30-minute estimate and a "let's go" button

**Minute 5-25: Wizard**
- 8 steps, each with a clear "what to do" + "paste here"
- Each step validates the credentials and shows a green check
- The buyer can skip the optional ones (R2, Stripe, Resend, Trigger.dev) and come back
- A persistent "your progress" indicator at the top

**Minute 25-30: Verify + first deploy**
- Wizard runs `pnpm verify` which checks every service
- Green check = "all good, here's the docs"
- Red ✗ = "this service is broken, here's how to fix it"
- The buyer can deploy to Vercel from this page (one-click, env vars auto-populated)

**Minute 30-60: First feature**
- Buyer follows the "Build your first feature" doc (Fumadocs)
- A guided walkthrough: create an org, invite a teammate, set up a billing plan, send a test email
- Ends with "you just shipped your first SaaS feature with DeesseJS"

**Hour 1-2: Customize + delete**
- Buyer follows the "Deleting features" doc (Fumadocs)
- Removes the in-app notifications feature end-to-end
- Confirms the app still runs
- This is the "modular by design" proof — they felt it, not just read about it

**Hour 2+: Ship**
- Buyer customizes the landing page, the auth flow, the billing tiers
- Posts to Twitter / Indie Hackers / Show HN
- Becomes a DeesseJS customer (and possibly a testimonial)

## The "Deleting features" flagship doc

This is the wedge's proof point. It must be:
- A flagship Fumadocs page (top-level in the nav)
- A 5-10 minute walkthrough with screenshots
- End-to-end: actually delete a feature, confirm the app still works
- Tested in CI (the "delete test" is part of every PR)

**Structure:**
1. What "modular" means in DeesseJS (the contract from architecture.md)
2. Why we test it (link to the CI workflow that runs delete tests)
3. Walkthrough: deleting the in-app notifications feature
   - Identify the files in `src/features/notifications/`
   - Find the imports in `src/app/api/[[...route]]/route.ts`
   - Remove the import
   - Delete the directory
   - Run `pnpm test:delete --feature=notifications`
   - See the app still runs
4. Walkthrough: deleting the blog feature (simpler)
5. Walkthrough: deleting the docs feature (most complex)
6. What breaks if you skip a step (the "before" state)
7. How to re-add a feature (it's git-revertable if you tracked your changes)

## Onboarding-specific design principles

1. **No "read the README first" gates.** The wizard IS the README, in interactive form.
2. **No OAuth flows in v1.** Manual credential paste is faster to ship, easier to debug, and matches the audience (technical founders who can paste an API key).
3. **Every step is reversible.** If a buyer pastes the wrong Stripe secret, they can edit `.env` and re-run the verification.
4. **The wizard is itself a feature in the modular architecture.** The buyer can delete it (replace with their own onboarding) without breaking anything else.
5. **The post-signup checklist is the admin's persistent sidekick.** It doesn't dismiss when complete — it just turns green and shrinks. Buyers come back to it when they're not sure what to do next.

## Open onboarding questions

- **OAuth flows in v2.** Worth revisiting once the manual path is polished. OAuth would let the wizard provision the services for the buyer (no copy-paste), but it adds significant complexity.
- **Demo data on first run.** Should the wizard seed sample orgs / users / products so the buyer can explore before customizing? Pro: faster "first SaaS" feel. Con: more to delete.
- **The "deploy to Vercel" integration.** Is one-click Vercel deploy worth building, or do we just point at `vercel deploy` in the docs?
- **Domain setup.** The wizard step "connect a domain" is the most variable per buyer (DNS, hosting, etc.). Worth a dedicated walkthrough doc, or punt to "ask your hosting provider"?

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Architecture: [`architecture.md`](./architecture.md) — stack + modular contract
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge + copy
- Pricing: [`pricing.md`](./pricing.md) — pricing strategy
- Research: [`research.md`](./research.md) — market + buyer voice

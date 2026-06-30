---
name: feedback-trust-user-on-cost-assumptions
description: When the user pushes back on a vendor pricing claim or assumption of vendor lock-in, dig into the open-source / cheaper alternatives before locking in the B2B path. Trust user intuition on cost.
metadata:
  type: feedback
---

**Rule:** When the user pushes back on a vendor pricing or lock-in claim, **don't defend the original assessment** — dig into the open-source / cheaper / multi-distribution alternatives before concluding. The user's intuition on cost is usually right.

**Why:** On 2026-06-26, when researching step 2 of the viewer-first Cloud roadmap (Turso + Drizzle Studio embedded), I overweighted the opaque B2B pricing of `@drizzle-team/studio` (closed-source embeddable component) and presented "Drizzle Studio pricing is a risk to resolve" as a blocker. The user pushed back: "drizzle studio vient de drizzle kit, c'est gratuit." I was wrong. After deeper research:
- Drizzle Kit is MIT-licensed open source (confirmed by AndriiSherman in 2023)
- The frontend at `local.drizzle.studio` is closed-source but free to use
- A community package `drizzle-studio-middleware` (MIT, Hono-compatible) extracts the open-source backend and mounts it as middleware in our CF Workers control plane
- Path B (open-source middleware + free CDN frontend) makes step 2 ~$0 software, not the multi-thousand-dollar B2B embed I had implied

I had **three distributions** confused into one pricing story:
1. `drizzle-kit studio` CLI (free, MIT)
2. `@drizzle-team/studio` embeddable component (closed-source, B2B pricing)
3. Drizzle Gateway Docker ($20/year per slot — much cheaper than I'd estimated)

**Lesson:** When a vendor has multiple distributions, the user usually knows which one is actually relevant. Push back gently, dig deeper, and let the user steer the question framing.

**How to apply:**
- When proposing a vendor and pricing, explicitly enumerate the distributions if more than one exists.
- When the user pushes back on a cost claim, treat it as a hypothesis to verify, not an objection to defend.
- Especially with open-source-leaning projects (Drizzle, Better Auth, Trigger.dev, Turso), assume there is a free path until proven otherwise. Search the GitHub discussions and community packages before quoting B2B pricing.
- Document the distribution(s) in `reference-*.md` files so future sessions don't re-derive the analysis.

Related: [[reference-drizzle-studio-embedding]] (the corrected analysis), [[feedback-no-deep-mode-on-fresh]] (similar pattern: user directive on research approach)
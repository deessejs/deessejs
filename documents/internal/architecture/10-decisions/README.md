# `10-decisions/` — Architecture Decision Records

## Purpose

The historical record of **why** we made significant architecture choices. Each ADR captures the context, the options we considered, the decision, and the consequences we accepted.

When someone asks in 6 months "why did we pick Bun for the CLI?" or "why is the public API mounted in Next.js and not standalone?", the answer is an ADR in this folder — not a Slack scroll, not someone's memory.

This file is also the **canonical reference for the ADR convention itself**. If you want to write an ADR, read this file first.

## Naming and numbering

- File name: `NNNN-<short-kebab-slug>.md`, 4 digits zero-padded, sequential.
- Slug is short, kebab-case, descriptive. Examples: `0001-monorepo-turborepo.md`, `0006-rag-vector-db-deferred.md`.
- **Filenames are immutable.** Once an ADR is filed, its number and slug don't change. If the decision is reversed, the file stays; the status changes.
- **Numbers are never reused.** The next ADR is always N+1, even if N-1 is superseded.

## Status vocabulary (strict, 4 values)

| Status | When |
|---|---|
| **Proposed** | Under discussion, not yet decided. The default for a new ADR. |
| **Accepted** | Decided, implemented or in flight. The destination of every useful ADR. |
| **Superseded by NNNN** | A newer ADR has replaced this one. The file stays, the status changes. |
| **Rejected** | Considered, then not adopted. Preserved so we don't re-litigate. |

No "Draft", no "Deprecated", no "In progress". If unsure, it's Proposed. If a Proposed ADR is being implemented, the file gets updated to Accepted in the same PR that lands the change.

## Required fields on every ADR

- **Status** — one of the 4 above.
- **Date** — `YYYY-MM-DD`. The day the decision was Accepted (or Proposed for the first time). Not a relative duration.
- **Deciders** — names or roles. **Never "the team"**. If a single person decided, say who.

## Section structure (the template)

Every ADR uses the MADR shape, adapted to DeesseJS:

```markdown
# NNNN. Title (the decision, not the problem)

- **Status:** Proposed | Accepted | Superseded by NNNN | Rejected
- **Date:** YYYY-MM-DD
- **Deciders:** <names or roles>

## Context and problem statement

<the constraint, the pressure, the question we were trying to answer.
Keep it short — 1-3 paragraphs. If the context is longer, link out
to a deeper doc rather than dumping it here.>

## Considered options

1. **Option A** — <one-line summary>
2. **Option B** — <one-line summary>
3. **Option C** — <one-line summary>

<Optionally, a sentence or two per option explaining the key tradeoff
that decided the outcome. Don't repeat what's in the Decision section.>

## Decision

<The choice we made, in one or two sentences. No justification here —
it lives in Context and Consequences.>

## Consequences

**Positive:** <what we gain>
**Negative:** <what we give up>
**Neutral:** <what changes but isn't a clear win or loss>

<If the decision is a "we don't ship X" decision, add a "Why we might
revisit" subsection explaining the conditions under which this ADR
would be reversed. This prevents the door from being closed silently.>

## References

- <link to the relevant product doc section>
- <link to `01-stack/<tech>.md` if this is a tech choice>
- <link to the relevant feature spec if this is a feature-related decision>
- <link to superseded ADRs, or to ADRs that supersede this one>
- <link to any prior discussion in Slack, GH issues, deep-research reports>
```

## Garde-fous

- **Max ~100 lines per ADR.** Beyond that, the context is too broad or the options are too detailed. Split the decision, or link to an annex.
- **Cross-references are mandatory.** An ADR without a reference to the doc it defends is unauditable.
- **No retroactive editing** of substance. Edits are limited to: typo fixes, status changes, adding "Supersedes" / "Superseded by".
- **One decision per ADR.** Don't bundle "we picked X and also Y and Z" — split into separate ADRs.

## DeesseJS-specific rules

### "No" decisions also get ADRs

Many of the most-load-bearing decisions for DeesseJS are **rejections** (no multi-payment wrapper, no RAG in v1, no free tier, no mobile, no hosted variant). These are the ones that cost the most to lose — a new contributor re-debates them at every onboarding.

**Rule:** any "we don't ship X" decision whose rationale is more than one paragraph deserves an ADR. Include a "Why we might revisit" subsection in the Consequences so the door is not silently closed.

### Backfill for already-locked decisions

The product spec (`product/architecture.md`, `product/open-questions.md`) already contains many locked decisions. **Backfill them as Accepted, not as Proposed.** They are historical fact, not open discussion. The first batch is the seed set listed in the index below.

### Two kinds of decisions, two places

- **Technical / architecture decisions** → ADRs in this folder. Audience: contributors, reviewers, future us.
- **Product / business decisions** (pricing, positioning, tier gates, marketing copy) → stay in `product/*.md`. Audience: PM, founder, future us when re-evaluating strategy.

The two can cross-reference. An ADR for "we chose Stripe" can link to `product/pricing.md`. But the *decision record* lives in one place only.

### Closed open-questions point to their ADR

When a P1 from `product/open-questions.md` is decided, two things happen:

1. A new ADR is created in this folder, status Accepted.
2. The P1 entry in `open-questions.md` is replaced by a link to the ADR (not deleted — the open question's history stays).

## When to write an ADR

- A new technology is added to the stack.
- A technology is swapped or removed.
- A non-trivial architectural pattern is introduced (e.g. "all API routes go through this middleware").
- A non-trivial rejection is locked in (see the "No" rule above).
- A decision is **reversed**. The old ADR stays; status becomes "Superseded by NNNN". Don't delete history.

## When NOT to write an ADR

- Implementation details (file naming, code style) — those go in `CONTRIBUTING.md`.
- Tactical decisions (which library for a util function) — those go in a code comment or PR description.
- Reversible decisions. If it's easy to change later, the ADR is overhead.
- Decisions that already live elsewhere with full rationale (don't duplicate — link).

## Review cadence

- **Continuous** for status changes: every PR that touches an ADR updates its status (Proposed → Accepted, or adds "Superseded by"). The index table below is updated in the same PR.
- **Quarterly** for cleanup: one afternoon every 3 months. Walk the index, mark anything stale, retire Rejected ADRs to an `archive/` subfolder if the folder is getting noisy. Default review owner: whoever is tech lead that quarter.

## ADR index

The canonical index of every ADR in this folder. **Updated in the same PR as the ADR creation or status change.** New entries go at the bottom in numeric order.

| # | Title | Status | Date | Deciders |
|---|---|---|---|---|
| 0001 | Monorepo: Turborepo + pnpm workspaces | Accepted | 2026-06-17 | founder, tech lead |
| 0002 | CLI runtime and distribution: pnpm + Bun + single-file binary | Accepted | 2026-06-17 | founder, tech lead |
| 0003 | Public REST API: Hono mounted in Next.js | Accepted | 2026-06-17 | founder, tech lead |
| 0004 | ORM: Drizzle | Accepted | 2026-06-17 | founder, tech lead |
| 0005 | Auth provider: Better Auth | Accepted | 2026-06-17 | founder, tech lead |
| 0006 | RAG / vector DB: deferred from v1 | Accepted | 2026-06-17 | founder, tech lead |
| 0007 | Observability: skipped for v1 | Accepted | 2026-06-17 | founder, tech lead |
| 0008 | i18n: English-only for v1 | Accepted | 2026-06-17 | founder, tech lead |
| 0009 | Billing: direct Stripe (no Lemon Squeezy / Polar wrapper) | Accepted | 2026-06-17 | founder, tech lead |
| 0010 | v0.0.1 = `create-next-app` baseline (ratchet start) | Accepted | 2026-06-17 | founder, tech lead |
| 0011 | Repo structure: monorepo with `apps/`, `packages/`, `documents/` | Superseded by 0012 | 2026-06-17 | founder, tech lead |
| 0012 | Template-as-pattern: each `apps/*` is a DeesseJS instance | Accepted | 2026-06-17 | founder, tech lead |
| 0013 | react-email v6 unified package (single import, no `@react-email/components`) | Accepted | 2026-06-22 | founder, tech lead |
| 0014 | Resend as the only sanctioned email transport | Accepted | 2026-06-22 | founder, tech lead |
| 0015 | Admin routes — flat `/admin/*` not `/[orgSlug]/admin/*` | Accepted | 2026-06-25 | founder, tech lead |

The first 9 entries (0001–0009) are the **tech-decision seed set** to be backfilled from the product spec. Each gets its own file following the template above. Entry 0010 is the first **process decision** ADR (ratchet start). Entry 0011 was the first **structure decision** ADR, superseded by entry 0012 — Template-as-pattern — which is the canonical structure decision. See [`../../process/`](../../process/) for the process docs.

## Related

- [`../product/architecture.md`](../../product/architecture.md) — the locked architecture decisions, summarized.
- [`../product/open-questions.md`](../../product/open-questions.md) — the decisions still pending. When one is decided, it spawns an ADR and the P1 entry links to it.
- [`01-stack/`](../01-stack/) — the per-tech rationale docs that each ADR points to.
- [`04-api-surface/`](../04-api-surface/) — for ADRs about the oRPC + Hono pipeline.
- [MADR — Markdown Any Decision Records](https://adr.github.io/madr/) — the format this convention is adapted from.

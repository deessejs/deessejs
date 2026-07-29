# DeesseJS — Product Hunt Launch Playbook

> **Status:** Draft v1. Based on adversarial competitor research (2026-06-22).
>
> **Confirmed sources:** supastarter PH launches (2022, 2023), ShipFast PH launches (2023), SaasRock PH launch. 4 confirmed PH tactics, 15+ refuted claims.
>
> **⚠️ Time sensitivity:** PH's algorithm has changed multiple times since 2018-2024. These confirmed tactics are directionally sound but should be validated against current PH best practices 30 days before launch.

---

## TL;DR — The PH Playbook in 5 Rules

1. **Don't launch once.** Launch twice: v1 (M4, waitlist + demo) and v2 (M8, Cloud beta as catalyst).
2. **Comments > upvotes.** Target 500+ comments. The 6:1 ratio (ShipFast) is the north star.
3. **Own the gaps publicly.** Every skeptic comment is an opportunity to demonstrate transparency. SaasRock template: admit → frame → workaround → roadmap.
4. **Ship the showcase first.** /showcase with 3 real projects before the launch goes live.
5. **Respond to every comment for 48 hours.** PH rewards engagement. Silence = death.

---

## §1 — The Two-Launch Strategy

### Why two launches, not one

Single-launch products in this category fade. Confirmed pattern:

| Product | Launch 1 | Launch 2 | Gap |
|---|---|---|---|
| **supastarter** | Aug 2022: 9 upvotes, 83 comments | Sep 2023: 27 upvotes, 185 comments | 13 months |
| **ShipFast** | Multiple launches | Best: 137 upvotes, 816 comments, #2 day | Ongoing |

The first launch is a positioning test. The second is the conversion event.

### DeesseJS launch plan

```
PH Launch 1: DeesseJS — "The agentic SaaS template"
  When: M4 (agent primitives demo is live)
  Goal: 100+ upvotes, 500+ comments, #3 or better of the day
  Hook: first real agentic SaaS template with live demo
  Assets: /showcase live, founding member testimonials, live demo URL
  Hunter: founder personal account (not brand) — more credibility

PH Launch 2: DeesseJS Cloud — "Your agents. Our infra."
  When: M8 (Cloud private beta opens)
  Goal: 200+ upvotes, 1000+ comments, #1 or #2 of the day
  Hook: Cloud is a new product category, not just an update
  Assets: real Cloud dashboard screenshot, founding member Cloud use cases
  Hunter: consider a co-hunter with audience in the indie/AI space
```

### Launch spacing

Minimum 12 months between PH launches. The gap must coincide with a genuine ecosystem shift:
- M4 launch → Next.js version, agent workflow example, first customers
- M8 launch → Cloud is the new hook. Existing waitlist reactivates. New audience (non-technical founders).

---

## §2 — The Comment-to-Upvote Ratio

### The confirmed metric

ShipFast (Aug 31, 2023): **137 upvotes + 816 comments = 5.96:1 ratio**, #2 of the day.

This is the benchmark. Raw upvotes alone don't rank — PH's algorithm weights discussion density.

### What this means in practice

| Upvotes | Comments needed (5:1) | PH ranking expectation |
|---|---|---|
| 50 | 250 | #5-10 of the day |
| 100 | 500 | #3-5 of the day |
| 150 | 750 | #1-3 of the day |
| 200 | 1000 | #1-2 of the day |

**Target for PH Launch 1:** 100+ upvotes, 500+ comments. Achievable with 500-1000 waitlist emails + an active IH thread.

### How to generate comments (not upvotes)

Comments ≠ upvotes. You can have 1000 upvotes and 10 comments — that ranks lower than 80 upvotes and 500 comments.

**Tactics that generate comments:**
1. Ask a question in the PH description: "What's the most painful part of wiring auth for a new SaaS?" — invites answers
2. Seed with 5-10 thoughtful comments from founding members before launch (not "Congrats!") — specific observations about the product
3. Reply to every comment for 48 hours straight — PH's algorithm surfaces active discussions
4. Post a comment from the maker account with a specific, honest observation about what the product doesn't do yet — invites debate
5. Run a poll or ask for feedback on a specific feature — comment bait

**Tactics that generate upvotes but not comments (avoid):**
- Generic "great product!" comments
- Launch day announcements with no ask
- Discount codes or "first 10 get X" — upvotes, no discussion

---

## §3 — The Transparent Maker Comment Pattern

### The confirmed approach (SaasRock)

Alexandro Martinez publicly acknowledged gaps in PH comments:

> "No security tests!"
> "I ended up with no architecture"
> "So no coding or architecture standards."

This approach converted skeptics into advocates. The pattern:

1. **Own the gap** — state it plainly. Don't minimize.
2. **Frame as deliberate trade-off** — "we chose speed over perfection"
3. **Offer workarounds** — link to alternatives that fill the gap
4. **Link the roadmap** — show when it gets addressed
5. **End with humble self-deprecation** — humanizes the maker

### The DeesseJS gap list (for PH comments)

Pre-write honest responses for these predictable skeptic comments:

**"Isn't this vaporware? I don't see a real product."**
→ "You're right that the product isn't live yet — the spec is locked and the first agent workflow demo is running at [demo URL]. Founding members get day-1 access before launch. We're not asking you to buy blind — the demo is public."

**"How is this different from supastarter?"**
→ "They optimize AI for the developer (Cursor, Claude Code, Codex integration). We optimize the system for AI agents — every surface has tool-calling primitives, per-tenant metering, and usage-based billing built in. Different audience, different architecture."

**"No free tier? ShipFast has a free version."**
→ "DeesseJS Lite is the free tier — open-source subset with auth + billing + agent primitives. The paid template adds the full monorepo, all packages, admin, docs, and lifetime updates. No payment plans."

**"Who is the maker? I've never heard of this."**
→ "I'm [name]. I've spent [X months] reading every complaint about SaaS templates. The agentic shift is real and no one is building for it. The public roadmap and AGENTS.md are on GitHub."

### What NOT to do in PH comments

- ❌ Don't attack competitors — it reads as insecure
- ❌ Don't deflect with "it's in the docs" — if they asked, it's not clear enough
- ❌ Don't promise features that aren't in the spec
- ❌ Don't ignore critical comments — silence reads as avoidance
- ❌ Don't use template responses — founding members can spot them instantly

---

## §4 — The /showcase Requirement

### The confirmed pattern (SaasRock)

"I've built 5 different types of B2B apps (you can see them at /showcase)." Indexer.so: "3-day project."

Real project screenshots with time-to-ship and specific outcomes outperform any testimonial.

### /showcase must exist before PH Launch 1

Minimum viable showcase for M4:
- **3 customer projects** from founding members or sponsored builders
- Each entry: project name, URL, one-liner description, time-to-ship, screenshot
- At least one with quantified outcome (MRR launched, time saved, users acquired)
- Not polished — real and datable

### The showcase entry template

```
[Project Name]
[One-line description]
[URL]
[Built with DeesseJS: Starter / Pro / Team]
Time to first deploy: [X] days
What it does: [2 sentences max]
[1 screenshot — any state, doesn't need to be polished]
```

---

## §5 — Launch Day Operations

### 48 hours before launch

- [ ] /showcase live with minimum 3 projects
- [ ] Founding member testimonials drafted (5-7 named, quantified)
- [ ] Live demo URL ready (or screenshot if demo isn't public yet)
- [ ] PH description written: honest hook, specific claim, demo link
- [ ] 5 founding members pre-drafted comments (specific, not "Congrats!")
- [ ] Hunter account confirmed (founder personal vs. brand)
- [ ] IH thread drafted and scheduled

### Launch day (hour by hour)

**T-1 hour:** Post IH thread. "DeesseJS just launched on PH — here's the agentic thesis."

**T-0 (8am UTC — PH traffic peak):** PH launch goes live.

**T+0 to T+2:** Founder on PH continuously. Reply to every comment within 5 minutes for the first 2 hours.

**T+2 to T+8:** Reply to every comment within 15 minutes. Seed founding member comments.

**T+8 to T+24:** Continue replying. Post one maker comment with honest observation about a gap or limitation.

**T+24 to T+48:** Maintain reply cadence. Start synthesizing common questions into a FAQ section on PH.

### The IH thread strategy

Post on IH the same day as PH launch. Format:
- "I shipped [X] with DeesseJS — here's what happened"
- "DeesseJS just launched on PH — first 48 hours impressions"
- "Building a SaaS with AI agents only — build log"

Don't cross-post the same text. Adapt to IH audience (more business, less technical).

---

## §6 — Hunter Selection

### Personal account vs. brand account

**Personal account (recommended):**
- More credibility with the PH audience
- Maker's face and name = accountability
- Better for transparency pattern ("I'm the founder, AMA")
- Risk: personal account reputation tied to product

**Co-hunter (optional for Launch 2):**
- Find a co-hunter with complementary audience (AI agent builders, indie hackers)
- Trade: their audience for your launch
- The co-hunter should genuinely use or believe in the product

### Who NOT to use as hunter

- Accounts with no posting history
- Friends with no relevant audience
- Paid hunter services (PH community can spot them)

---

## §7 — What NOT to Do

From competitor analysis + refuted claims:

- ❌ **No launch without a real /showcase** — fake or empty showcase is worse than none
- ❌ **No generic "congrats!" seeding comments** — founding members should write specific observations
- ❌ **No launch without continuous comment reply for 48 hours** — PH algorithm rewards engagement
- ❌ **No "great product!" as your only maker comment** — the transparency pattern requires specific, honest observations
- ❌ **No competitor attacks** — undermines credibility
- ❌ **No launch without the live demo or a working demo URL** — the agentic claim requires proof
- ❌ **No launch without honest gap acknowledgment** — hiding limitations reads as evasion

---

## §8 — Decisions Needed

- [ ] **PH Launch 1 exact date** — coordinate with IH thread, avoid major competing launches
- [ ] **Hunter account** — founder personal vs. brand account
- [ ] **/showcase minimum** — 3 projects confirmed from founding members?
- [ ] **Co-hunter for Launch 2** — identify candidate by M6
- [ ] **Comment seeding team** — which 5 founding members will post pre-drafted comments on launch day

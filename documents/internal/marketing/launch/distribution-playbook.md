# DeesseJS — Distribution Playbook

> **Status:** Draft v1 — based on adversarial competitor research (2026-06-22). 10 confirmed claims, 15 killed. Reddit, LinkedIn, X research gaps flagged.
>
> **Sources:** 97 agents, 15 sources fetched, 25 claims verified, 10 confirmed, 15 refuted. Primary sources: supastarter PH pages, ShipFast PH pages, SaasRock PH pages, supastarter.dev/blog, makerkit.dev/blog, saasrock.com/blog.
>
> **Research coverage:** Product Hunt (strong), SEO (medium), Reddit/LinkedIn/X (weak — needs primary research).

---

## TL;DR

The confirmed playbook for DeesseJS distribution has 5 confirmed tactics and 3 open gaps:

**Confirmed:**
1. Multi-launch PH strategy with a catalyst event at M8 (Cloud beta)
2. Target 500+ comments on launch (ratio 6:1 is the PH ranking signal)
3. Transparent maker-comment engagement — own the gaps publicly
4. Real project showcase (not testimonials) on /showcase
5. SEO comparison pages at /vs/supastarter, /vs/shipfast, /vs/makerkit

**Open gaps:**
1. Reddit subreddit strategy and self-promotion handling
2. LinkedIn cadence and content format
3. X/Twitter posting patterns and viral hooks

---

## §1 — Product Hunt Launch Strategy

*See also: `product-hunt-launch.md` for the full PH playbook.*

### The multi-launch pattern (confirmed — high confidence)

supastarter's trajectory:
- **Launch 1** (Aug 17, 2022): 9 upvotes, 83 comments
- **Launch 2** (Sep 27, 2023 — "supastarter for Next 13"): 27 upvotes, 185 comments
- **Gap:** exactly 13 months

**What this means for DeesseJS:**

The first launch is not the product launch — it's a waitlist / positioning test. The second launch (M8) is the real product launch, with Cloud as the catalyst.

```
v1 homepage ships (M0/M1)     → waitlist only, no PH launch yet
Agent primitives demo (M4)     → internal milestone, not public
PH Launch 1 (M4 or M5)         → "DeesseJS — the agentic SaaS template" — waitlist + demo
Founding members sell (M3-M4)  → private to waitlist, not PH
Cloud beta opens (M8)           → new hook for PH Launch 2
PH Launch 2 (M8)              → "DeesseJS + Cloud: your agents, our infra"
```

### The comment-to-upvote ratio (confirmed — high confidence)

ShipFast's best launch: **137 upvotes + 816 comments = ratio 6:1**, #2 of the day.

PH ranks on discussion density, not raw upvotes. 500+ comments on launch day = strong POD signal.

**Target for DeesseJS:**
- 100+ upvotes (achievable with 500-1000 email waitlist + IH thread)
- 500+ comments (requires active seeding, not passive)
- Comment ratio target: 5:1 or better

### The transparent maker comment pattern (confirmed — high confidence)

SaasRock (Alexandro Martinez) publicly acknowledged gaps in PH comments:
- "No security tests!"
- "I ended up with no architecture"
- "So no coding or architecture standards."

His response template:
1. **Own the gap** — say it plainly, don't hide it
2. **Frame as trade-off** — "speed over perfection is deliberate"
3. **Offer workarounds** — link to alternatives, don't leave them hanging
4. **Link the roadmap** — show where it fits in the plan
5. **End with humble self-deprecation** — it humanizes

**For DeesseJS, the gaps to own:**
- "Not every agent primitive is documented yet" → "AGENTS.md ships at M4"
- "The demo is a mockup, not the real dashboard" → "Real dashboard at M4, demo is the spec"
- "Cloud isn't live yet" → "Private beta at M8, here's the roadmap"

### The real project showcase (confirmed — high confidence)

SaasRock: "I've built 5 different types of B2B apps (you can see them at /showcase)." Example: Indexer.so — "3-day project."

On PH, screenshots of real products outperform any testimonial. They need to be: real, dated, and specific (time-to-ship + outcome).

**For DeesseJS, the /showcase must exist before PH launch:**
- At least 3 customer projects (from founding members + sponsored builders)
- Each: project URL, screenshot, one-liner, time-to-ship, what it does
- Not polished — real and datable

---

## §2 — SEO Strategy

*See also: `seo-content-strategy.md` for the full SEO playbook.*

### The comparison page pattern (confirmed — high confidence)

supastarter.dev ships dedicated comparison pages:
- `/supastarter-vs-shipfast`
- `/supastarter-vs-makerkit`

Structure: feature table → "who should choose X" → FAQ → internal links to main product.

This captures decision-stage buyers who are already searching for the competitor.

**For DeesseJS, the priority order:**
1. `/vs/supastarter` — highest traffic (supastarter has most brand awareness)
2. `/vs/shipfast` — second most searched competitor
3. `/vs/makerkit` — third
4. `/vs/turbostarter` — fourth
5. `/vs/saasrock` — fifth

Each page: honest framing ("here's where they win, here's where we win"), no disparagement, keyword-rich headings.

### The blog keyword targeting (confirmed — high confidence)

supastarter's blog filter tags: SaaS, Next.js, tutorial, Guide, AI, Analytics, Authentication.

**For DeesseJS, the keyword clusters:**

| Tier | Keywords | Content type |
|---|---|---|
| **High intent** | "agentic SaaS template", "AI agents SaaS starter", "agents run your SaaS" | Comparison pages, pillar articles |
| **Medium intent** | "per-tenant LLM billing template", "SaaS template for AI agents", "multi-tenant metering" | Technical deep-dives |
| **Top of funnel** | "build SaaS without developers", "AI agents indie founders", "ship SaaS in days" | Buyer-voice articles, tutorials |
| **Brand** | "DeesseJS review", "DeesseJS vs [X]" | Comparison pages |

**The 3 content pillars for v1:**
1. "What 'agentic' actually means for a SaaS starter template" (week 1) — defines the term, links to docs
2. "How to run a multi-step agent workflow on DeesseJS" (week 2-3) — code walkthrough, links to demo
3. "AI agents for indie founders: from prompt to production SaaS" (week 4) — buyer voice

---

## §3 — Social Media: Reddit, LinkedIn, X

*See also: `../social/social-media-strategy.md` for the full social playbook.*

**⚠️ Research gap:** No confirmed claims about Reddit, LinkedIn, or X strategies for SaaS boilerplate competitors. The following is based on best practices from adjacent categories and should be validated with primary research before committing budget.

### Reddit (gap — needs primary research)

**Known constraints:**
- Reddit is hostile to self-promotion unless it's genuinely useful
- Most subreddits require disclosure of affiliation
- Founding members and sponsored builders are the organic Reddit presence (not the maker)
- Posting too early or too salesy gets downvoted into invisibility

**Hypothesized strategy (unverified):**
- Subreddits: r/SideProject, r/indiehacker, r/startups, r/webdev
- Content type: "I shipped X using DeesseJS" — from founding members, not the maker
- The maker's Reddit presence: answering questions about agentic SaaS, not promoting DeesseJS
- Self-post (text post) over link post — more authentic, less spammy

**What needs to be researched:**
- Which specific subreddits generate the most relevant traffic for developer tools
- What disclosure formats are accepted vs. rejected
- The time window between founding member purchase and "I shipped" post
- Whether founding members are willing to share on Reddit (they may not)

### LinkedIn (gap — needs primary research)

**Hypothesized strategy (unverified):**
- Target audience: indie hackers, solo founders, small SaaS teams building with AI agents
- Content format: short-form thought leadership on "agentic SaaS" + long-form case studies from founding members
- Posting cadence: 2-3x/week minimum to stay visible
- What works in adjacent categories: honest "I tried X and here's what happened" posts

**What needs to be researched:**
- The LinkedIn audience size and engagement rate for indie hacker / AI agent content
- Whether LinkedIn drives meaningful referral traffic vs. brand building only
- What content format generates comments vs. likes (comments = algorithm boost)

### X/Twitter (gap — needs primary research)

**Hypothesized strategy (unverified):**
- Building-in-public thread during the v1 build: weekly updates, wins, failures
- The @deessejs account follows the same cadence as the personal founder account
- Threads > single tweets for distribution
- Retweet + reply to relevant AI agent / indie hacker content (not just self-promotion)

**What needs to be researched:**
- Whether @deessejs or the founder's personal account is more effective for launch
- The optimal thread format for developer tool launches
- The posting cadence that maintains algorithm visibility without burning out

---

## §4 — Cross-Channel Patterns

### The 4 confirmed patterns across ALL successful launches

1. **Multi-launch with catalyst** — not a one-time launch. Supastarter (13 months), ShipFast (5 launches). Reload with new hooks.

2. **Comment-to-upvote ratio > raw upvotes** — PH ranks discussion density. Target 5-6 comments per upvote. Every upvote should start a conversation.

3. **Transparent maker comments > polished PR** — owning gaps publicly builds more trust than deflecting. SaasRock's approach: admit, frame, workaround, link roadmap.

4. **Real customer projects > testimonials** — on PH and across social channels, real projects with time-to-ship and outcomes outperform generic praise.

### The funnel by channel

```
LinkedIn / X / Reddit (cold)
  → Blog article (top funnel: "what is agentic SaaS")
  → Homepage (mid funnel: waitlist capture)
  → PH Launch (conversion: founding member sale)
  → /showcase + case study (social proof: next buyer)
```

---

## §5 — The Launch Calendar (v1–M8)

| When | Milestone | Distribution Action |
|---|---|---|
| **M0/M1** | v1 homepage ships | 3 SEO blog posts (pillar content). IH thread. No PH yet. |
| **M2** | Waitlist hits 200+ | Start Reddit seeding (founding members post "I signed up"). Founder personal LinkedIn active. |
| **M2** | **NEW (2026-06-24)** | Ship `npx skills add deessejs/deessejs` (parity move vs. NextForge v6 skill). AGENTS.md at monorepo root. |
| **M3** | Founding member offer opens | Private email to waitlist. 48h head start. PH launch 1 prep begins. |
| **M3** | **NEW (2026-06-24)** | `/vs/next-forge` comparison page ships (priority #1 — default Google result). |
| **M3–M4** | Founding members active | IH thread: "I'm building X with DeesseJS." Sponsored builder content starts. |
| **M4** | Agent primitives demo + founding members sell | PH Launch 1. /showcase goes live with founding member projects. |
| **M4** | **NEW (2026-06-24)** | PH Launch 1 talking point: "first paid SaaS template with an installable agent skill" (parity with NextForge, monetisation differentiator). |
| **M4–M6** | Post-PH1 feedback loop | Update based on comments. `/vs/supastarter`, `/vs/shipfast`, `/vs/makerkit` comparison pages go live. |
| **M7** | Cloud beta prep | New hook for PH2 identified. Tease on X/LinkedIn. |
| **M8** | Cloud beta opens | PH Launch 2 with Cloud as the catalyst. Founder post-mortem. |

---

## §6 — Decisions Needed

- [ ] **PH Launch 1 timing** — M4 (with agent primitives demo) or M5 (after founding members have something to show)?
- [ ] **Maker's personal account vs. brand account** — which drives more launch-day traffic on X/LinkedIn?
- [ ] **Reddit strategy** — primary research needed. Who is the best founding member to seed Reddit? When do they post?
- [ ] **LinkedIn/X cadence** — 2-3x/week minimum. Who owns this? The maker? A content contractor?
- [ ] **/showcase gate** — minimum 3 projects before PH Launch 1. Confirmed?

---

## Cross-references

- `../landing/landing-page.md` — homepage strategy, v1/v2/v3 page structure
- `product-hunt-launch.md` — detailed PH playbook
- `seo-content-strategy.md` — full SEO and content strategy
- `vs-next-forge-comparison.md` — **`/vs/next-forge` page draft (2026-06-24)**
- `npx-skills-parity-spec.md` — **`npx skills add deessejs/deessejs` spec (2026-06-24)**
- `../social/social-media-strategy.md` — Reddit, LinkedIn, X strategy (with research gaps)
- `../research/competitive-analysis.md` — updated competitor analysis from research findings + NextForge deep-dive (2026-06-24)

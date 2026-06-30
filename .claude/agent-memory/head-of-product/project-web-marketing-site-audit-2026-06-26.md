---
name: project-web-marketing-site-audit-2026-06-26
description: Business-level audit of apps/web marketing site — what's shipped, what's at risk, positioning drift, footer ecosystem leakage, conversion funnel dead ends, SEO/GEO gaps, and the 6 ranked actions needed before founder pricing closes 2026-07-31.
metadata:
  type: project
---

# apps/web marketing site audit (2026-06-26)

Triggered by user request to "analyze apps/web" from a business-ecosystem angle. Read every key file in the marketing app surface (layout, home, pricing, header, footer, blog engine, content-collections, auth pages, sitemap, RSS). Full report was delivered in the conversation; this is the load-bearing summary.

## What ships today (verified)
- Home with hero + features + why-choose + pricing teaser + FAQ + CTA
- Dedicated /pricing with tier grid + Lite card + feature matrix + comparison blocks + proof + guarantee + FAQ + CTA
- /blog + /blog/[slug] + /blog/tag/[tag] via content-collections engine
- /changelog + /changelog/[slug]
- RSS feeds for both blog and changelog
- Sitemap at src/app/sitemap.ts
- Per-page metadata with canonicals, OG, Twitter, RSS types
- generateStaticParams + generateMetadata on blog post page

## The big business findings

### 1. Footer ecosystem leakage — biggest issue
home-footer.tsx lists ~17 outbound links, ~10 of which 404 or point to unverifiable subdomains:
- errors/drpc/collections/fp/admin.deessejs.com (subdomains, not surfaced anywhere else)
- academy.nesalia.com, community.nesalia.com
- /solution/autonomous-agents, /solution/workflows, /solution/github-bot, /solution/content-creation
- /oss-program, /students, /about, /help
This is either aspirational (multi-product Nesalia empire) or stale. Either way it's a credibility hit on a B2B template. Recommendation: prune to 4 columns OR build the pages.

### 2. Conversion funnel dead ends
- /pricing final CTA "Get DeesseJS" → /signup (demo, "Backend not connected yet")
- Header "Sign in" / "Get started" → /login and /signup (demo)
- Header "Docs" → external docs.deessejs.com (loses internal-link equity)
- Pricing page Lite CTA → github.com/nesalia-inc/deessejs-lite (unverifiable)
Largest conversion buttons on the conversion page lead to non-functional auth.

### 3. Positioning drift — undocumented
[[project-positioning-hybrid-2026-06]] says headline should be "Apple of SaaS templates = completeness + DX, AI-depth de-prioritized as headline." But apps/web leads with agent-first narrative in every section (hero tag pill "Agents are now first-class developers", FAQ #1 "What does 'agentic' mean", comparison block section 1 "Optimized for AI agents", tier features mention "Tool-calling agent primitives"). This isn't wrong, it's just drift. Recommend: own agent-first deliberately (it's a sharper wedge) and update the positioning doc.

### 4. Content engine thinness
- 2 blog posts (~317 + 209 words)
- 1 release
vs [[project-lead-magnets-2026-06]] which names DeesseJS Lite + State of SaaS Templates 2026 report as primary lead magnets. Neither ships from apps/web.

### 5. SEO/GEO gaps
- No robots.txt (no AI crawler allow/block policy)
- No JSON-LD anywhere (Organization, Product+Offer, FAQPage, Article all missing — biggest GEO lever)
- No /llms.txt
- No hreflang despite i18n in feature matrix
- Single sitemap (no blog/pages split)

### 6. Auth demo label exists but on-submit only
CLAUDE.md §9 says auth pages have no label. Actually the LoginCard/SignupCard DO show "Backend not connected yet" but only after submit attempt. Better UX: banner above the card. CLAUDE.md is stale on this point.

## Why this matters
Founder pricing closes 2026-07-31. ~5 weeks to ship a clean launch story. The 6 ranked actions above are scoped for tech-lead execution.

## How to apply
When working on apps/web marketing surface changes, prioritize in this order:
1. Fix conversion dead ends (small, high impact)
2. Prune footer + ship /about (1 day)
3. Add JSON-LD + robots.txt + llms.txt (1-2 days)
4. Verify Cloud + Lite links work
5. Decide agent-first vs DX-first positioning explicitly
6. Plan content calendar (Lite repo + report + cornerstone posts) — this is the growth lever